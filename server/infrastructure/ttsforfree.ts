import "server-only";
import { QuizAudioError } from "@/server/domain/quiz-audio";
import { MAX_AUDIO_BYTES, validateMp3 } from "./audio-file";

const BASE_URL = "https://api.ttsforfree.com";
const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 60000;

export function verifiedTtsForFreeUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 4096) throw new QuizAudioError("TTSForFree chưa trả về URL âm thanh hợp lệ.", 502);
  let url: URL;
  try { url = new URL(value); } catch { throw new QuizAudioError("URL âm thanh TTSForFree không hợp lệ.", 502); }
  // Official documented CDN. Never expose arbitrary URLs as audio sources.
  if (url.protocol !== "https:" || url.hostname !== "cdn.ttsforfree.com" || url.port || url.username || url.password || url.hash || !url.pathname.toLowerCase().endsWith(".mp3")) throw new QuizAudioError("URL MP3 không thuộc CDN TTSForFree đã xác minh. Job được giữ lại để kiểm tra, không tự tạo lại.", 502);
  return url.href;
}

async function providerJson(path: string, body?: object, timeout = 10000): Promise<Record<string, unknown>> {
  const key = process.env.TTSFORFREE_API_KEY?.trim();
  if (!key) throw new QuizAudioError("Chưa cấu hình API key TTSForFree.", 503);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: body ? "POST" : "GET", headers: { "X-API-Key": key, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new QuizAudioError(`TTSForFree trả HTTP ${response.status}. ${response.status === 429 ? "Đã chạm giới hạn yêu cầu; hãy chờ rồi tiếp tục." : "Kiểm tra cấu hình, quyền giọng đọc và hạn mức dịch vụ."} Không tự gửi lại yêu cầu tạo MP3.`, 502);
    }
    if (!response.body) throw new QuizAudioError("TTSForFree trả phản hồi rỗng.", 502);
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 16384) throw new QuizAudioError("Phản hồi TTSForFree quá lớn.", 502);
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const value: unknown = JSON.parse(Buffer.concat(chunks, length).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new QuizAudioError("TTSForFree trả JSON không hợp lệ.", 502);
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof QuizAudioError) throw error;
    throw new QuizAudioError("Không đọc được phản hồi TTSForFree hoặc đã hết thời gian chờ. Không tự gửi lại yêu cầu tạo MP3.", 502);
  }
}

export async function createTtsForFreeJob(text: string, voiceId: string, pitch: number): Promise<string> {
  if (!text.trim() || [...text].length > 5000 || !voiceId || voiceId.length > 1024 || pitch !== 0) throw new QuizAudioError("Nội dung hoặc giọng đọc không hợp lệ (tối đa 5.000 ký tự mỗi đoạn).");
  const value = await providerJson("/api/tts/createby", { Texts: text, Voice: voiceId, Pitch: pitch, ConnectionId: "", CallbackUrl: "" });
  const id = typeof value.Id === "number" && Number.isSafeInteger(value.Id) ? String(value.Id) : value.Id;
  if (typeof id !== "string" || !/^[1-9]\d{0,19}$/.test(id)) throw new QuizAudioError("TTSForFree không trả mã job hợp lệ. Kiểm tra lịch sử dịch vụ trước khi tạo lại.", 502);
  return id;
}

/** No POST retries. A saved job survives timeout and manual continuation only polls GET. */
export async function waitForTtsForFreeJob(jobId: string): Promise<string> {
  if (!/^[1-9]\d{0,19}$/.test(jobId)) throw new QuizAudioError("Mã job TTSForFree không hợp lệ.", 502);
  const deadline = Date.now() + MAX_WAIT_MS;
  for (let attempt = 0; attempt < 12 && Date.now() < deadline; attempt++) {
    const value = await providerJson(`/api/tts/status/${jobId}`, undefined, Math.max(1, Math.min(10000, deadline - Date.now())));
    if (value.Status === "SUCCESS" || value.StatusId === 200) return verifiedTtsForFreeUrl(value.Data);
    if (value.Status === "ERROR" || value.StatusId === -100) throw new QuizAudioError("Job TTSForFree đã kết thúc với lỗi. Kiểm tra tài khoản dịch vụ; nếu xác nhận tạo lại, hệ thống sẽ gửi job mới và có thể trừ credits.", 502, "TTS_JOB_FAILED");
    if (attempt < 11 && Date.now() + POLL_INTERVAL_MS < deadline) await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    else break;
  }
  throw new QuizAudioError("MP3 đang được xử lý. Bấm Tiếp tục để kiểm tra job đã lưu, không tạo lại.", 502);
}

/** Download only the verified final CDN URL, without forwarding the API key. */
export async function downloadTtsForFreeAudio(value: string): Promise<Buffer> {
  const url = verifiedTtsForFreeUrl(value);
  try {
    const response = await fetch(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.body || Number(response.headers.get("content-length") || "0") > MAX_AUDIO_BYTES) {
      await response.body?.cancel();
      throw new QuizAudioError("Không tải được MP3 hoặc file vượt quá 5 MB. URL job đã được giữ lại để tiếp tục.", 502);
    }
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        length += chunk.byteLength;
        if (length > MAX_AUDIO_BYTES) throw new QuizAudioError("File MP3 vượt quá 5 MB.", 502);
        chunks.push(chunk);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    const bytes = Buffer.concat(chunks, length);
    validateMp3(bytes, response.headers.get("content-type"));
    return bytes;
  } catch (error) {
    if (error instanceof QuizAudioError) throw error;
    throw new QuizAudioError("Không tải được MP3 từ TTSForFree. Bấm Tiếp tục để tải lại URL đã lưu.", 502);
  }
}

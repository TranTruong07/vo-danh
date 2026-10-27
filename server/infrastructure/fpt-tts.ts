import "server-only";
import { QuizAudioError, isFptVoice } from "@/server/domain/quiz-audio";

import { MAX_AUDIO_BYTES, validateMp3 } from "./audio-file";
export { MAX_AUDIO_BYTES, validateMp3 } from "./audio-file";
const PROVIDER_ENDPOINT = "https://api.fpt.ai/hmi/tts/v5";

/** Exact legacy bucket and FPT-owned audio host only; never allow arbitrary S3/CDN hosts. */
export function verifiedFptAudioUrl(value: unknown): string {
  if (typeof value !== "string") throw new QuizAudioError("FPT không trả về đường dẫn âm thanh hợp lệ.", 502);
  let url: URL;
  try { url = new URL(value); } catch { throw new QuizAudioError("Đường dẫn âm thanh FPT không hợp lệ.", 502); }
  const legacy = url.hostname === "s3-ap-southeast-1.amazonaws.com" && /^\/text2speech-v4\/[a-zA-Z0-9._-]+\.mp3$/.test(url.pathname);
  const fptV5 = url.hostname === "file01.fpt.ai" && /^\/text2speech-v5\/(?:short|long)\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9._-]+\.mp3$/.test(url.pathname);
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.search || url.hash || !(legacy || fptV5)) {
    throw new QuizAudioError("Host hoặc đường dẫn audio chưa được xác minh với FPT. Chưa tải file.", 502);
  }
  return url.href;
}
export function parseFptResponse(value: unknown): string {
  if (!value || typeof value !== "object" || !("error" in value) || value.error !== 0) throw new QuizAudioError("FPT từ chối yêu cầu. Kiểm tra key, quota và quyền TTS trong Console.", 502);
  const asyncUrl = "async" in value ? value.async : undefined;
  if (typeof asyncUrl !== "string" || asyncUrl.length > 2048) throw new QuizAudioError("FPT không trả về đường dẫn âm thanh hợp lệ.", 502);
  try { new URL(asyncUrl); } catch { throw new QuizAudioError("Đường dẫn âm thanh FPT không hợp lệ.", 502); }
  // Parse is not permission to fetch. Persist the provider result privately first;
  // downloadFptAudio enforces the full allowlist BEFORE any GET. A rejected URL
  // can then be investigated/resumed without repeating a billable synthesis POST.
  return asyncUrl;
}
async function boundedBody(response: Response, limit: number): Promise<Buffer> {
  const size = Number(response.headers.get("content-length") || "0");
  if (size > limit || !response.body) { await response.body?.cancel(); throw new QuizAudioError("Phản hồi FPT thiếu dữ liệu hoặc vượt dung lượng cho phép.", 502); }
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new QuizAudioError("File âm thanh vượt quá 5 MB hoặc phản hồi quá lớn.", 502);
      chunks.push(value);
    }
    return Buffer.concat(chunks, length);
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
function safeProviderError(error: unknown): QuizAudioError {
  return error instanceof QuizAudioError ? error : new QuizAudioError("Không kết nối được FPT hoặc đã hết thời gian chờ. Không tự gửi lại yêu cầu tạo MP3.", 502);
}
export async function requestFptAudio(text: string, voice: string, speed: number): Promise<string> {
  const key = process.env.FPT_TTS_API_KEY?.trim();
  if (!key) throw new QuizAudioError("Chưa cấu hình FPT.AI.", 503);
  if (!isFptVoice(voice) || !Number.isInteger(speed) || speed < -3 || speed > 3 || [...text].length < 3 || [...text].length > 5000) throw new QuizAudioError("Giọng, tốc độ hoặc độ dài nội dung FPT không hợp lệ (3–5.000 ký tự).");
  try {
    // Official v5 header is api_key, not api-key. One POST only; never retry synthesis.
    const response = await fetch(PROVIDER_ENDPOINT, { method: "POST", headers: { api_key: key, voice, speed: String(speed), format: "mp3", "Content-Type": "text/plain; charset=utf-8" }, body: text, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) { await response.body?.cancel(); throw new QuizAudioError(`FPT trả HTTP ${response.status}. Yêu cầu tạo MP3 không được tự gửi lại.`, 502); }
    const bytes = await boundedBody(response, 16384);
    let value: unknown;
    try { value = JSON.parse(bytes.toString("utf8")); } catch { throw new QuizAudioError("FPT trả JSON không hợp lệ.", 502); }
    return parseFptResponse(value);
  } catch (error) { throw safeProviderError(error); }
}

export async function downloadFptAudio(providerUrl: string): Promise<Buffer> {
  const url = verifiedFptAudioUrl(providerUrl);
  const deadline = Date.now() + 25000;
  try {
    for (let attempt = 0; attempt < 6 && Date.now() < deadline; attempt++) {
      const response = await fetch(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(Math.min(5000, Math.max(1, deadline - Date.now()))) });
      if (response.status === 200) {
        const bytes = await boundedBody(response, MAX_AUDIO_BYTES);
        validateMp3(bytes, response.headers.get("content-type"));
        return bytes;
      }
      await response.body?.cancel();
      // S3 can return 403 or 404 while FPT is still producing the object.
      if (![202, 403, 404].includes(response.status)) throw new QuizAudioError(`Không tải được MP3 FPT (HTTP ${response.status}).`, 502);
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new QuizAudioError("MP3 FPT chưa sẵn sàng. Chờ khoảng hai phút rồi thử lại; hệ thống sẽ tải URL đã nhận, không tạo lại.", 502);
  } catch (error) { throw safeProviderError(error); }
}

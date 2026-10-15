import "server-only";
import { GoogleAuth } from "google-auth-library";
import { GameError } from "@/server/domain/character";
import { isVietnameseVoice, VIETNAMESE_VOICES, type VietnameseVoice } from "@/server/domain/speech";

export function isGoogleTtsConfigured() {
  return Boolean((process.env.GOOGLE_TTS_CLIENT_EMAIL && process.env.GOOGLE_TTS_PRIVATE_KEY) || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_TTS_USE_ADC === "true");
}
let auth: GoogleAuth | undefined;
async function googleRequest(path: string, body?: unknown) {
  if (!isGoogleTtsConfigured()) throw new GameError("Chưa cấu hình Google Cloud TTS. Xem file .env.tts.example và bổ sung cấu hình phía máy chủ.");
  auth ??= new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    projectId: process.env.GOOGLE_TTS_PROJECT_ID || undefined,
    ...(process.env.GOOGLE_TTS_CLIENT_EMAIL && process.env.GOOGLE_TTS_PRIVATE_KEY ? { credentials: { client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL, private_key: process.env.GOOGLE_TTS_PRIVATE_KEY.replace(/\\n/g, "\n") } } : {}),
  });
  try {
    const token = await auth.getAccessToken();
    if (!token) throw new Error("auth");
    const response = await fetch(`https://texttospeech.googleapis.com/v1/${path}`, {
      method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(process.env.GOOGLE_TTS_PROJECT_ID ? { "x-goog-user-project": process.env.GOOGLE_TTS_PROJECT_ID } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      if ([401, 403].includes(response.status)) throw new GameError("Google TTS từ chối truy cập. Kiểm tra service account, quyền sử dụng API, billing và đã bật Text-to-Speech API.");
      if (response.status === 429) throw new GameError("Google TTS đang giới hạn lượt gọi. Vui lòng thử lại sau.");
      throw new GameError("Không tạo được âm thanh từ Google TTS. Kiểm tra giọng đã chọn và cấu hình dự án.");
    }
    return await response.json();
  } catch (error) {
    if (error instanceof GameError) throw error;
    // Do not expose provider errors, access tokens or service account keys to the browser/logs.
    throw new GameError("Không kết nối hoặc xác thực được Google TTS. Kiểm tra cấu hình và thử lại.");
  }
}
let voicesCache: { expires: number; voices: VietnameseVoice[] } | undefined;
export async function vietnameseVoices(): Promise<VietnameseVoice[]> {
  if (!isGoogleTtsConfigured()) return VIETNAMESE_VOICES;
  if (voicesCache && voicesCache.expires > Date.now()) return voicesCache.voices;
  const response = await googleRequest("voices?languageCode=vi-VN");
  const voices: VietnameseVoice[] = (Array.isArray(response.voices) ? response.voices : [])
    .filter((voice: { name?: unknown; languageCodes?: string[] }) => isVietnameseVoice(voice.name) && voice.languageCodes?.includes("vi-VN"))
    .map((voice: { name: string; ssmlGender: string }) => ({ name: voice.name, gender: voice.ssmlGender === "MALE" ? "Nam" : voice.ssmlGender === "FEMALE" ? "Nữ" : "Trung tính" }))
    .sort((a: VietnameseVoice, b: VietnameseVoice) => a.name.localeCompare(b.name));
  if (!voices.length) throw new GameError("Google chưa trả về danh sách giọng tiếng Việt. Vui lòng thử lại.");
  voicesCache = { voices, expires: Date.now() + 3600000 }; return voices;
}
export async function validateGoogleVoice(name: string) {
  if (!isVietnameseVoice(name) || !(await vietnameseVoices()).some(voice => voice.name === name)) throw new GameError("Giọng này không có trong danh sách tiếng Việt của Google TTS.");
}
export async function synthesizeSpeech(text: string, voiceName: string): Promise<Buffer> {
  if (!isVietnameseVoice(voiceName) || !text.trim() || Buffer.byteLength(text, "utf8") > 5000) throw new GameError("Nội dung hoặc giọng đọc không hợp lệ.");
  const result = await googleRequest("text:synthesize", { input: { text }, voice: { languageCode: "vi-VN", name: voiceName }, audioConfig: { audioEncoding: "MP3" } });
  if (typeof result.audioContent !== "string" || !result.audioContent.length) throw new GameError("Google TTS chưa trả về âm thanh.");
  return Buffer.from(result.audioContent, "base64");
}

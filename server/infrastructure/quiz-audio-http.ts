import "server-only";
import { hasAdminSession } from "@/server/services/admin-auth";
import { QuizAudioError } from "@/server/domain/quiz-audio";

export async function quizAudioHttp(request: Request, run: () => Promise<unknown>) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (!await hasAdminSession()) return Response.json({ message: "Vui lòng đăng nhập tài khoản admin." }, { status: 403, headers });
    if (request.method === "POST" && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ message: "Nguồn yêu cầu không hợp lệ." }, { status: 403, headers });
    return Response.json(await run(), { headers });
  } catch (error) {
    return Response.json({ message: error instanceof QuizAudioError ? error.message : "Không tải hoặc lưu được âm thanh. Kiểm tra phiên admin và kết nối rồi thử lại." }, { status: error instanceof QuizAudioError ? error.status : 503, headers });
  }
}
export async function readQuizAudioBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json") || Number(request.headers.get("content-length") || 0) > 2048 || !request.body) throw new QuizAudioError("Yêu cầu JSON không hợp lệ hoặc quá lớn.");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 2048) throw new QuizAudioError("Yêu cầu quá lớn."); chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new QuizAudioError("JSON không hợp lệ."); }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

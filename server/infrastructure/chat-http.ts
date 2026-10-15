import "server-only";
import { ChatError, type ChatResponse } from "@/server/domain/chat";

const MAX_BODY_BYTES = 4096;
async function jsonBody(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) { try { allowed.add(new URL(appUrl).origin); } catch { /* Invalid app URL does not allow another origin. */ } }
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && !allowed.has(origin))) throw new ChatError("FORBIDDEN_ORIGIN", "Không thể gửi yêu cầu từ trang này.", 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw new ChatError("JSON_REQUIRED", "Vui lòng gửi nội dung JSON.", 415);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) throw new ChatError("BODY_TOO_LARGE", "Nội dung gửi lên quá dài.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError("INVALID_JSON", "Nội dung JSON không hợp lệ.", 400);
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) { await reader.cancel(); throw new ChatError("BODY_TOO_LARGE", "Nội dung gửi lên quá dài.", 413); }
      chunks.push(value);
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch (error) {
    if (error instanceof ChatError) throw error;
    throw new ChatError("INVALID_JSON", "Nội dung JSON không hợp lệ.", 400);
  } finally { reader.releaseLock(); }
}
export async function handleChatRequest(request: Request, operation: (input: unknown) => Promise<ChatResponse>): Promise<Response> {
  const headers: Record<string, string> = { "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
  try { return Response.json(await operation(await jsonBody(request)), { headers }); }
  catch (error) {
    if (error instanceof ChatError) {
      if (error.retryAfter) headers["Retry-After"] = String(error.retryAfter);
      return Response.json({ status: "error", code: error.code, message: error.message }, { status: error.httpStatus, headers });
    }
    // Do not log raw errors, prompts, cookies or Mongo connection details.
    console.error("[chat] service_unavailable");
    return Response.json({ status: "error", code: "CHAT_UNAVAILABLE", message: "Chưa kết nối được phần trò chuyện. Vui lòng thử lại sau." }, { status: 503, headers });
  }
}

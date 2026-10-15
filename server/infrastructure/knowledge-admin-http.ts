import "server-only";
import { KnowledgeAdminError } from "@/server/domain/knowledge-admin";
import { requireKnowledgeAdmin } from "@/server/services/knowledge-admin";

export async function adminKnowledgeHttp(operation: () => Promise<unknown>): Promise<Response> {
  const headers = { "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
  try { await requireKnowledgeAdmin(); return Response.json(await operation(), { headers }); }
  catch (error) {
    if (error instanceof KnowledgeAdminError) return Response.json({ error: error.code, message: error.message }, { status: error.status, headers });
    console.error("[knowledge-admin] operation_failed");
    return Response.json({ error: "UNAVAILABLE", message: "Chưa thực hiện được thao tác. Kiểm tra kết nối MongoDB, hỗ trợ transaction và tài liệu nguồn rồi thử lại." }, { status: 503, headers });
  }
}
export async function readKnowledgeBody(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin"), allowed = new Set([new URL(request.url).origin]);
  if (process.env.NEXT_PUBLIC_APP_URL) { try { allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin); } catch { /* fail closed */ } }
  if (!origin || !allowed.has(origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new KnowledgeAdminError("FORBIDDEN_ORIGIN", "Yêu cầu phải được gửi từ trang quản trị.", 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw new KnowledgeAdminError("JSON_REQUIRED", "Cần dữ liệu JSON.", 415);
  const max = 256 * 1024;
  if (Number(request.headers.get("content-length")) > max) throw new KnowledgeAdminError("BODY_TOO_LARGE", "Nội dung gửi lên quá lớn.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new KnowledgeAdminError("INVALID_JSON", "Thiếu dữ liệu.");
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new KnowledgeAdminError("BODY_TOO_LARGE", "Nội dung gửi lên quá lớn.", 413); }
      chunks.push(value);
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch (error) { if (error instanceof KnowledgeAdminError) throw error; throw new KnowledgeAdminError("INVALID_JSON", "Dữ liệu JSON không hợp lệ."); }
  finally { reader.releaseLock(); }
}

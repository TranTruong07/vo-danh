import { adminKnowledgeHttp, readKnowledgeBody } from "@/server/infrastructure/knowledge-admin-http";
import { adminKnowledgeDetail, adminKnowledgeMutation } from "@/server/services/knowledge-admin";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return adminKnowledgeHttp(async () => { const { id } = await context.params, query = new URL(request.url).searchParams;
    return adminKnowledgeDetail(id, query.get("revision") || undefined, query.get("preview") === "1"); });
}
export async function POST(request: Request, context: Context) {
  return adminKnowledgeHttp(async () => adminKnowledgeMutation((await context.params).id, await readKnowledgeBody(request)));
}

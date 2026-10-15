import { adminKnowledgeHttp } from "@/server/infrastructure/knowledge-admin-http";
import { adminKnowledgeList } from "@/server/services/knowledge-admin";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return adminKnowledgeHttp(() => adminKnowledgeList(new URL(request.url).searchParams.get("preview") === "1"));
}

import { adminKnowledgeHttp, readKnowledgeBody } from '@/server/infrastructure/knowledge-admin-http';
import { adminChatDetail, adminChatReview, adminDeleteChatHistory } from '@/server/services/chat-history-admin';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  return adminKnowledgeHttp(async () => adminChatDetail((await context.params).id, await readKnowledgeBody(request)));
}
export async function PATCH(request: Request, context: Context) {
  return adminKnowledgeHttp(async () => adminChatReview((await context.params).id, await readKnowledgeBody(request)));
}
export async function DELETE(request: Request, context: Context) {
  return adminKnowledgeHttp(async () => adminDeleteChatHistory((await context.params).id, await readKnowledgeBody(request)));
}

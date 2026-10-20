import { adminKnowledgeHttp, readKnowledgeBody } from '@/server/infrastructure/knowledge-admin-http';
import { adminChatAnalytics } from '@/server/services/chat-history-admin';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return adminKnowledgeHttp(async () => adminChatAnalytics(await readKnowledgeBody(request)));
}

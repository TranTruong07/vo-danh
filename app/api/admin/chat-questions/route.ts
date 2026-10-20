import { adminKnowledgeHttp, readKnowledgeBody } from '@/server/infrastructure/knowledge-admin-http';
import { adminChatQuestions } from '@/server/services/chat-history-admin';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return adminKnowledgeHttp(async () => adminChatQuestions(await readKnowledgeBody(request)));
}

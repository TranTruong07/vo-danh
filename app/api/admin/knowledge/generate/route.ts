import { adminKnowledgeHttp, readKnowledgeBody } from '@/server/infrastructure/knowledge-admin-http';
import { adminGenerateKnowledge, adminGenerationContext } from '@/server/services/knowledge-generation';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request) {
  return adminKnowledgeHttp(() => adminGenerationContext(new URL(request.url).searchParams.get('groupId') || undefined));
}
export async function POST(request: Request) {
  return adminKnowledgeHttp(async () => adminGenerateKnowledge(await readKnowledgeBody(request)));
}

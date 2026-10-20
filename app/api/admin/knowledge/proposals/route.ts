import { adminKnowledgeHttp } from '@/server/infrastructure/knowledge-admin-http';
import { adminGenerationList } from '@/server/services/knowledge-generation';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return adminKnowledgeHttp(() => adminGenerationList('proposals', Number(new URL(request.url).searchParams.get('page') || 1)));
}

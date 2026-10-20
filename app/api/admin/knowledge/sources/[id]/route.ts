import { adminKnowledgeHttp, readKnowledgeBody } from '@/server/infrastructure/knowledge-admin-http';
import { adminGenerationSource, adminConfirmSource } from '@/server/services/knowledge-generation';
export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return adminKnowledgeHttp(async () => adminGenerationSource((await context.params).id));
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return adminKnowledgeHttp(async () => adminConfirmSource((await context.params).id, await readKnowledgeBody(request)));
}

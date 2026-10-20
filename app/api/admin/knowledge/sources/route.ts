import { adminKnowledgeHttp } from '@/server/infrastructure/knowledge-admin-http';
import { readKnowledgeUpload } from '@/server/infrastructure/knowledge-upload-http';
import { adminGenerationList, adminUploadKnowledge } from '@/server/services/knowledge-generation';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return adminKnowledgeHttp(() => adminGenerationList('sources', Number(new URL(request.url).searchParams.get('page') || 1)));
}
export async function POST(request: Request) {
  return adminKnowledgeHttp(async () => { const file = await readKnowledgeUpload(request); return adminUploadKnowledge(file.buffer, file.mime, file.filename); });
}

import { adminKnowledgeHttp, readKnowledgeBody } from '@/server/infrastructure/knowledge-admin-http';
import { adminProposalDetail, adminEditProposal, adminConvertProposal } from '@/server/services/knowledge-generation';
export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return adminKnowledgeHttp(async () => adminProposalDetail((await context.params).id));
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return adminKnowledgeHttp(async () => adminEditProposal((await context.params).id, await readKnowledgeBody(request)));
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return adminKnowledgeHttp(async () => adminConvertProposal((await context.params).id, await readKnowledgeBody(request)));
}

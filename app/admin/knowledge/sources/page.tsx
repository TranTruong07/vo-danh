import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/services/admin-auth';
import KnowledgeGeneration from '@/features/knowledge/knowledge-generation';
import '../knowledge.css';
export default async function Page({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  if (!await hasAdminSession()) redirect('/?auth=login');
  const query = await searchParams;
  return <KnowledgeGeneration mode="sources" groupId={typeof query.groupId === 'string' ? query.groupId : undefined} />;
}

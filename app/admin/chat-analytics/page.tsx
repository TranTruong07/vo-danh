import { redirect } from 'next/navigation';
import { hasAdminSession } from '@/server/services/admin-auth';
import ChatHistoryAdmin from '@/features/admin/chat-history-admin';
import '../knowledge/knowledge.css';
export default async function Page() {
  if (!await hasAdminSession()) redirect('/?auth=login');
  return <ChatHistoryAdmin mode="analytics" />;
}

import 'server-only';
import { KNOWLEDGE_CHARACTERS, type KnowledgeCharacterId } from '@/server/domain/knowledge';
import { KnowledgeAdminError } from '@/server/domain/knowledge-admin';
import { CHAT_REVIEW_STATUSES, type ChatHistoryFilter, type ChatReview, type ChatReviewStatus } from '@/server/domain/chat-history';
import { chatAnalytics, deleteChatGroup, queryChatGroups, readChatGroup, updateChatReview } from '@/server/repositories/chat-history';
import { readPublishedChatIndex } from '@/server/repositories/chat-knowledge';
import { requireKnowledgeAdmin } from './knowledge-admin';
import { sanitizeChatText } from './chat-history-privacy';

const invalid = () => new KnowledgeAdminError('INVALID_INPUT', 'Bộ lọc hoặc thông tin cập nhật không hợp lệ.');
function object(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid();
  return input as Record<string, unknown>;
}
export function parseChatHistoryFilter(input: unknown, now = new Date()): ChatHistoryFilter {
  const row = object(input);
  if (Object.keys(row).some(k => !['from', 'to', 'characterId', 'status', 'page', 'pageSize', 'text', 'minCount', 'maxCount'].includes(k))) throw invalid();
  for (const key of ['minCount','maxCount']) if (row[key] !== undefined && (!Number.isSafeInteger(row[key]) || Number(row[key]) < 1 || Number(row[key]) > 1000000)) throw invalid();
  if (row.minCount && row.maxCount && Number(row.minCount) > Number(row.maxCount)) throw invalid();
  for (const field of ['from', 'to', 'characterId', 'status', 'text']) if (row[field] !== undefined && typeof row[field] !== 'string') throw invalid();
  const to = row.to ? new Date(String(row.to)) : now;
  const from = row.from ? new Date(String(row.from)) : new Date(to.getTime() - 30 * 86400000);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to || to.getTime() - from.getTime() > 90 * 86400000 || to.getTime() > now.getTime() + 86400000) throw invalid();
  if (row.characterId && !KNOWLEDGE_CHARACTERS.includes(row.characterId as KnowledgeCharacterId)) throw invalid();
  if (row.status && !CHAT_REVIEW_STATUSES.includes(row.status as ChatReviewStatus)) throw invalid();
  const page = row.page ?? 1, pageSize = row.pageSize ?? 20;
  if (!Number.isInteger(page) || Number(page) < 1 || Number(page) > 500 || !Number.isInteger(pageSize) || Number(pageSize) < 1 || Number(pageSize) > 50) throw invalid();
  if (String(row.text || '').length > 120) throw invalid();
  return { from, to, page: Number(page), pageSize: Number(pageSize), text: String(row.text || '').trim(),
    ...(row.minCount ? { minCount: Number(row.minCount) } : {}), ...(row.maxCount ? { maxCount: Number(row.maxCount) } : {}),
    ...(row.characterId ? { characterId: row.characterId as KnowledgeCharacterId } : {}), ...(row.status ? { status: row.status as ChatReviewStatus } : {}) };
}
export function assertChatGroupId(id: string) { if (!/^[a-f0-9]{64}$/.test(id)) throw invalid(); }
export async function adminChatAnalytics(input: unknown) {
  await requireKnowledgeAdmin();
  return chatAnalytics(parseChatHistoryFilter(input));
}
export async function adminChatQuestions(input: unknown) {
  await requireKnowledgeAdmin();
  const filter = parseChatHistoryFilter(input);
  return { ...await queryChatGroups(filter), page: filter.page, pageSize: filter.pageSize };
}
export async function adminChatDetail(id: string, input: unknown) {
  await requireKnowledgeAdmin(); assertChatGroupId(id);
  const row = object(input);
  if (Object.keys(row).some(k => !['page', 'pageSize'].includes(k))) throw invalid();
  const filter = parseChatHistoryFilter(row);
  const detail = await readChatGroup(id, filter.page, filter.pageSize);
  if (!detail) throw new KnowledgeAdminError('NOT_FOUND', 'Lịch sử không còn tồn tại hoặc đã hết thời gian lưu.', 404);
  const published = (await readPublishedChatIndex()).map(({ questionId, canonicalQuestion }) => ({ questionId, question: canonicalQuestion }));
  return { ...detail, published };
}
export async function adminChatReview(id: string, input: unknown) {
  const actor = await requireKnowledgeAdmin(); assertChatGroupId(id);
  const row = object(input);
  if (Object.keys(row).some(k => !['status', 'expectedVersion', 'note', 'linkedQuestionId', 'equivalentGroupId'].includes(k))) throw invalid();
  if (!CHAT_REVIEW_STATUSES.includes(row.status as ChatReviewStatus) || !Number.isSafeInteger(row.expectedVersion) || Number(row.expectedVersion) < 0
    || typeof row.note !== 'string' || row.note.length > 1000) throw invalid();
  for (const field of ['linkedQuestionId', 'equivalentGroupId']) if (row[field] !== undefined && typeof row[field] !== 'string') throw invalid();
  const detail = await readChatGroup(id, 1, 1);
  if (!detail) throw new KnowledgeAdminError('NOT_FOUND', 'Lịch sử đã hết hạn hoặc không còn tồn tại.', 404);
  const published = row.linkedQuestionId ? (await readPublishedChatIndex()).find(q => q.questionId === row.linkedQuestionId) : undefined;
  if (row.linkedQuestionId && !published) throw new KnowledgeAdminError('NOT_PUBLISHED', 'Chỉ được liên kết câu hỏi đang Published.', 409);
  if (row.status === 'linked_existing' && !published) throw new KnowledgeAdminError('LINK_REQUIRED', 'Hãy chọn một câu hỏi Published.');
  if (row.equivalentGroupId) {
    assertChatGroupId(String(row.equivalentGroupId));
    if (row.equivalentGroupId === id || !await readChatGroup(String(row.equivalentGroupId), 1, 1)) throw new KnowledgeAdminError('INVALID_GROUP', 'Nhóm tương đương không tồn tại hoặc trùng với nhóm đang xem.');
  }
  const review: ChatReview = { _id: id, status: row.status as ChatReviewStatus, version: Number(row.expectedVersion) + 1,
    note: sanitizeChatText(row.note, 1000).text, updatedAt: new Date(), updatedBy: actor.userId,
    ...(published ? { linkedQuestionId: published.questionId, linkedRevisionId: published.revisionId } : {}),
    ...(row.equivalentGroupId ? { equivalentGroupId: String(row.equivalentGroupId) } : {}),
  };
  if (!await updateChatReview(review, Number(row.expectedVersion), actor.userId)) throw new KnowledgeAdminError('CONFLICT', 'Một quản trị viên khác đã cập nhật. Hãy tải lại chi tiết trước khi lưu.', 409);
  return { ok: true, review };
}
export async function adminDeleteChatHistory(id: string, input: unknown) {
  const actor = await requireKnowledgeAdmin(); assertChatGroupId(id);
  const row = object(input);
  if (Object.keys(row).length !== 1 || row.confirm !== 'DELETE_HISTORY') throw invalid();
  return { deleted: await deleteChatGroup(id, actor.userId) };
}

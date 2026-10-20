import 'server-only';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { ChatError, type ChatResponse } from '@/server/domain/chat';
import type { KnowledgeCharacterId } from '@/server/domain/knowledge';
import type { ChatInteraction, ChatMatchingSource } from '@/server/domain/chat-history';
import { latestOfferedInteraction, readInteraction, recordInteraction, recordSelection } from '@/server/repositories/chat-history';
import { chatGroupId, chatSessionReference, historyHash, historyRetentionDays, sanitizeChatText } from './chat-history-privacy';

// A shared secret is required across instances. Local development can use a process key;
// persisted offers remain usable via the authenticated repository lookup after restart.
const localKey = randomBytes(32);
function secret() {
  const configured = process.env.CHAT_HISTORY_SIGNING_SECRET;
  return configured && configured.length >= 32 ? configured : localKey;
}
type Context = { sessionId: string; ownerHash: string; characterId: KnowledgeCharacterId };
export interface HistoryAttempt { id: string; sessionRef: string; requestHash: string; startedAt: number; context: Context; text: string; kind: 'question' | 'starter' }
export function historyAttempt(context: Context, text: string, requestId?: string, kind: 'question' | 'starter' = 'question'): HistoryAttempt {
  const sessionRef = chatSessionReference(context.sessionId, context.ownerHash);
  return { id: historyHash(`${sessionRef}:${kind}:${requestId || randomUUID()}`), sessionRef,
    requestHash: historyHash(sanitizeChatText(text).text), startedAt: performance.now(), context, text, kind };
}
async function bestEffort<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  // Do not make a healthy chatbot wait for the Mongo selection timeout when history is down.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation(), new Promise<T>(resolve => { timer = setTimeout(() => resolve(fallback), 1200); })]);
  } catch { console.warn('[chat-history] storage_unavailable'); return fallback; }
  finally { clearTimeout(timer); }
}
export async function previousInteraction(attempt: HistoryAttempt): Promise<ChatInteraction | null> {
  const row = await bestEffort(() => readInteraction(attempt.id, attempt.sessionRef), null);
  if (row && row.requestHash !== attempt.requestHash) throw new ChatError('REQUEST_CONFLICT', 'Lượt gửi này đã được dùng cho nội dung khác. Hãy gửi một tin nhắn mới.', 409);
  return row;
}
function offerToken(id: string, ids: string[], sessionRef: string, expiresAt = Date.now() + 3600000): string {
  const payload = Buffer.from(JSON.stringify({ id, ids, exp: expiresAt })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(`${sessionRef}.${payload}`).digest('base64url');
  return `${payload}.${signature}`;
}
export function attachOffer(response: ChatResponse, id: string, sessionRef: string): ChatResponse {
  if (response.status !== 'suggest' || !response.suggestions.length) return response;
  const token = offerToken(id, response.suggestions.map(s => s.questionId), sessionRef);
  return { ...response, suggestions: response.suggestions.map(s => ({ ...s, offerToken: token })) };
}
export function verifyChatOffer(token: string, questionId: string, sessionRef: string): string | null {
  try {
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !signature) return null;
    const wanted = createHmac('sha256', secret()).update(`${sessionRef}.${payload}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!/^[a-f0-9]{64}$/.test(value.id) || !Array.isArray(value.ids) || value.ids.length > 3 || !value.ids.includes(questionId)
      || !Number.isFinite(value.exp) || value.exp <= Date.now() || value.exp > Date.now() + 3601000) return null;
    return value.id as string;
  } catch { return null; }
}
export async function authorizeChatSelection(context: Context, questionId: string, token?: string): Promise<{ id: string; sessionRef: string; revisionId?: string }> {
  const sessionRef = chatSessionReference(context.sessionId, context.ownerHash);
  const signedId = token ? verifyChatOffer(token, questionId, sessionRef) : null;
  // Compatibility with existing clients; authorization still requires a real offer in this session.
  const row = await bestEffort(() => signedId ? readInteraction(signedId, sessionRef) : latestOfferedInteraction(sessionRef, questionId), null);
  if (!row && !signedId) throw new ChatError('INVALID_SUGGESTION', 'Gợi ý này không còn hợp lệ. Hãy gửi lại câu hỏi để nhận gợi ý mới.', 409);
  if (row?.selectedQuestionId && row.selectedQuestionId !== questionId) throw new ChatError('SELECTION_CONFLICT', 'Lượt gợi ý này đã được chọn. Hãy gửi câu hỏi mới để tiếp tục.', 409);
  return { id: row?._id || signedId!, sessionRef, ...(row?.selectedQuestionId ? { revisionId: row.publishedVersionId } : {}) };
}
export async function saveChatSelection(offer: { id: string; sessionRef: string }, questionId: string, revisionId: string, latencyMs: number): Promise<void> {
  const status = await bestEffort(() => recordSelection(offer.id, offer.sessionRef, questionId, revisionId, latencyMs), 'missing');
  if (status === 'conflict') throw new ChatError('SELECTION_CONFLICT', 'Lượt gợi ý này đã được chọn. Hãy gửi câu hỏi mới để tiếp tục.', 409);
}
export async function finishChatInteraction(attempt: HistoryAttempt, response: ChatResponse, source: ChatMatchingSource,
  metadata: { revisionId?: string; providerFailure?: string; calls?: number; cacheHit?: boolean; noCandidate?: boolean } = {}): Promise<ChatResponse> {
  const now = new Date(), sanitized = sanitizeChatText(attempt.text);
  const suggestions = response.status === 'suggest' ? response.suggestions.map(s => s.questionId) : [];
  const row: ChatInteraction = {
    _id: attempt.id, sessionRef: attempt.sessionRef, characterId: attempt.context.characterId,
    kind: attempt.kind, createdAt: now, expiresAt: new Date(now.getTime() + historyRetentionDays() * 86400000),
    question: sanitized.text, redacted: sanitized.redacted,
    groupId: chatGroupId(attempt.context.characterId, sanitized.text, sanitized.redacted, attempt.id), requestHash: attempt.requestHash,
    outcome: response.status === 'answered' ? 'answered' : suggestions.length ? 'suggested' : 'unresolved',
    matchingSource: source, suggestedQuestionIds: suggestions, providerCalls: metadata.calls || 0, cacheHit: metadata.cacheHit || false,
    latencyMs: Math.max(0, Math.round(performance.now() - attempt.startedAt)), feedbackStatus: 'not_requested',
    ...(response.status === 'answered' ? { answeredQuestionId: response.questionId, publishedVersionId: metadata.revisionId } : {}),
    ...(metadata.providerFailure ? { providerFailure: metadata.providerFailure } : {}),
    ...(response.status === 'out_of_scope' ? { reviewReason: 'out_of_scope' as const }
      : response.status === 'suggest' && !suggestions.length ? { reviewReason: metadata.providerFailure ? 'provider_unavailable' as const : metadata.noCandidate ? 'no_candidate' as const : 'clarify' as const } : {}),
  };
  await bestEffort(() => recordInteraction(row), undefined);
  return attachOffer(response, attempt.id, attempt.sessionRef);
}

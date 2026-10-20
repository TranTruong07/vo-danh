import "server-only";
import { validateChatInput, validateChatSessionInput, type ChatResponse } from "@/server/domain/chat";
import type { KnowledgeCharacterId } from "@/server/domain/knowledge";
import { readPublishedChatIndex, readPublishedChatAnswer } from "@/server/repositories/chat-knowledge";
import { CHAT_PERSONAS } from "./chat-characters";
import { chatPlayerHash, resolveChatSession } from "./chat-session";
import { limitChatRequests } from "./chat-rate-limit";
import { matchChatQuestion } from "./chat-matcher";
import { assistChatMatch } from "./chat-ai-matching";
import { clearlyOutsideKnowledge } from './chat-vietnamese-ranking';
import { normalizeKnowledgePhrase } from '@/server/domain/knowledge';
import { attachOffer, authorizeChatSelection, finishChatInteraction, historyAttempt, previousInteraction, saveChatSelection } from './chat-history';
import type { ChatMatchingSource } from '@/server/domain/chat-history';

function refuse(characterId: KnowledgeCharacterId): ChatResponse {
  return { status: "out_of_scope", characterId, answer: CHAT_PERSONAS[characterId].refusalText };
}
async function context(sessionId: string) {
  const ownerHash = await chatPlayerHash();
  // Cookie identity shares quota across all rounds and both endpoints. Invalid rounds cost quota too.
  await limitChatRequests(ownerHash);
  const resolved = await resolveChatSession(sessionId, ownerHash);
  return { ...resolved, sessionId, ownerHash };
}
async function answer(characterId: KnowledgeCharacterId, questionId: string, revisionId?: string): Promise<{ response: ChatResponse; revisionId?: string }> {
  // Re-query published pointer and approved revision even after exact match or suggestion click.
  const row = await readPublishedChatAnswer(questionId, characterId, revisionId);
  if (!row) {
    if (revisionId) console.warn("[chat] published_answer_unavailable");
    return { response: refuse(characterId) };
  }
  return { response: { status: "answered", characterId, questionId: row.questionId, answer: row.answer,
    source: { document: row.source.document, sectionId: row.source.sectionId } }, revisionId: row.revisionId };
}
export async function sendChatMessage(input: unknown): Promise<ChatResponse> {
  const { sessionId, message, requestId } = validateChatInput(input, "message");
  const ctx = await context(sessionId), { characterId } = ctx;
  const attempt = historyAttempt(ctx, message, requestId);
  const previous = requestId ? await previousInteraction(attempt) : null;
  const index = await readPublishedChatIndex();
  if (previous) {
    // Retry never reads a stored answer blob: revalidate the original Published revision.
    if (previous.answeredQuestionId) return (await answer(characterId, previous.answeredQuestionId, previous.publishedVersionId)).response;
    if (previous.matchingSource === 'out_of_scope') return refuse(characterId);
    const suggestions = previous.suggestedQuestionIds.flatMap(id => {
      const row = index.find(entry => entry.questionId === id);
      return row ? [{ questionId: row.questionId, question: row.canonicalQuestion }] : [];
    });
    return attachOffer({ status: 'suggest', suggestions,
      ...(previous.providerFailure ? { reason: 'provider_unavailable' as const } : suggestions.length ? {} : { reason: 'clarify' as const }),
    }, previous._id, attempt.sessionRef);
  }
  const legacy = matchChatQuestion(message, index);
  if (legacy.type === "exact") {
    const result = await answer(characterId, legacy.entry.questionId, legacy.entry.revisionId);
    return finishChatInteraction(attempt, result.response,
      normalizeKnowledgePhrase(message) === normalizeKnowledgePhrase(legacy.entry.canonicalQuestion) ? 'exact_match' : 'alias_match', result);
  }
  const ai = await assistChatMatch(message, index, legacy, characterId);
  const { match, unavailable } = ai;
  const quota = ai.outcome === 'quota' || ai.failure?.httpStatus === 429;
  const source: ChatMatchingSource = quota ? 'quota_exceeded' : unavailable ? (match.type === 'suggest' ? 'local_fallback' : 'provider_unavailable')
    : ai.suggestionSource === 'cache' ? 'cache_hit' : ai.suggestionSource === 'gemini' ? 'gemini_match' : 'local_fallback';
  const metadata = { calls: ai.calls, cacheHit: ai.cacheHit, noCandidate: ai.outcome === 'no_candidates',
    ...(unavailable ? { providerFailure: quota ? 'quota_exceeded' : ai.failureKind || ai.outcome } : {}) };
  const finish = (response: ChatResponse, finalSource: ChatMatchingSource = source) => finishChatInteraction(attempt, response, finalSource, metadata);
  if (match.type === "none") {
    if (!unavailable && clearlyOutsideKnowledge(message)) return finish(refuse(characterId), 'out_of_scope');
    return finish({ status: 'suggest', suggestions: [], reason: unavailable ? 'provider_unavailable' : 'clarify',
      message: unavailable
        ? 'Phần tìm câu hỏi nâng cao đang tạm gián đoạn. Mình chưa tìm được gợi ý đủ chắc chắn. Bạn thử hỏi ngắn hơn, nêu rõ sự kiện, địa điểm hoặc thời gian nhé.'
        : 'Mình chưa xác định rõ câu hỏi phù hợp trong tư liệu. Bạn nêu rõ sự kiện, địa điểm hoặc thời gian; nếu có nhiều ý, hãy hỏi từng ý nhé.' }, unavailable ? source : 'clarify');
  }
  if (match.type === 'suggest' && unavailable) return finish({ status: 'suggest', suggestions: match.suggestions,
    reason: 'provider_unavailable', message: 'Phần tìm câu hỏi nâng cao đang tạm gián đoạn. Bạn có muốn hỏi một trong những câu đã công bố dưới đây không?' });
  if (match.type === "suggest") return finish({ status: "suggest", suggestions: match.suggestions });
  // AI-assisted results can never enter the direct-answer branch.
  return finish(refuse(characterId), 'out_of_scope');
}
export async function selectChatAnswer(input: unknown): Promise<ChatResponse> {
  const started = performance.now();
  const { sessionId, questionId, offerToken } = validateChatInput(input, "answer");
  const ctx = await context(sessionId);
  const offer = await authorizeChatSelection(ctx, questionId, offerToken);
  const result = await answer(ctx.characterId, questionId, offer.revisionId);
  if (result.response.status === 'answered' && result.revisionId) await saveChatSelection(offer, questionId, result.revisionId, Math.round(performance.now() - started));
  return result.response;
}
export async function suggestChatQuestions(input: unknown): Promise<ChatResponse> {
  const ctx = await context(validateChatSessionInput(input));
  const entries = await readPublishedChatIndex();
  return finishChatInteraction(historyAttempt(ctx, '', undefined, 'starter'),
    { status: "suggest", suggestions: entries.slice(0, 3).map(row => ({ questionId: row.questionId, question: row.canonicalQuestion })) }, 'starter');
}

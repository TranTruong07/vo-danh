import "server-only";
import { createHash } from "node:crypto";
import type { ChatIndexEntry } from "@/server/domain/chat";
import { normalizeKnowledgePhrase, type KnowledgeCharacterId } from "@/server/domain/knowledge";
import { CHAT_AI_PROMPT_VERSION, compatibleAiCandidate, parseAiDecision, safeAiMessage } from "@/server/domain/chat-ai";
import { readAiCache, writeAiCache } from "@/server/repositories/chat-ai-cache";
import { incrementChatLimit } from "@/server/repositories/chat-limits";
import { readPublishedChatAnswer, readPublishedChatIndex } from "@/server/repositories/chat-knowledge";
import { generateQuestionMatch } from "@/server/infrastructure/gemini-question-matcher";
import { describeGeminiFailure, type GeminiFailure } from "@/server/infrastructure/gemini-errors";
import { chatAiConfig, type ChatAiConfig } from "./chat-ai-config";
import { retrieveAiCandidates } from "./chat-ai-candidates";
import { matchChatQuestion, type ChatMatch } from "./chat-matcher";
import { compatibleVietnameseCandidate, VI_RANKING_VERSION } from './chat-vietnamese-ranking';

export function aiCacheKey(message: string, candidates: ChatIndexEntry[], model: string): string {
  return createHash("sha256").update(JSON.stringify({ question: normalizeKnowledgePhrase(message), candidates,
    model, prompt: CHAT_AI_PROMPT_VERSION, ranking: VI_RANKING_VERSION })).digest("hex");
}
export async function reserveAiQuota(config: ChatAiConfig, now = Date.now()): Promise<boolean> {
  if (config.perMinute <= 0 || config.perDay <= 0) return false;
  const minute = Math.floor(now / 60000);
  const day = Math.floor(now / 86400000);
  // Shared atomic increments. Rejected reservations count too; this is deliberately conservative.
  if (await incrementChatLimit(`gemini:minute:${minute}`, new Date((minute + 2) * 60000)) > config.perMinute) return false;
  return await incrementChatLimit(`gemini:day:${day}`, new Date((day + 2) * 86400000)) <= config.perDay;
}
export interface AiMatchResult { match: ChatMatch; outcome: string; calls: number; cacheHit: boolean; unavailable?: boolean; failureStage?: string; failureKind?: string; failure?: GeminiFailure; suggestionSource?: 'gemini' | 'cache' }
export async function assistChatMatch(message: string, index: ChatIndexEntry[], legacy: ChatMatch, characterId: KnowledgeCharacterId): Promise<AiMatchResult> {
  const result: AiMatchResult = { match: legacy, outcome: "disabled", calls: 0, cacheHit: false };
  const config = chatAiConfig();
  if (legacy.type === "exact") return { ...result, outcome: "exact" };
  if (!config.enabled) return result;
  if (!safeAiMessage(message)) return { ...result, outcome: "private_input" };
  const candidates = retrieveAiCandidates(message, index, legacy, config.maxCandidates);
  if (!candidates.length) return { ...result, outcome: "no_candidates" };
  let stage = "cache_read";
  try {
    const key = aiCacheKey(message, candidates, config.model);
    let decision = await readAiCache(key);
    result.cacheHit = !!decision;
    if (!decision) {
      stage = "quota";
      if (!await reserveAiQuota(config)) { result.outcome = "quota"; result.unavailable = true; }
      else {
        result.calls = 1;
        stage = "generation";
        decision = parseAiDecision(await generateQuestionMatch(message, candidates, config), candidates);
        result.outcome = decision ? decision.decision : "invalid_output";
        result.unavailable = !decision;
        if (decision) {
          stage = "cache_write";
          // Cache only a decision/ID, never query text, generated reason, identity, or answers.
          await writeAiCache(key, decision, decision.decision === "match" ? config.matchTtlSeconds : Math.min(config.noMatchTtlSeconds, config.matchTtlSeconds - 1));
        }
      }
    } else result.outcome = "cache";
    stage = "publication_recheck";
    // Re-read publication even for no_match/cache/quota, not just a selected ID.
    const fresh = await readPublishedChatIndex();
    const fallback = matchChatQuestion(message, fresh);
    result.match = fallback.type === "exact" ? { type: "suggest", suggestions: [{ questionId: fallback.entry.questionId, question: fallback.entry.canonicalQuestion }] } : fallback;
    if (decision?.decision !== "match") return result;
    const selected = candidates.find(row => row.questionId === decision.questionId);
    const current = fresh.find(row => row.questionId === decision.questionId);
    if (!selected || !current || JSON.stringify(selected) !== JSON.stringify(current)
      || !compatibleAiCandidate(message, current)
      || !compatibleVietnameseCandidate(message, current)
      || !await readPublishedChatAnswer(current.questionId, characterId, current.revisionId)) {
      return { ...result, outcome: "revalidation_rejected" };
    }
    const extra = result.match.type === "suggest" ? result.match.suggestions.filter(row => row.questionId !== current.questionId) : [];
    result.match = { type: "suggest", suggestions: [{ questionId: current.questionId, question: current.canonicalQuestion }, ...extra].slice(0, 3) };
    result.suggestionSource = result.cacheHit ? 'cache' : 'gemini';
    return result;
  } catch (error) {
    // Provider/cache/quota errors never bypass existing auth or break working legacy chat.
    // Do not log SDK errors: they may include prompts or API credentials.
    const failure = describeGeminiFailure(error);
    result.outcome = failure.httpStatus ? `provider_${failure.httpStatus}` : "error_fallback";
    result.failureStage = stage;
    result.failureKind = failure.kind;
    result.failure = failure;
    result.unavailable = true;
    try {
      const fresh = matchChatQuestion(message, await readPublishedChatIndex());
      result.match = fresh.type === "exact" ? { type: "suggest", suggestions: [{ questionId: fresh.entry.questionId, question: fresh.entry.canonicalQuestion }] } : fresh;
    } catch { result.match = { type: "none" }; }
    return result;
  }
}

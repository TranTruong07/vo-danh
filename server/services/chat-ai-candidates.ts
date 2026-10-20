import type { ChatIndexEntry } from "@/server/domain/chat";
import type { ChatMatch } from "./chat-matcher";
import { rankVietnameseCandidates } from './chat-vietnamese-ranking';

// Retrieval may be broader than fallback; neither can directly produce an answer.
export function retrieveAiCandidates(message: string, index: ChatIndexEntry[], _legacy: ChatMatch, limit: number): ChatIndexEntry[] {
  return [...new Map(rankVietnameseCandidates(message, index).map(row => [row.entry.questionId, row.entry])).values()].slice(0, limit);
}

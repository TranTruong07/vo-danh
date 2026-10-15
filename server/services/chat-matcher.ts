import Fuse from "fuse.js";
import { normalizeKnowledgePhrase } from "@/server/domain/knowledge";
import type { ChatIndexEntry, ChatSuggestion } from "@/server/domain/chat";

export type ChatMatch = { type: "exact"; entry: ChatIndexEntry } | { type: "suggest"; suggestions: ChatSuggestion[] } | { type: "none" };
export function matchChatQuestion(message: string, entries: ChatIndexEntry[]): ChatMatch {
  const query = normalizeKnowledgePhrase(message);
  if (!query) return { type: "none" };
  const candidates = entries.map(entry => ({ ...entry, phrases: [entry.canonicalQuestion, ...entry.aliases].map(normalizeKnowledgePhrase) }));
  const unique = (rows: ChatIndexEntry[]) => [...new Map(rows.map(row => [row.questionId, row])).values()];
  const suggest = (rows: ChatIndexEntry[]): ChatMatch => ({ type: "suggest", suggestions: unique(rows).slice(0, 3).map(row => ({ questionId: row.questionId, question: row.canonicalQuestion })) });
  const exact = unique(candidates.filter(entry => entry.phrases.includes(query)));
  if (exact.length === 1) return { type: "exact", entry: exact[0] };
  if (exact.length > 1) return suggest(exact);
  if (query.length < 8) return { type: "none" };
  const fuse = new Fuse(candidates, { keys: ["phrases"], threshold: 0.25, ignoreLocation: true, ignoreFieldNorm: true, includeScore: true });
  const results = fuse.search(query).map(result => result.item);
  // Even a zero fuzzy score is never permission to answer a non-exact question.
  return results.length ? suggest(results) : { type: "none" };
}

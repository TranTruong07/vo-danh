import "server-only";

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  // Invalid budgets fail closed rather than silently increasing API use.
  return Number.isInteger(value) && value >= min && value <= max ? value : min;
}
export function chatAiConfig() {
  return {
    enabled: process.env.CHAT_AI_MATCHING_ENABLED === "true" && !!process.env.GEMINI_API_KEY?.trim(),
    model: process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite",
    timeoutMs: integer("CHAT_AI_TIMEOUT_MS", 5000, 100, 15000),
    maxCandidates: integer("CHAT_AI_MAX_CANDIDATES", 8, 1, 12),
    perMinute: integer("CHAT_AI_CALLS_PER_MINUTE", 5, 0, 100),
    perDay: integer("CHAT_AI_CALLS_PER_DAY", 100, 0, 10000),
    matchTtlSeconds: integer("CHAT_AI_CACHE_TTL_SECONDS", 3600, 60, 86400),
    noMatchTtlSeconds: integer("CHAT_AI_NO_MATCH_TTL_SECONDS", 120, 1, 300),
  };
}
export type ChatAiConfig = ReturnType<typeof chatAiConfig>;
// CHAT_AI_AUTO_ANSWER is intentionally never read: this phase can only suggest.

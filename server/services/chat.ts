import "server-only";
import { validateChatInput, validateChatSessionInput, type ChatResponse } from "@/server/domain/chat";
import type { KnowledgeCharacterId } from "@/server/domain/knowledge";
import { readPublishedChatIndex, readPublishedChatAnswer } from "@/server/repositories/chat-knowledge";
import { CHAT_PERSONAS } from "./chat-characters";
import { chatPlayerHash, resolveChatSession } from "./chat-session";
import { limitChatRequests } from "./chat-rate-limit";
import { matchChatQuestion } from "./chat-matcher";

function refuse(characterId: KnowledgeCharacterId): ChatResponse {
  return { status: "out_of_scope", characterId, answer: CHAT_PERSONAS[characterId].refusalText };
}
async function context(sessionId: string) {
  const ownerHash = await chatPlayerHash();
  // Cookie identity shares quota across all rounds and both endpoints. Invalid rounds cost quota too.
  await limitChatRequests(ownerHash);
  return resolveChatSession(sessionId, ownerHash);
}
async function answer(characterId: KnowledgeCharacterId, questionId: string, revisionId?: string): Promise<ChatResponse> {
  // Re-query published pointer and approved revision even after exact match or suggestion click.
  const row = await readPublishedChatAnswer(questionId, characterId, revisionId);
  if (!row) {
    if (revisionId) console.warn("[chat] published_answer_unavailable");
    return refuse(characterId);
  }
  return { status: "answered", characterId, questionId: row.questionId, answer: row.answer,
    source: { document: row.source.document, sectionId: row.source.sectionId } };
}
export async function sendChatMessage(input: unknown): Promise<ChatResponse> {
  const { sessionId, message } = validateChatInput(input, "message");
  const { characterId } = await context(sessionId);
  const match = matchChatQuestion(message, await readPublishedChatIndex());
  if (match.type === "none") return refuse(characterId);
  if (match.type === "suggest") return { status: "suggest", suggestions: match.suggestions };
  return answer(characterId, match.entry.questionId, match.entry.revisionId);
}
export async function selectChatAnswer(input: unknown): Promise<ChatResponse> {
  const { sessionId, questionId } = validateChatInput(input, "answer");
  const { characterId } = await context(sessionId);
  return answer(characterId, questionId);
}
export async function suggestChatQuestions(input: unknown): Promise<ChatResponse> {
  await context(validateChatSessionInput(input));
  const entries = await readPublishedChatIndex();
  return { status: "suggest", suggestions: entries.slice(0, 3).map(row => ({ questionId: row.questionId, question: row.canonicalQuestion })) };
}

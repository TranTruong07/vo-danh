import type { KnowledgeCharacterId } from "./knowledge";

export interface ChatSuggestion { questionId: string; question: string; offerToken?: string }
export type ChatRequestInput = ({ message: string } | { questionId: string; offerToken?: string }) & { requestId?: string };
export type ChatSessionResult = { ok: true; sessionId: string; expiresAt: string } | { ok: false; code: string; message: string; retryAfter?: number };
export type OpenChatSessionAction = (requestId: string) => Promise<ChatSessionResult>;
export type ChatResponse =
  | { status: "answered"; characterId: KnowledgeCharacterId; questionId: string; answer: string; source: { sectionId: string; document: string } }
  | { status: "suggest"; suggestions: ChatSuggestion[]; message?: string; reason?: "clarify" | "provider_unavailable" }
  | { status: "out_of_scope"; characterId: KnowledgeCharacterId; answer: string };
export interface ChatIndexEntry { questionId: string; revisionId: string; canonicalQuestion: string; aliases: string[] }
export interface ChatAnswerEntry extends ChatIndexEntry { answer: string; source: { sectionId: string; document: string } }
export class ChatError extends Error {
  constructor(public code: string, message: string, public httpStatus: number, public retryAfter?: number) { super(message); }
}
export const isChatSessionId = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
export const isKnowledgeQuestionId = (value: unknown): value is string => typeof value === "string" && /^cmtt45-q\d{3,6}$/.test(value);
export function validateChatSessionInput(input: unknown): string {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 1 || !("sessionId" in input) || !isChatSessionId(input.sessionId)) {
    throw new ChatError("INVALID_INPUT", "Phiên trò chuyện không hợp lệ.", 400);
  }
  return input.sessionId;
}
export function validateChatInput(input: unknown, mode: "message"): { sessionId: string; message: string; requestId?: string };
export function validateChatInput(input: unknown, mode: "answer"): { sessionId: string; questionId: string; requestId?: string; offerToken?: string };
export function validateChatInput(input: unknown, mode: "message" | "answer") {
  const invalid = () => new ChatError("INVALID_INPUT", "Nội dung gửi lên không hợp lệ. Vui lòng kiểm tra và thử lại.", 400);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid();
  const row = input as Record<string, unknown>, field = mode === "message" ? "message" : "questionId";
  // Reject characterId, role, source, status, answer and all other extra fields.
  const allowed = ['sessionId', field, 'requestId', ...(mode === 'answer' ? ['offerToken'] : [])];
  if (Object.keys(row).some(key => !allowed.includes(key)) || !isChatSessionId(row.sessionId)) throw invalid();
  if (row.requestId !== undefined && !isChatSessionId(row.requestId)) throw invalid();
  if (row.offerToken !== undefined && (typeof row.offerToken !== 'string' || row.offerToken.length > 1000 || !/^[a-zA-Z0-9_.-]+$/.test(row.offerToken))) throw invalid();
  const optional = { ...(row.requestId ? { requestId: row.requestId as string } : {}), ...(row.offerToken ? { offerToken: row.offerToken as string } : {}) };
  if (mode === "answer") {
    if (!isKnowledgeQuestionId(row.questionId)) throw invalid();
    return { sessionId: row.sessionId, questionId: row.questionId, ...optional };
  }
  if (typeof row.message !== "string" || !row.message.trim() || row.message.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(row.message)) throw invalid();
  return { sessionId: row.sessionId, message: row.message, ...optional };
}

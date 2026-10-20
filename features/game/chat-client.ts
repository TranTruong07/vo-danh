import type { ChatRequestInput, ChatResponse, ChatSessionResult, OpenChatSessionAction } from "@/server/domain/chat";

export class ChatClientError extends Error {
  constructor(public code: string, message: string, public retryAfter = 0) { super(message); }
}
export function chatResponseText(response: ChatResponse): string {
  if (response.status !== 'suggest') return response.answer;
  return response.message || (response.suggestions.length
    ? 'Có phải bạn muốn hỏi một trong những câu này?'
    : 'Mình chưa tìm được câu phù hợp. Bạn thử diễn đạt rõ hơn nhé.');
}
export async function requestChatSession(action: OpenChatSessionAction, requestId: string, timeoutMs = 20000): Promise<ChatSessionResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([action(requestId), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ChatClientError("NETWORK", "Kết nối trò chuyện mất nhiều thời gian. Hãy thử lại khi mạng ổn định.")), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}
export async function requestChat(sessionId: string, input: ChatRequestInput | null, signal: AbortSignal): Promise<ChatResponse> {
  const endpoint = input === null ? "/api/chat/suggestions" : "questionId" in input ? "/api/chat/answer" : "/api/chat";
  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", credentials: "same-origin", cache: "no-store", signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, ...input }) });
  } catch { throw new ChatClientError("NETWORK", "Chưa kết nối được trò chuyện. Hãy kiểm tra mạng rồi thử lại; câu hỏi trắc nghiệm vẫn được giữ nguyên."); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 403 && data?.code === 'QUESTION_NOT_ANSWERED') throw new ChatClientError('QUESTION_NOT_ANSWERED', 'Hãy trả lời câu hỏi trước khi trò chuyện với nhân vật.');
    const retryAfter = Math.min(120, Math.max(1, Number(response.headers.get("Retry-After")) || 30));
    if (response.status === 401) throw new ChatClientError("INVALID_SESSION", "Phiên trò chuyện đã hết hạn hoặc không còn hợp lệ. Hãy quét lại mã QR.");
    if (response.status === 409) throw new ChatClientError('CONFLICT', 'Gợi ý hoặc lượt gửi này không còn hợp lệ. Hãy nhập một câu hỏi mới để tiếp tục.');
    if (response.status === 429) throw new ChatClientError("RATE_LIMITED", `Bạn đang gửi hơi nhanh. Vui lòng chờ khoảng ${retryAfter} giây rồi thử lại.`, retryAfter);
    throw new ChatClientError(data?.code || "UNAVAILABLE", response.status === 403 ? "Nhân vật này chưa thể trò chuyện. Hãy quét lại mã QR hoặc thử thẻ khác." : "Chưa nhận được phản hồi. Bạn thử lại sau một chút nhé.");
  }
  if (!data || !["answered", "suggest", "out_of_scope"].includes(data.status)
    || (data.status === 'suggest' && data.message !== undefined && typeof data.message !== 'string')
    || (data.status === "suggest" ? !Array.isArray(data.suggestions) || data.suggestions.some((s: { questionId?: unknown; question?: unknown }) => typeof s?.questionId !== "string" || typeof s?.question !== "string") : typeof data.answer !== "string")
    || (data.status === "answered" && (typeof data.source?.document !== "string" || typeof data.source?.sectionId !== "string"))) {
    throw new ChatClientError("UNAVAILABLE", "Phản hồi chưa đầy đủ. Bạn thử lại sau nhé.");
  }
  return data as ChatResponse;
}

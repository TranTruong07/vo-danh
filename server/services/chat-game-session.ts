import "server-only";
import { ChatError, isChatSessionId, type ChatSessionResult } from "@/server/domain/chat";
import { chatCharacterExists } from "@/server/repositories/chat-session";
import { reserveChatBinding } from "@/server/repositories/chat-game-sessions";
import { resolveMappedCharacter } from "./chat-characters";
import { playerSession } from "./player-session";
import { limitChatRequests } from "./chat-rate-limit";

// Called only by the QR page's encrypted Server Action closure. The browser
// supplies an idempotency request ID, never a persona or character argument.
export async function openCharacterChat(characterId: string, requestId: string): Promise<ChatSessionResult> {
  try {
    if (!isChatSessionId(requestId) || !/^[a-f0-9]{24}$/.test(characterId)) throw new ChatError("INVALID_INPUT", "Không mở được phiên trò chuyện.", 400);
    const ownerHash = await playerSession(true);
    await limitChatRequests(ownerHash);
    resolveMappedCharacter(characterId);
    if (!await chatCharacterExists(characterId)) throw new ChatError("CHARACTER_UNAVAILABLE", "Nhân vật không còn khả dụng. Hãy quét thẻ khác.", 403);
    const session = await reserveChatBinding(characterId, ownerHash, requestId);
    if (session.characterId !== characterId || session.ownerHash !== ownerHash || session.expiresAt.getTime() <= Date.now()) throw new ChatError("INVALID_SESSION", "Phiên trò chuyện đã hết hạn. Hãy quét lại mã QR.", 401);
    return { ok: true, sessionId: session._id, expiresAt: session.expiresAt.toISOString() };
  } catch (error) {
    if (error instanceof ChatError) return { ok: false, code: error.code, message: error.message, ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}) };
    return { ok: false, code: "CHAT_UNAVAILABLE", message: "Chưa mở được trò chuyện. Hãy kiểm tra mạng và thử lại." };
  }
}

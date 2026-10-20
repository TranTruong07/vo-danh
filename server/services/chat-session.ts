import "server-only";
import { playerSession } from "./player-session";
import { GameError } from "@/server/domain/character";
import { ChatError, isChatSessionId } from "@/server/domain/chat";
import { readChatGameSession, chatCharacterExists } from "@/server/repositories/chat-session";
import { resolveMappedCharacter } from "./chat-characters";

const expired = () => new ChatError("INVALID_SESSION", "Phiên trò chuyện không còn hợp lệ. Hãy quét lại mã QR.", 401);
export async function chatPlayerHash() {
  try { return await playerSession(false); }
  catch (error) { if (error instanceof GameError) throw expired(); throw error; }
}
export async function resolveChatSession(sessionId: string, ownerHash: string) {
  if (!isChatSessionId(sessionId) || !/^[a-f0-9]{64}$/.test(ownerHash)) throw expired();
  const session = await readChatGameSession(sessionId, ownerHash);
  if (!session || session._id !== sessionId || session.ownerHash !== ownerHash || session.state !== "ready" || !(session.expiresAt instanceof Date) || !Number.isFinite(session.expiresAt.getTime()) || session.expiresAt.getTime() <= Date.now()) throw expired();
  if (!/^[a-f0-9]{24}$/.test(session.characterId) || !await chatCharacterExists(session.characterId)) throw expired();
  if (session.quizAnswered === false) throw new ChatError("QUESTION_NOT_ANSWERED", "Hãy trả lời câu hỏi trước khi trò chuyện với nhân vật.", 403);
  return { characterId: resolveMappedCharacter(session.characterId), sessionId, ownerHash };
}

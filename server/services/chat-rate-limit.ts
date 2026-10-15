import "server-only";
import { incrementChatLimit } from "@/server/repositories/chat-limits";
import { ChatError } from "@/server/domain/chat";

// Shared MongoDB counters across both endpoints and all deployment instances.
export const CHAT_LIMITS = { playerPerMinute: 20, globalPerMinute: 300 } as const;
export async function limitChatRequests(ownerHash: string, now = Date.now()) {
  const minute = Math.floor(now / 60000), expiresAt = new Date((minute + 2) * 60000);
  for (const [key, maximum] of [["global", CHAT_LIMITS.globalPerMinute], [`player:${ownerHash}`, CHAT_LIMITS.playerPerMinute]] as const) {
    if (await incrementChatLimit(`${minute}:${key}`, expiresAt) > maximum) {
      throw new ChatError("RATE_LIMITED", "Có nhiều lượt trò chuyện. Cháu chờ một chút rồi thử lại nhé.", 429, Math.max(1, Math.ceil(((minute + 1) * 60000 - now) / 1000)));
    }
  }
}

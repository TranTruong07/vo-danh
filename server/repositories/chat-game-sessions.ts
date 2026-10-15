import "server-only";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import type { ChatGameSession } from "./chat-session";

interface ChatBinding extends ChatGameSession { requestId: string; createdAt: Date }
let indexes: Promise<unknown> | undefined;
export async function reserveChatBinding(characterId: string, ownerHash: string, requestId: string): Promise<ChatGameSession> {
  const rows = (await getDatabase()).collection<ChatBinding>("chat_game_sessions");
  indexes ??= Promise.all([
    rows.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    rows.createIndex({ ownerHash: 1, requestId: 1 }, { unique: true }),
  ]).catch(error => { indexes = undefined; throw error; });
  await indexes;
  const now = new Date(), filter = { ownerHash, requestId };
  const row: ChatBinding = { _id: randomUUID(), ownerHash, requestId, characterId, state: "ready", createdAt: now, expiresAt: new Date(now.getTime() + 20 * 60000) };
  try { await rows.updateOne(filter, { $setOnInsert: row }, { upsert: true }); }
  catch (error) { if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) throw error; }
  const binding = await rows.findOne(filter);
  if (!binding) throw new Error("Chat session unavailable");
  return binding;
}

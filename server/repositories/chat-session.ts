import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/client";
import type { QuizAttemptModel } from "@/server/models/character";

export type ChatGameSession = Pick<QuizAttemptModel, "_id" | "ownerHash" | "characterId" | "state" | "expiresAt">;
export async function readChatGameSession(id: string, ownerHash: string): Promise<ChatGameSession | null> {
  const db = await getDatabase();
  // Read only the binding; do not read quiz answers, score, selectedIndex, or mutate quiz indexes/state.
  const query = { _id: id, ownerHash, state: "ready" as const, expiresAt: { $gt: new Date() } };
  const options = { projection: { _id: 1, ownerHash: 1, characterId: 1, state: 1, expiresAt: 1 }, maxTimeMS: 5000 };
  const quiz = await db.collection<ChatGameSession>("quiz_attempts").findOne(
    query, options,
  );
  // Local-first quiz has no server attempt. Its chat binding is created separately
  // by a Server Action capturing the character resolved on the QR page.
  return quiz ?? db.collection<ChatGameSession>("chat_game_sessions").findOne(query, options);
}
export async function chatCharacterExists(id: string) {
  return !!await (await getDatabase()).collection("characters").findOne({ _id: new ObjectId(id) }, { projection: { _id: 1 }, maxTimeMS: 5000 });
}

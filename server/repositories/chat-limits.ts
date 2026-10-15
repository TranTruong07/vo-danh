import "server-only";
import { getDatabase } from "@/lib/db/client";

interface ChatLimit { _id: string; count: number; expiresAt: Date }
let indexes: Promise<unknown> | undefined;
export async function incrementChatLimit(id: string, expiresAt: Date): Promise<number> {
  const rows = (await getDatabase()).collection<ChatLimit>("chat_limits");
  indexes ??= rows.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(error => { indexes = undefined; throw error; });
  await indexes;
  let row;
  try {
    row = await rows.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, returnDocument: "after", maxTimeMS: 5000 });
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) throw error;
    row = await rows.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: "after", maxTimeMS: 5000 });
  }
  if (!row) throw new Error("Chat quota unavailable");
  return row.count;
}

import "server-only";
import { getDatabase } from "@/lib/db/client";
import type { AiDecision } from "@/server/domain/chat-ai";

interface CacheRow { _id: string; decision: AiDecision; expiresAt: Date }
let indexes: Promise<unknown> | undefined;
async function collection() {
  const rows = (await getDatabase()).collection<CacheRow>("chat_ai_match_cache");
  indexes ??= rows.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(error => { indexes = undefined; throw error; });
  await indexes;
  return rows;
}
export async function readAiCache(key: string): Promise<AiDecision | null> {
  const row = await (await collection()).findOne({ _id: key, expiresAt: { $gt: new Date() } }, { maxTimeMS: 2000 });
  const value = row?.decision;
  if (value?.decision === "no_match" && value.questionId === null) return value;
  if (value?.decision === "match" && typeof value.questionId === "string") return value;
  return null;
}
export async function writeAiCache(key: string, decision: AiDecision, ttlSeconds: number): Promise<void> {
  await (await collection()).updateOne({ _id: key }, { $set: { decision, expiresAt: new Date(Date.now() + ttlSeconds * 1000) } }, { upsert: true, maxTimeMS: 2000 });
}

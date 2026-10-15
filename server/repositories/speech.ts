import "server-only";
import { randomUUID } from "node:crypto";
import { MongoServerError } from "mongodb";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getDatabase } from "@/lib/db/client";
import { getR2Client, R2_BUCKET } from "@/server/infrastructure/r2";

interface SpeechAsset { _id: string; state: "generating" | "ready"; owner?: string; leaseUntil?: Date; updatedAt: Date }
const collection = async () => (await getDatabase()).collection<SpeechAsset>("speech_assets");
export async function readySpeechIds(ids: string[]) {
  if (!ids.length) return new Set<string>();
  return new Set((await (await collection()).find({ _id: { $in: ids }, state: "ready" }, { projection: { _id: 1 } }).toArray()).map(row => row._id));
}
export async function claimSpeech(id: string) {
  const owner = randomUUID();
  try {
    const row = await (await collection()).findOneAndUpdate({ _id: id, state: { $ne: "ready" }, $or: [{ leaseUntil: { $lt: new Date() } }, { leaseUntil: { $exists: false } }] }, { $set: { state: "generating", owner, leaseUntil: new Date(Date.now() + 180000), updatedAt: new Date() } }, { upsert: true, returnDocument: "after" });
    return row?.owner === owner ? owner : null;
  } catch (error) { if (error instanceof MongoServerError && error.code === 11000) return null; throw error; }
}
export async function storeSpeech(id: string, owner: string, bytes: Buffer) {
  await getR2Client().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: `audio/tts/${id}.mp3`, Body: bytes, ContentType: "audio/mpeg", CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(25000) });
  await (await collection()).updateOne({ _id: id, owner }, { $set: { state: "ready", updatedAt: new Date() }, $unset: { owner: "", leaseUntil: "" } });
}
export async function releaseSpeech(id: string, owner: string) { await (await collection()).deleteOne({ _id: id, owner, state: "generating" }); }
export async function readSpeechFile(id: string, range?: string) {
  return getR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: `audio/tts/${id}.mp3`, ...(range ? { Range: range } : {}) }), { abortSignal: AbortSignal.timeout(25000) });
}

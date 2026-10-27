import "server-only";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getDatabase } from "@/lib/db/client";
import { getR2Client, R2_BUCKET } from "@/server/infrastructure/r2";
import { MongoServerError } from "mongodb";
import type { QuizAudioManifest, QuizAudioAsset } from "@/server/models/quiz-audio";
import type { AudioSegment } from "@/server/domain/quiz-audio";

interface SpeechAsset { _id: string; state: "generating" | "ready"; owner?: string; leaseUntil?: Date; updatedAt: Date }
const collection = async () => (await getDatabase()).collection<SpeechAsset>("speech_assets");
export async function storeSpeech(id: string, owner: string, bytes: Buffer) {
  await getR2Client().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: `audio/tts/${id}.mp3`, Body: bytes, ContentType: "audio/mpeg", CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(25000) });
  await (await collection()).updateOne({ _id: id, owner }, { $set: { state: "ready", updatedAt: new Date() }, $unset: { owner: "", leaseUntil: "" } });
}
export async function readSpeechFile(id: string, range?: string) {
  return getR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: `audio/tts/${id}.mp3`, ...(range ? { Range: range } : {}) }), { abortSignal: AbortSignal.timeout(25000) });
}

const quizCollection = async () => (await getDatabase()).collection<QuizAudioManifest>("speech_assets");
type QuizProvider = "legacy" | "ttsforfree";
const quizId = (id: string, provider: QuizProvider) => provider === "legacy" ? `quiz-audio:${id}` : `quiz-audio:ttsforfree:${id}`;
export async function readQuizAudio(id: string, provider: QuizProvider = "legacy") { return (await quizCollection()).findOne({ _id: quizId(id, provider), kind: "quiz-audio" }); }
/** One query for the offline pack, instead of querying each question separately. */
export async function readQuizAudioBatch(ids: string[]) {
  if (!ids.length) return [];
  return (await quizCollection()).find({ _id: { $in: ids.map(id => quizId(id, "ttsforfree")) }, kind: "quiz-audio" }).toArray();
}
export async function readQuizAudioFile(key: string, range?: string) {
  return getR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key, ...(range ? { Range: range } : {}) }), { abortSignal: AbortSignal.timeout(25000) });
}
/** The existing unique _id index is also the cross-process single-question mutex. */
export async function claimQuizAudio(id: string, owner: string, voiceId: string, provider: QuizProvider = "legacy") {
  const now = new Date();
  try {
    return await (await quizCollection()).findOneAndUpdate({ _id: quizId(id, provider), $or: [{ owner: { $exists: false } }, { leaseUntil: { $lte: now } }] }, {
      $setOnInsert: { kind: "quiz-audio", questionId: id, segments: {} },
      $set: { owner, voiceId, leaseUntil: new Date(now.getTime() + 600000), updatedAt: now },
    }, { upsert: true, returnDocument: "after" });
  } catch (error) { if (error instanceof MongoServerError && error.code === 11000) return null; throw error; }
}
export async function saveQuizAudioSegment(id: string, owner: string, segment: AudioSegment, asset: QuizAudioAsset, provider: QuizProvider = "legacy") {
  const result = await (await quizCollection()).updateOne({ _id: quizId(id, provider), owner, leaseUntil: { $gt: new Date() } }, { $set: { [`segments.${segment}`]: asset, updatedAt: new Date() } });
  if (result.matchedCount !== 1) throw new Error("Audio lease lost");
}
export async function releaseQuizAudio(id: string, owner: string, provider: QuizProvider = "legacy") {
  await (await quizCollection()).updateOne({ _id: quizId(id, provider), owner }, { $unset: { owner: "", leaseUntil: "" }, $set: { updatedAt: new Date() } });
}
/** Reuses the same R2 client/bucket as legacy speech. Never deletes an earlier asset. */
export async function uploadQuizAudio(key: string, bytes: Buffer) {
  await getR2Client().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: bytes, ContentType: "audio/mpeg", CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(25000) });
}

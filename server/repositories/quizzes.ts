import "server-only";
import { getDatabase } from "@/lib/db/client";
import type { QuizAttemptModel } from "@/server/models/character";
import type { QuizQuestion } from "@/server/domain/quiz";
import { GameError } from "@/server/domain/character";

const state = globalThis as typeof globalThis & { quizIndexes?: Promise<unknown> };
async function collections() {
  const db = await getDatabase();
  const attempts = db.collection<QuizAttemptModel>("quiz_attempts");
  const limits = db.collection<{ _id: string; count: number; expiresAt: Date }>("quiz_limits");
  state.quizIndexes ??= Promise.all([attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }), limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })]).catch(error => { state.quizIndexes = undefined; throw error; });
  await state.quizIndexes;
  return { attempts, limits };
}
export async function limitQuizGeneration(ownerHash: string) {
  const { limits } = await collections();
  const minute = Math.floor(Date.now() / 60000);
  for (const [key, max] of [[ownerHash, 10], ["global", 120]] as const) {
    const id = `${minute}:${key}`;
    let count;
    try { count = await limits.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((minute + 2) * 60000) } }, { upsert: true, returnDocument: "after" }); }
    catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
      count = await limits.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: "after" });
    }
    if (!count || count.count > max) throw new GameError("Đã có nhiều lượt tạo câu hỏi. Vui lòng chờ một phút rồi thử lại.");
  }
}
export async function getQuiz(id: string, ownerHash: string) {
  return (await collections()).attempts.findOne({ _id: id, ownerHash, expiresAt: { $gt: new Date() } });
}
export async function reserveQuiz(row: QuizAttemptModel) {
  try { await (await collections()).attempts.insertOne(row); return true; }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return false;
    throw error;
  }
}
export async function finishQuiz(id: string, question: QuizQuestion, fact: string, sources: string, sourceQuestionId?: string) {
  return (await collections()).attempts.findOneAndUpdate({ _id: id, state: "generating" }, { $set: { question, fact, sources, state: "ready", ...(sourceQuestionId ? { sourceQuestionId } : {}) } }, { returnDocument: "after" });
}
export async function failQuiz(id: string) { await (await collections()).attempts.updateOne({ _id: id }, { $set: { state: "failed" } }); }
export async function chooseAnswer(id: string, ownerHash: string, selectedIndex: number) {
  const { attempts } = await collections();
  await attempts.updateOne({ _id: id, ownerHash, state: "ready", expiresAt: { $gt: new Date() }, selectedIndex: { $exists: false } }, { $set: { selectedIndex } });
  return getQuiz(id, ownerHash);
}

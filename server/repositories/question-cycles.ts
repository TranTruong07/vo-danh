import "server-only";
import { ObjectId } from "mongodb";
import { randomInt } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { questionCandidates } from "@/server/domain/question-cycle";
import { GameError } from "@/server/domain/character";
import type { CharacterQuestionModel } from "@/server/models/character-question";

interface QuestionCycle { _id: string; ownerHash: string; characterId: string; seenIds: string[]; lastId: string; version: number; expiresAt: Date }
const state = globalThis as typeof globalThis & { questionCycleIndexes?: Promise<unknown> };
export async function drawCharacterQuestion(characterId: string, ownerHash: string) {
  const db = await getDatabase(), cycles = db.collection<QuestionCycle>("question_cycles"), questions = db.collection<CharacterQuestionModel>("character_questions");
  state.questionCycleIndexes ??= cycles.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(error => { state.questionCycleIndexes = undefined; throw error; });
  await state.questionCycleIndexes;
  const id = `${ownerHash}:${characterId}`;
  for (let retry = 0; retry < 12; retry++) {
    const [current, available] = await Promise.all([
      cycles.findOne({ _id: id }),
      questions.find({ characterId }, { projection: { _id: 1 } }).toArray(),
    ]);
    if (!available.length) return null;
    const active = current && current.expiresAt > new Date() ? current : null;
    const bag = questionCandidates(available.map(row => row._id.toHexString()), active?.seenIds || [], active?.lastId);
    const selected = bag.candidates[randomInt(bag.candidates.length)];
    // Recheck association in case admin moved/deleted a question while the list was being read.
    const question = await questions.findOne({ _id: new ObjectId(selected), characterId });
    if (!question) continue;
    const next: QuestionCycle = { _id: id, ownerHash, characterId, seenIds: [...bag.seenIds, selected], lastId: selected, version: (current?.version || 0) + 1, expiresAt: new Date(Date.now() + 30 * 86400000) };
    if (current) {
      const result = await cycles.replaceOne({ _id: id, version: current.version }, next);
      if (result.modifiedCount) return question;
    } else {
      try { await cycles.insertOne(next); return question; }
      catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error; }
    }
    // Compare-and-swap retries ensure parallel tabs cannot consume the same bag slot.
  }
  throw new GameError("Đang có lượt chơi khác tải câu hỏi. Vui lòng thử lại sau ít giây.");
}

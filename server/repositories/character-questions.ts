import "server-only";
import { MongoBulkWriteError, MongoServerError, ObjectId } from "mongodb";
import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import type { CharacterQuestionModel } from "@/server/models/character-question";
import type { CharacterQuestionInput, CharacterQuestionListItem, CharacterQuestionRecord, QuestionCharacterChoice } from "@/server/domain/character-question";
import { GameError, isCharacterId } from "@/server/domain/character";
import { normalizeQuestion } from "@/server/domain/character-question";

const state = globalThis as typeof globalThis & { questionImportIndexes?: Promise<unknown> };
async function collection() {
  const rows = (await getDatabase()).collection<CharacterQuestionModel>("character_questions");
  state.questionImportIndexes ??= Promise.all([
    rows.createIndex({ characterId: 1, updatedAt: -1 }),
    rows.createIndex({ characterId: 1, questionKey: 1 }, { unique: true, partialFilterExpression: { questionKey: { $type: "string" } } }),
  ]).catch(error => { state.questionImportIndexes = undefined; throw error; });
  await state.questionImportIndexes;
  return rows;
}
export function questionRecord(row: CharacterQuestionModel): CharacterQuestionRecord {
  return { id: row._id.toHexString(), characterId: row.characterId, question: row.question, answers: row.answers, correctIndex: row.correctIndex, correctFeedback: row.correctFeedback, incorrectFeedback: row.incorrectFeedback, updatedAt: row.updatedAt.toISOString() };
}
export async function questionCharacterChoices(): Promise<QuestionCharacterChoice[]> {
  const db = await getDatabase();
  const questions = await collection();
  const [characters, counts] = await Promise.all([
    db.collection<{ _id: ObjectId; name: string; image: string }>("characters").find({}, { projection: { name: 1, image: 1 } }).sort({ name: 1 }).toArray(),
    questions.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$characterId", count: { $sum: 1 } } }]).toArray(),
  ]);
  const countById = new Map(counts.map(row => [row._id, row.count]));
  return characters.map(row => ({ id: row._id.toHexString(), name: row.name, image: row.image, questionCount: countById.get(row._id.toHexString()) || 0 }));
}
export async function listCharacterQuestions(page: number, search: string, characterId: string) {
  const rows = await collection();
  const filter = { ...(characterId ? { characterId } : {}), ...(search ? { question: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {}) };
  const [items, total] = await Promise.all([
    rows.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * 10).limit(10).toArray(),
    rows.countDocuments(filter),
  ]);
  return { items: items.map(questionRecord), total };
}
export async function findCharacterQuestion(id: string) {
  return isCharacterId(id) ? (await collection()).findOne({ _id: new ObjectId(id) }) : null;
}
export async function saveCharacterQuestion(id: string | null, data: CharacterQuestionInput) {
  const rows = await collection();
  const now = new Date();
  const keyed = { ...data, questionKey: questionKey(data.question) };
  try {
    if (id) return await rows.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...keyed, updatedAt: now } }, { returnDocument: "after" });
    const row = { ...keyed, _id: new ObjectId(), createdAt: now, updatedAt: now };
    await rows.insertOne(row);
    return row;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) throw new GameError("Câu hỏi này đã có trong danh sách của nhân vật.");
    throw error;
  }
}

function questionKey(question: string) { return createHash("sha256").update(normalizeQuestion(question)).digest("hex"); }

export async function existingQuestionTexts(characterId: string, excludeId?: string | null) {
  return (await collection()).find({ characterId, ...(excludeId ? { _id: { $ne: new ObjectId(excludeId) } } : {}) }, { projection: { question: 1 } }).toArray();
}
export async function questionsForSpeech(characterId: string) {
  return (await (await collection()).find({ characterId }).sort({ _id: 1 }).toArray()).map(questionRecord);
}

/** Atomic insert-only upserts also protect against concurrent/repeated imports. */
export async function importCharacterQuestions(inputs: CharacterQuestionInput[]): Promise<Set<number>> {
  if (!inputs.length) return new Set();
  const rows = await collection();
  const now = new Date();
  const operations = inputs.map(data => {
    const key = questionKey(data.question);
    return { updateOne: { filter: { characterId: data.characterId, questionKey: key }, update: { $setOnInsert: { ...data, questionKey: key, createdAt: now, updatedAt: now } }, upsert: true } };
  });
  try {
    const result = await rows.bulkWrite(operations, { ordered: false });
    return new Set(Object.keys(result.upsertedIds).map(Number));
  } catch (error) {
    if (error instanceof MongoBulkWriteError && !error.result.getWriteConcernError()) {
      const errors = Array.isArray(error.writeErrors) ? error.writeErrors : [error.writeErrors];
      if (errors.length && errors.every(item => item.code === 11000)) return new Set(Object.keys(error.result.upsertedIds).map(Number));
    }
    throw error;
  }
}
export async function deleteCharacterQuestion(id: string) { return (await collection()).deleteOne({ _id: new ObjectId(id) }); }
export async function hasCharacterQuestions(characterId: string) { return !!await (await collection()).findOne({ characterId }, { projection: { _id: 1 } }); }

export function withCharacterNames(items: CharacterQuestionRecord[], choices: QuestionCharacterChoice[]): CharacterQuestionListItem[] {
  const map = new Map(choices.map(row => [row.id, row]));
  return items.map(item => ({ ...item, characterName: map.get(item.characterId)?.name || "Nhân vật đã bị xóa", characterImage: map.get(item.characterId)?.image || "" }));
}

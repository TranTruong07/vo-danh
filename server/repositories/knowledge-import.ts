import "server-only";
import { getDatabase } from "@/lib/db/client";
import type { KnowledgeQuestionModel, KnowledgeRevisionModel } from "@/server/models/knowledge";

// Read-only path intentionally does not create indexes/collections.
export async function readKnowledgeImportState() {
  const db = await getDatabase();
  const [questions, revisions] = await Promise.all([
    db.collection<KnowledgeQuestionModel>("knowledge_questions").find({}).toArray(),
    db.collection<KnowledgeRevisionModel>("knowledge_question_revisions").find({}).toArray(),
  ]);
  return { questions, revisions };
}
export async function ensureKnowledgeImportIndexes() {
  const db = await getDatabase();
  await db.collection("knowledge_question_revisions").createIndex({ questionId: 1, version: 1 }, { unique: true });
  await db.collection("knowledge_question_revisions").createIndex({ status: 1, questionId: 1 });
  await db.collection("knowledge_questions").createIndex({ topicId: 1 });
}
export async function insertKnowledgeDraft(question: KnowledgeQuestionModel, revision: KnowledgeRevisionModel) {
  const db = await getDatabase();
  // Insert-only revisions: never update an existing row, even a draft. Unique indexes settle races.
  await db.collection<KnowledgeRevisionModel>("knowledge_question_revisions").insertOne(revision);
  await ensureKnowledgeLogicalQuestion(question);
}
export async function ensureKnowledgeLogicalQuestion(question: KnowledgeQuestionModel) {
  // Also repairs a previously interrupted import after its revision insert; never changes a pointer.
  const db = await getDatabase();
  await db.collection<KnowledgeQuestionModel>("knowledge_questions").updateOne({ _id: question._id }, { $setOnInsert: question }, { upsert: true });
}

import "server-only";
import { getDatabase, getMongoClient } from "@/lib/db/client";
import { KNOWLEDGE_TOPIC } from "@/server/domain/knowledge";
import { KnowledgeAdminError } from "@/server/domain/knowledge-admin";
import type { KnowledgeAuditModel, KnowledgeQuestionModel, KnowledgeRevisionModel } from "@/server/models/knowledge";
import { ensureKnowledgeImportIndexes } from "./knowledge-import";

export interface KnowledgeState { question: KnowledgeQuestionModel; revisions: KnowledgeRevisionModel[] }
export interface KnowledgeMutation {
  insert?: KnowledgeRevisionModel;
  review?: { revisionId: string; previousStatus: KnowledgeRevisionModel["status"]; status: KnowledgeRevisionModel["status"]; reviewedBy?: string; reviewedAt?: Date; rejectionReason?: string };
  publication?: string | null;
  audit: KnowledgeAuditModel;
}
const missing = () => new KnowledgeAdminError("NOT_FOUND", "Không tìm thấy câu hỏi đã import.", 404);
const conflict = () => new KnowledgeAdminError("CONFLICT", "Dữ liệu đã thay đổi ở phiên khác. Tải lại trang rồi kiểm tra trước khi thao tác.", 409);

export async function listKnowledgeRecords() {
  const db = await getDatabase();
  return db.collection<KnowledgeQuestionModel>("knowledge_questions").aggregate<KnowledgeQuestionModel & { latest: KnowledgeRevisionModel }>([
    { $match: { topicId: KNOWLEDGE_TOPIC } },
    { $lookup: { from: "knowledge_question_revisions", localField: "_id", foreignField: "questionId", pipeline: [{ $sort: { version: -1 } }, { $limit: 1 }], as: "latest" } },
    { $unwind: "$latest" }, { $sort: { _id: 1 } }, { $limit: 2001 },
  ], { maxTimeMS: 5000 }).toArray();
}
export async function readKnowledgeState(id: string): Promise<KnowledgeState> {
  const db = await getDatabase();
  const question = await db.collection<KnowledgeQuestionModel>("knowledge_questions").findOne({ _id: id, topicId: KNOWLEDGE_TOPIC });
  if (!question) throw missing();
  const revisions = await db.collection<KnowledgeRevisionModel>("knowledge_question_revisions").find({ questionId: id }).sort({ version: -1 }).toArray();
  return { question, revisions };
}
export async function readKnowledgeAudit(id: string) {
  return (await getDatabase()).collection<KnowledgeAuditModel>("knowledge_audit").find({ questionId: id }).sort({ createdAt: -1, _id: -1 }).toArray();
}
export async function mutateKnowledge(id: string, expectedVersion: number, plan: (state: KnowledgeState) => KnowledgeMutation) {
  const client = await getMongoClient(), db = await getDatabase();
  // Called only by an authorized mutation, never by GET/build or dry-run.
  await ensureKnowledgeImportIndexes();
  await db.collection("knowledge_audit").createIndex({ questionId: 1, createdAt: -1 });
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const questions = db.collection<KnowledgeQuestionModel>("knowledge_questions"), revisions = db.collection<KnowledgeRevisionModel>("knowledge_question_revisions");
      const question = await questions.findOne({ _id: id, topicId: KNOWLEDGE_TOPIC }, { session });
      if (!question) throw missing();
      if ((question.managementVersion ?? 0) !== expectedVersion) throw conflict();
      const rows = await revisions.find({ questionId: id }, { session }).sort({ version: -1 }).toArray();
      const change = plan({ question, revisions: rows });
      // All management operations lock the logical record, so publish/review/edit races serialize.
      const updated = await questions.updateOne({ _id: id, ...(question.managementVersion === undefined ? { managementVersion: { $exists: false } } : { managementVersion: expectedVersion }) }, {
        $inc: { managementVersion: 1 }, $set: { updatedAt: change.audit.createdAt, ...(typeof change.publication === "string" ? { publishedVersionId: change.publication } : {}) },
        ...(change.publication === null ? { $unset: { publishedVersionId: "" } } : {}),
      }, { session });
      if (!updated.matchedCount) throw conflict();
      if (change.insert) await revisions.insertOne(change.insert, { session });
      if (change.review) {
        const { revisionId, previousStatus, ...metadata } = change.review;
        const result = await revisions.updateOne({ _id: revisionId, questionId: id, status: previousStatus }, { $set: { ...metadata, updatedAt: change.audit.createdAt } }, { session });
        if (!result.matchedCount) throw conflict();
      }
      await db.collection<KnowledgeAuditModel>("knowledge_audit").insertOne(change.audit, { session });
      return { revisionId: change.insert?._id ?? change.audit.revisionId, managementVersion: expectedVersion + 1 };
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, maxCommitTimeMS: 10000 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) throw conflict();
    throw error;
  } finally { await session.endSession(); }
}

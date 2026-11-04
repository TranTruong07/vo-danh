import 'server-only';
import { getDatabase, getMongoClient } from '@/lib/db/client';
import type { ClientSession } from 'mongodb';
import type { KnowledgeQuestionModel, KnowledgeRevisionModel } from '@/server/models/knowledge';
import { planOldKnowledgeCleanup, type KnowledgeCleanupPlan } from '@/server/services/knowledge-cleanup';

export async function inspectOldKnowledgeCleanup(session?: ClientSession) {
  const db = await getDatabase();
  if (db.databaseName !== 'vo_danh') throw new Error('CLEANUP_WRONG_DATABASE');
  const questions = await db.collection<KnowledgeQuestionModel>('knowledge_questions').find({}, { session }).limit(61).toArray();
  const revisions = await db.collection<KnowledgeRevisionModel>('knowledge_question_revisions').find({}, { session }).limit(76).toArray();
  return planOldKnowledgeCleanup(db.databaseName, { questions, revisions });
}
// Operator-only CLI. No public/admin route exposes this destructive operation.
export async function applyOldKnowledgeCleanup(expected: KnowledgeCleanupPlan) {
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try {
    session.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    const actual = await inspectOldKnowledgeCleanup(session);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('CLEANUP_SNAPSHOT_CHANGED');
    const revisions = await db.collection<KnowledgeRevisionModel>('knowledge_question_revisions').deleteMany({ _id: { $in: actual.revisions }, 'source.sourceSha256': actual.sourceHash }, { session });
    const questions = await db.collection<KnowledgeQuestionModel>('knowledge_questions').deleteMany({ _id: { $in: actual.questions } }, { session });
    if (revisions.deletedCount !== 75 || questions.deletedCount !== 60) throw new Error('CLEANUP_DELETE_COUNTS_CHANGED');
    // No automatic transaction retry. A failed/unknown commit requires inspection by the operator.
    await session.commitTransaction();
    return { database: db.databaseName, questionsDeleted: questions.deletedCount, revisionsDeleted: revisions.deletedCount, publishedPointersRemoved: 59 };
  } catch (error) { if (session.inTransaction()) await session.abortTransaction(); throw error; }
  finally { await session.endSession(); }
}

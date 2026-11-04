import { createHash } from 'node:crypto';
import { BSON } from 'mongodb';
import type { KnowledgeQuestionModel, KnowledgeRevisionModel } from '@/server/models/knowledge';

export const RETIRED_SOURCE_HASH = 'e6e605448defbca119fcd114682fd61604a0cf2ba48d6dfd614fd91c8223ec7b';
export interface KnowledgeCleanupState { questions: KnowledgeQuestionModel[]; revisions: KnowledgeRevisionModel[] }
export function knowledgeStateHash(rows: { _id: string }[]) {
  return createHash('sha256').update(BSON.EJSON.stringify([...rows].sort((a, b) => a._id.localeCompare(b._id)), { relaxed: false })).digest('hex');
}
export function planOldKnowledgeCleanup(database: string, state: KnowledgeCleanupState) {
  if (database !== 'vo_danh') throw new Error('CLEANUP_WRONG_DATABASE');
  const { questions, revisions } = state;
  if (questions.length !== 60 || revisions.length !== 75 || questions.filter(q => q.publishedVersionId).length !== 59) throw new Error('CLEANUP_COUNTS_CHANGED');
  const ids = new Set(questions.map(q => q._id));
  if (ids.size !== 60 || new Set(revisions.map(r => r._id)).size !== 75) throw new Error('CLEANUP_DUPLICATE_IDS');
  for (const q of questions) {
    if (!/^cmtt45-q\d{3}$/.test(q._id) || Number(q._id.slice(-3)) < 1 || Number(q._id.slice(-3)) > 60
      || q.topicId !== 'cach-mang-thang-tam-1945' || !revisions.some(r => r.questionId === q._id)) throw new Error('CLEANUP_OUT_OF_SCOPE');
    if (q.publishedVersionId && !revisions.some(r => r._id === q.publishedVersionId && r.questionId === q._id && r.status === 'approved')) throw new Error('CLEANUP_BROKEN_POINTER');
  }
  for (const r of revisions) {
    if (!ids.has(r.questionId) || r._id !== `${r.questionId}:v${r.version}` || r.source.document !== 'Tong-hop-kien-thuc.docx'
      || r.source.sourceSha256 !== RETIRED_SOURCE_HASH) throw new Error('CLEANUP_OUT_OF_SCOPE');
  }
  return { database, questions: questions.map(q => q._id).sort(), revisions: revisions.map(r => r._id).sort(),
    publishedPointers: 59, sourceHash: RETIRED_SOURCE_HASH,
    questionHash: knowledgeStateHash(questions), revisionHash: knowledgeStateHash(revisions) };
}
export type KnowledgeCleanupPlan = ReturnType<typeof planOldKnowledgeCleanup>;

import 'server-only';
import { randomUUID } from 'node:crypto';
import { GridFSBucket, ObjectId, type ClientSession } from 'mongodb';
import { getDatabase, getMongoClient } from '@/lib/db/client';
import { KNOWLEDGE_TOPIC } from '@/server/domain/knowledge';
import type { KnowledgeProposal, SourceChunk, SourceRecord } from '@/server/domain/knowledge-generation';
import type { KnowledgeAuditModel, KnowledgeQuestionModel, KnowledgeRevisionModel } from '@/server/models/knowledge';
import { generationError, type DuplicateCandidate } from '@/server/services/knowledge-generation-validation';

const conflict = () => generationError('Dữ liệu đã thay đổi. Tải lại để kiểm tra trước khi tiếp tục.', 'CONFLICT', 409);
async function ensureGenerationIndexes() {
  const db = await getDatabase();
  await Promise.all([
    db.collection('knowledge_sources').createIndex({ uploadedAt: -1, _id: -1 }),
    db.collection('knowledge_source_chunks').createIndex({ sourceId: 1, order: 1 }, { unique: true }),
    db.collection('knowledge_proposals').createIndex({ createdAt: -1, _id: -1 }),
    db.collection('knowledge_proposals').createIndex({ generationStatus: 1 }),
    db.collection('knowledge_proposals').createIndex({ originalChatGroupId: 1, createdAt: -1 }),
    db.collection('knowledge_generation_audit').createIndex({ entityId: 1, at: -1 }),
  ]);
}
export async function saveKnowledgeSource(source: SourceRecord, chunks: SourceChunk[], bytes: Buffer) {
  await ensureGenerationIndexes();
  const db = await getDatabase(), bucket = new GridFSBucket(db, { bucketName: 'knowledge_private_files' });
  const stream = bucket.openUploadStream(source._id, { metadata: { sourceId: source._id, uploadedBy: source.uploadedBy } });
  await new Promise<void>((resolve, reject) => { stream.on('error', reject); stream.on('finish', resolve); stream.end(bytes); });
  source.storageRef = stream.id.toHexString();
  const session = (await getMongoClient()).startSession();
  try {
    await session.withTransaction(async () => {
      await db.collection<SourceRecord>('knowledge_sources').insertOne(source, { session });
      await db.collection<SourceChunk>('knowledge_source_chunks').insertMany(chunks, { session });
    });
  } catch (error) { await bucket.delete(stream.id).catch(() => undefined); throw error; }
  finally { await session.endSession(); }
  return source;
}
export async function generationSources(page = 1) {
  return (await getDatabase()).collection<SourceRecord>('knowledge_sources').find({}, { projection: { storageRef: 0 } }).sort({ uploadedAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).toArray();
}
export async function generationSource(id: string, session?: ClientSession) {
  const db = await getDatabase();
  const source = await db.collection<SourceRecord>('knowledge_sources').findOne({ _id: id }, { session });
  if (!source) throw generationError('Không tìm thấy tài liệu.', 'NOT_FOUND', 404);
  const chunks = await db.collection<SourceChunk>('knowledge_source_chunks').find({ sourceId: id }, { session }).sort({ order: 1 }).limit(2001).toArray();
  if (chunks.length !== source.chunkCount || chunks.length > 2000) throw generationError('Tài liệu trích xuất chưa đầy đủ.', 'SOURCE_UNAVAILABLE', 409);
  return { source, chunks };
}
export async function registeredSourceByHash(checksum: string) {
  return (await getDatabase()).collection<SourceRecord>('knowledge_sources').findOne({ checksum, sourceStatus: 'confirmed' });
}
export async function confirmKnowledgeSource(id: string, actor: string) {
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { await session.withTransaction(async () => {
    const result = await db.collection<SourceRecord>('knowledge_sources').updateOne({ _id: id, extractionStatus: 'ready', sourceStatus: 'pending' }, { $set: { sourceStatus: 'confirmed', confirmedBy: actor, confirmedAt: new Date() } }, { session });
    if (!result.matchedCount) throw conflict();
    await db.collection('knowledge_generation_audit').insertOne({ entityId: id, action: 'confirm_source', actor, at: new Date() }, { session });
  }); } finally { await session.endSession(); }
}
export async function generationCandidates(session?: ClientSession): Promise<DuplicateCandidate[]> {
  const db = await getDatabase();
  const rows = await db.collection<KnowledgeRevisionModel>('knowledge_question_revisions').find({ status: { $in: ['draft', 'pending_review', 'approved'] } }, { session, projection: { questionId: 1, canonicalQuestion: 1, aliases: 1, approvedAnswer: 1 } }).limit(10001).toArray();
  const proposals = await db.collection<KnowledgeProposal>('knowledge_proposals').find({ generationStatus: { $in: ['ready_for_review', 'insufficient_evidence'] }, content: { $exists: true } }, { session }).limit(1001).toArray();
  if (rows.length > 10000 || proposals.length > 1000) throw generationError('Kho kiến thức vượt giới hạn rà soát; cần phân trang chỉ mục trùng trước khi thêm.', 'CATALOG_LIMIT', 503);
  return [...rows.map(r => ({ id: r.questionId, revisionId: r._id, canonicalQuestion: r.canonicalQuestion, aliases: r.aliases, neutralAnswer: r.approvedAnswer })),
    ...proposals.map(p => ({ id: `proposal:${p._id}`, canonicalQuestion: p.content!.canonicalQuestion, aliases: p.content!.aliases, neutralAnswer: p.content!.neutralAnswer }))];
}
export async function generationBudget(maxDaily: number) {
  const day = new Date().toISOString().slice(0,10);
  const budget = await (await getDatabase()).collection<{ _id: string; calls: number }>('knowledge_generation_budget').findOne({ _id: `generation:${day}` });
  const used = budget?.calls || 0;
  return { day, used, limit: maxDaily, remaining: Math.max(0, maxDaily - used) };
}
export async function saveManualProposal(proposal: KnowledgeProposal) {
  await ensureGenerationIndexes();
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { return await session.withTransaction(async () => {
    const existing = await db.collection<KnowledgeProposal>('knowledge_proposals').findOne({ _id: proposal._id }, { session });
    if (existing) {
      if (existing.requestFingerprint !== proposal.requestFingerprint) throw conflict();
      return { proposalId: existing._id, reused: true };
    }
    await db.collection<KnowledgeProposal>('knowledge_proposals').insertOne(proposal, { session });
    await db.collection('knowledge_generation_audit').insertOne({ entityId: proposal._id, action: 'create_manual', actor: proposal.createdBy, at: proposal.createdAt }, { session });
    return { proposalId: proposal._id, reused: false };
  }); } finally { await session.endSession(); }
}
export async function listProposals(page = 1) {
  return (await getDatabase()).collection<KnowledgeProposal>('knowledge_proposals').find({}).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).toArray();
}
export async function readProposal(id: string) {
  const p = await (await getDatabase()).collection<KnowledgeProposal>('knowledge_proposals').findOne({ _id: id });
  if (!p) throw generationError('Không tìm thấy đề xuất.', 'NOT_FOUND', 404);
  return p;
}
export async function reserveGeneration(proposal: KnowledgeProposal, maxDaily: number) {
  await ensureGenerationIndexes();
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { return await session.withTransaction(async () => {
    const existing = await db.collection<KnowledgeProposal>('knowledge_proposals').findOne({ _id: proposal._id }, { session });
    if (existing) {
      if (proposal.requestFingerprint && existing.requestFingerprint !== proposal.requestFingerprint) throw conflict();
      return { started: false, proposal: existing };
    }
    const key = `generation:${new Date().toISOString().slice(0,10)}`;
    const budgets = db.collection<{ _id: string; calls: number }>('knowledge_generation_budget');
    const budget = await budgets.findOne({ _id: key }, { session });
    if ((budget?.calls || 0) >= maxDaily) throw generationError('Đã dùng hết hạn mức tạo kiến thức hôm nay.', 'GENERATION_QUOTA', 429);
    await budgets.updateOne({ _id: key }, { $inc: { calls: 1 } }, { upsert: true, session });
    await db.collection<KnowledgeProposal>('knowledge_proposals').insertOne(proposal, { session });
    return { started: true, proposal };
  }); } finally { await session.endSession(); }
}
export async function completeGeneration(root: KnowledgeProposal, proposals: KnowledgeProposal[]) {
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { await session.withTransaction(async () => {
    const result = await db.collection<KnowledgeProposal>('knowledge_proposals').replaceOne({ _id: root._id, generationStatus: 'generating', version: 0 }, proposals[0], { session });
    if (!result.matchedCount) throw conflict();
    if (proposals.length > 1) await db.collection<KnowledgeProposal>('knowledge_proposals').insertMany(proposals.slice(1), { session });
    await db.collection('knowledge_generation_audit').insertOne({ entityId: root._id, action: 'generate', actor: root.createdBy, at: new Date(), count: proposals.length }, { session });
  }); } finally { await session.endSession(); }
}
export async function editProposal(id: string, version: number, update: Partial<KnowledgeProposal>, actor: string) {
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { await session.withTransaction(async () => {
    const before = await db.collection<KnowledgeProposal>('knowledge_proposals').findOne({ _id: id, version }, { session });
    const result = await db.collection<KnowledgeProposal>('knowledge_proposals').updateOne({ _id: id, version,
      $or: [{ generationStatus: { $in: ['ready_for_review', 'insufficient_evidence', 'failed'] } },
        ...(update.generationStatus === 'discarded' ? [{ generationStatus: 'generating' as const, updatedAt: { $lt: new Date(Date.now() - 5 * 60000) } }] : [])] },
      { $set: { ...update, updatedAt: new Date() }, $inc: { version: 1 } }, { session });
    if (!result.matchedCount) throw conflict();
    await db.collection('knowledge_generation_audit').insertOne({ entityId: id, action: update.generationStatus === 'discarded' ? 'discard' : 'edit', actor, at: new Date(), version,
      before: { content: before?.content, notes: before?.notes, status: before?.generationStatus },
      after: { content: update.content || before?.content, notes: update.notes ?? before?.notes, status: update.generationStatus } }, { session });
  }); } finally { await session.endSession(); }
}
export interface DraftPlan { revision: KnowledgeRevisionModel; audit: KnowledgeAuditModel }
export async function convertProposal(id: string, expectedVersion: number, targetId: string | undefined,
  plan: (p: KnowledgeProposal, sources: Awaited<ReturnType<typeof generationSource>>[], candidates: DuplicateCandidate[], questionId: string, version: number, previous?: KnowledgeQuestionModel, previousRevision?: KnowledgeRevisionModel) => DraftPlan) {
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { return await session.withTransaction(async () => {
    // Serializes generation conversions to prevent two concurrent proposals creating the same phrase.
    await db.collection<{ _id: string; version: number }>('knowledge_generation_locks').updateOne({ _id: 'draft-conversion' }, { $inc: { version: 1 } }, { upsert: true, session });
    const p = await db.collection<KnowledgeProposal>('knowledge_proposals').findOne({ _id: id, version: expectedVersion, generationStatus: 'ready_for_review' }, { session });
    if (!p) throw conflict();
    const sources = [];
    for (const sourceId of p.sourceIds) sources.push(await generationSource(sourceId, session));
    const questions = db.collection<KnowledgeQuestionModel>('knowledge_questions'), revisions = db.collection<KnowledgeRevisionModel>('knowledge_question_revisions');
    let previous: KnowledgeQuestionModel | undefined, previousRevision: KnowledgeRevisionModel | undefined, questionId: string, version: number;
    if (targetId) {
      previous = await questions.findOne({ _id: targetId, topicId: KNOWLEDGE_TOPIC }, { session }) || undefined;
      if (!previous) throw generationError('Câu hỏi đích không tồn tại.', 'NOT_FOUND', 404);
      questionId = targetId;
      previousRevision = await revisions.find({ questionId }, { session }).sort({ version: -1 }).limit(1).next() || undefined;
      if (!previousRevision) throw generationError('Câu hỏi đích không có revision để đối chiếu.', 'INVALID_REVISION_STATE', 409);
      version = previousRevision.version + 1;
    } else {
      const ids = await questions.find({ topicId: KNOWLEDGE_TOPIC }, { session, projection: { _id: 1 } }).limit(10001).toArray();
      if (ids.length > 10000) throw generationError('Kho câu hỏi vượt giới hạn cấp mã.', 'CATALOG_LIMIT', 503);
      questionId = `cmtt45-q${String(1 + Math.max(0, ...ids.map(q => Number(q._id.match(/q(\d+)$/)?.[1]) || 0))).padStart(3, '0')}`; version = 1;
    }
    const change = plan(p, sources, await generationCandidates(session), questionId, version, previous, previousRevision);
    if (previous) await questions.updateOne({ _id: questionId }, { $inc: { managementVersion: 1 }, $set: { updatedAt: change.revision.createdAt } }, { session });
    else await questions.insertOne({ _id: questionId, topicId: KNOWLEDGE_TOPIC, managementVersion: 1, createdAt: change.revision.createdAt, updatedAt: change.revision.createdAt }, { session });
    await revisions.insertOne(change.revision, { session });
    await db.collection<KnowledgeAuditModel>('knowledge_audit').insertOne(change.audit, { session });
    await db.collection<KnowledgeProposal>('knowledge_proposals').updateOne({ _id: id, version: expectedVersion }, { $set: { generationStatus: 'converted_to_draft', draftId: questionId, revisionId: change.revision._id, updatedAt: new Date() }, $inc: { version: 1 } }, { session });
    await db.collection('knowledge_generation_audit').insertOne({ _id: new ObjectId(), entityId: id, action: 'convert_to_draft', actor: change.audit.actorId, at: new Date(), auditId: change.audit._id || randomUUID() }, { session });
    return { questionId, revisionId: change.revision._id };
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 }); } finally { await session.endSession(); }
}

import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Document, Filter } from 'mongodb';
import { getDatabase, getMongoClient } from '@/lib/db/client';
import type { ChatAnalytics, ChatGroupDetail, ChatHistoryFilter, ChatInteraction, ChatQuestionGroup, ChatReview, ChatReviewAudit } from '@/server/domain/chat-history';

export const CHAT_HISTORY_COLLECTION = 'chat_interactions';
export const CHAT_REVIEW_COLLECTION = 'chat_question_reviews';
export const CHAT_REVIEW_AUDIT_COLLECTION = 'chat_review_audit';
let indexes: Promise<void> | undefined;
async function ensureIndexes() {
  if (!indexes) indexes = (async () => {
    const db = await getDatabase();
    await db.collection(CHAT_HISTORY_COLLECTION).createIndexes([
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      { key: { sessionRef: 1, createdAt: -1 } }, { key: { characterId: 1, createdAt: -1 } },
      { key: { groupId: 1, createdAt: -1 } }, { key: { outcome: 1, createdAt: -1 } },
      { key: { createdAt: -1 } },
    ]);
    await db.collection(CHAT_REVIEW_COLLECTION).createIndex({ status: 1, updatedAt: -1 });
    await db.collection(CHAT_REVIEW_AUDIT_COLLECTION).createIndex({ groupId: 1, at: -1 });
  })().catch(error => { indexes = undefined; throw error; });
  return indexes;
}
export async function readInteraction(id: string, sessionRef: string): Promise<ChatInteraction | null> {
  return (await getDatabase()).collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).findOne({ _id: id, sessionRef, expiresAt: { $gt: new Date() } }, { maxTimeMS: 1000 });
}
export async function recordInteraction(row: ChatInteraction): Promise<void> {
  await ensureIndexes();
  try { await (await getDatabase()).collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).updateOne({ _id: row._id }, { $setOnInsert: row }, { upsert: true, maxTimeMS: 1000 }); }
  catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) throw error; }
}
export async function latestOfferedInteraction(sessionRef: string, questionId: string): Promise<ChatInteraction | null> {
  return (await getDatabase()).collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).findOne({ sessionRef,
    suggestedQuestionIds: questionId, createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, expiresAt: { $gt: new Date() },
  }, { sort: { createdAt: -1 }, maxTimeMS: 1000 });
}
export async function recordSelection(id: string, sessionRef: string, questionId: string, revisionId: string, latencyMs: number): Promise<'saved' | 'conflict' | 'missing'> {
  const collection = (await getDatabase()).collection<ChatInteraction>(CHAT_HISTORY_COLLECTION);
  const row = await collection.findOneAndUpdate({ _id: id, sessionRef, suggestedQuestionIds: questionId,
    expiresAt: { $gt: new Date() }, selectedQuestionId: { $exists: false },
  }, { $set: { selectedQuestionId: questionId, answeredQuestionId: questionId, publishedVersionId: revisionId,
    selectedAt: new Date(), selectionLatencyMs: latencyMs, outcome: 'answered' } }, { returnDocument: 'after', maxTimeMS: 1000 });
  if (row) return 'saved';
  const previous = await readInteraction(id, sessionRef);
  if (!previous) return 'missing';
  return previous.selectedQuestionId === questionId && previous.publishedVersionId === revisionId && previous.suggestedQuestionIds.includes(questionId) ? 'saved' : 'conflict';
}
function historyFilter(filter: ChatHistoryFilter): Filter<ChatInteraction> {
  return { kind: 'question', createdAt: { $gte: filter.from, $lt: filter.to }, expiresAt: { $gt: new Date() },
    ...(filter.characterId ? { characterId: filter.characterId } : {}),
    ...(filter.text ? { question: { $regex: filter.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {}),
  };
}
function groupPipeline(): Document[] {
  return [
    { $sort: { createdAt: -1, _id: 1 } },
    { $group: { _id: '$groupId', question: { $first: '$question' }, characterId: { $first: '$characterId' },
      count: { $sum: 1 }, firstAt: { $min: '$createdAt' }, lastAt: { $max: '$createdAt' }, sources: { $addToSet: '$matchingSource' },
      unresolved: { $sum: { $cond: [{ $and: [{ $ne: ['$outcome', 'answered'] }, { $lt: ['$createdAt', new Date(Date.now() - 10 * 60000)] }] }, 1, 0] } },
      answered: { $sum: { $cond: [{ $eq: ['$outcome', 'answered'] }, 1, 0] } },
      suggested: { $sum: { $cond: [{ $gt: [{ $size: '$suggestedQuestionIds' }, 0] }, 1, 0] } },
      selected: { $sum: { $cond: [{ $ifNull: ['$selectedQuestionId', false] }, 1, 0] } },
    } },
    { $lookup: { from: CHAT_REVIEW_COLLECTION, localField: '_id', foreignField: '_id', as: 'reviewRows' } },
    { $set: { review: { $ifNull: [{ $arrayElemAt: ['$reviewRows', 0] }, null] } } }, { $unset: 'reviewRows' },
  ];
}
export async function queryChatGroups(filter: ChatHistoryFilter): Promise<{ items: ChatQuestionGroup[]; total: number }> {
  const rows = await (await getDatabase()).collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).aggregate<{ items: ChatQuestionGroup[]; count: { total: number }[] }>([
    { $match: historyFilter(filter) }, ...groupPipeline(),
    { $match: { $or: [{ unresolved: { $gt: 0 } }, { review: { $ne: null } }] } },
    ...(filter.minCount || filter.maxCount ? [{ $match: { count: { ...(filter.minCount ? { $gte: filter.minCount } : {}), ...(filter.maxCount ? { $lte: filter.maxCount } : {}) } } }] : []),
    ...(filter.status ? [{ $match: filter.status === 'new' ? { $or: [{ review: null }, { 'review.status': 'new' }] } : { 'review.status': filter.status } }] : []),
    { $sort: { lastAt: -1, _id: 1 } }, { $facet: { items: [{ $skip: (filter.page - 1) * filter.pageSize }, { $limit: filter.pageSize }], count: [{ $count: 'total' }] } },
  ], { maxTimeMS: 3000 }).toArray();
  return { items: rows[0]?.items || [], total: rows[0]?.count[0]?.total || 0 };
}
export async function chatAnalytics(filter: ChatHistoryFilter): Promise<ChatAnalytics> {
  const db = await getDatabase();
  const collection = db.collection<ChatInteraction>(CHAT_HISTORY_COLLECTION);
  const rows = await collection.aggregate<{ totals: ChatAnalytics['totals'][]; popular: ChatQuestionGroup[] }>([
    { $match: historyFilter(filter) }, ...groupPipeline(), { $facet: {
      totals: [{ $group: { _id: null, asks: { $sum: '$count' }, unique: { $sum: 1 }, suggestions: { $sum: '$suggested' },
        selections: { $sum: '$selected' }, answered: { $sum: '$answered' }, unresolved: { $sum: '$unresolved' },
        reviewGroups: { $sum: { $cond: [{ $and: [{ $gt: ['$unresolved', 0] }, { $not: [{ $in: [{ $ifNull: ['$review.status', 'new'] }, ['resolved', 'dismissed', 'linked_existing']] }] }] }, 1, 0] } },
      } }, { $project: { _id: 0 } }],
      popular: [{ $sort: { count: -1, _id: 1 } }, { $limit: 10 }],
    } },
  ], { maxTimeMS: 3000 }).toArray();
  const facets = await collection.aggregate<{ outcomes: { source: string; count: number }[]; days: { day: string; count: number }[] }>([
    { $match: historyFilter(filter) }, { $facet: {
      outcomes: [{ $group: { _id: '$matchingSource', count: { $sum: 1 } } }, { $project: { _id: 0, source: '$_id', count: 1 } }],
      days: [{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Bangkok' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, day: '$_id', count: 1 } }],
    } },
  ], { maxTimeMS: 3000 }).toArray();
  const totals = rows[0]?.totals[0] || { asks: 0, unique: 0, suggestions: 0, selections: 0, answered: 0, unresolved: 0, reviewGroups: 0 };
  return { totals, outcomes: facets[0]?.outcomes || [], days: facets[0]?.days || [], popular: rows[0]?.popular || [] };
}
export async function readChatGroup(id: string, page = 1, pageSize = 20): Promise<ChatGroupDetail | null> {
  const db = await getDatabase();
  const filter = { groupId: id, kind: 'question' as const, expiresAt: { $gt: new Date() } };
  const groups = await db.collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).aggregate<ChatQuestionGroup>([{ $match: filter }, ...groupPipeline()], { maxTimeMS: 3000 }).toArray();
  if (!groups[0]) return null;
  const interactions = await db.collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).find(filter, { projection: { sessionRef: 0, requestHash: 0 }, maxTimeMS: 3000 }).sort({ createdAt: -1, _id: 1 }).skip((page - 1) * pageSize).limit(pageSize).toArray();
  const audit = await db.collection<ChatReviewAudit>(CHAT_REVIEW_AUDIT_COLLECTION).find({ groupId: id }, { maxTimeMS: 3000 }).sort({ at: -1 }).limit(30).toArray();
  return { group: groups[0], interactions, audit, page, pageSize };
}
export async function updateChatReview(review: ChatReview, expectedVersion: number, actorId: string): Promise<boolean> {
  await ensureIndexes();
  const db = await getDatabase(), client = await getMongoClient(), session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const collection = db.collection<ChatReview>(CHAT_REVIEW_COLLECTION);
      const before = await collection.findOne({ _id: review._id }, { session });
      if ((before?.version || 0) !== expectedVersion) return false;
      if (before) await collection.replaceOne({ _id: review._id, version: expectedVersion }, review, { session });
      else await collection.insertOne(review, { session });
      await db.collection<ChatReviewAudit>(CHAT_REVIEW_AUDIT_COLLECTION).insertOne({ _id: randomUUID(), groupId: review._id,
        action: 'review', actorId, at: review.updatedAt, from: before?.status || 'new', to: review.status,
        version: review.version, ...(review.linkedQuestionId ? { linkedQuestionId: review.linkedQuestionId } : {}),
        ...(review.equivalentGroupId ? { equivalentGroupId: review.equivalentGroupId } : {}),
      }, { session });
      return true;
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 5000 }) ?? false;
  } catch (error) { if (error && typeof error === 'object' && 'code' in error && error.code === 11000) return false; throw error; }
  finally { await session.endSession(); }
}
export async function deleteChatGroup(id: string, actorId: string): Promise<number> {
  await ensureIndexes();
  const db = await getDatabase(), session = (await getMongoClient()).startSession();
  try { return await session.withTransaction(async () => {
    const result = await db.collection<ChatInteraction>(CHAT_HISTORY_COLLECTION).deleteMany({ groupId: id }, { session });
    await db.collection<ChatReview>(CHAT_REVIEW_COLLECTION).deleteOne({ _id: id }, { session });
    await db.collection<ChatReviewAudit>(CHAT_REVIEW_AUDIT_COLLECTION).insertOne({ _id: randomUUID(), groupId: id, action: 'delete_history', actorId, at: new Date(), deletedCount: result.deletedCount }, { session });
    return result.deletedCount;
  }, { maxCommitTimeMS: 5000 }) ?? 0; } finally { await session.endSession(); }
}

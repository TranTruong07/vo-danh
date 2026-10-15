import "server-only";
import type { Document } from "mongodb";
import { getDatabase } from "@/lib/db/client";
import { KNOWLEDGE_CHARACTERS, KNOWLEDGE_TOPIC, type KnowledgeCharacterId } from "@/server/domain/knowledge";
import type { ChatAnswerEntry, ChatIndexEntry } from "@/server/domain/chat";

const nonempty = { $type: "string", $regex: /\S/ };
export function publishedChatPipeline(questionId?: string, characterId?: KnowledgeCharacterId, revisionId?: string): Document[] {
  const approval: Document = {
    status: "approved", reviewedBy: nonempty, reviewedAt: { $type: "date" },
    canonicalQuestion: nonempty, aliases: { $type: "array" }, approvedAnswer: nonempty,
    "source.document": nonempty, "source.sectionId": nonempty, "source.excerpt": nonempty,
  };
  for (const character of KNOWLEDGE_CHARACTERS) approval[`characterAnswers.${character}`] = nonempty;
  return [
    { $match: { topicId: KNOWLEDGE_TOPIC, publishedVersionId: { $type: "string", $ne: "" }, ...(questionId ? { _id: questionId } : {}), ...(revisionId ? { publishedVersionId: revisionId } : {}) } },
    { $lookup: { from: "knowledge_question_revisions", let: { published: "$publishedVersionId", question: "$_id" }, pipeline: [
      { $match: { ...approval, $expr: { $and: [{ $eq: ["$_id", "$$published"] }, { $eq: ["$questionId", "$$question"] }] } } },
      { $project: { _id: 1, canonicalQuestion: 1, aliases: 1,
        ...(characterId ? { answer: `$characterAnswers.${characterId}`, source: { document: "$source.document", sectionId: "$source.sectionId" } } : {}) } },
    ], as: "revision" } },
    { $unwind: "$revision" },
    { $project: { _id: 0, questionId: "$_id", revisionId: "$revision._id", canonicalQuestion: "$revision.canonicalQuestion", aliases: "$revision.aliases",
      ...(characterId ? { answer: "$revision.answer", source: "$revision.source" } : {}) } },
    { $sort: { questionId: 1 } },
    { $limit: questionId ? 1 : 2001 },
  ];
}
function validIndex(row: ChatIndexEntry) {
  return typeof row.questionId === "string" && /^cmtt45-q\d{3,6}$/.test(row.questionId) && typeof row.revisionId === "string"
    && typeof row.canonicalQuestion === "string" && row.canonicalQuestion.length <= 500 && !!row.canonicalQuestion.trim()
    && Array.isArray(row.aliases) && row.aliases.length <= 5 && row.aliases.every(alias => typeof alias === "string" && !!alias.trim() && alias.length <= 500);
}
export async function readPublishedChatIndex(): Promise<ChatIndexEntry[]> {
  const rows = await (await getDatabase()).collection("knowledge_questions").aggregate<ChatIndexEntry>(publishedChatPipeline(), { maxTimeMS: 5000 }).toArray();
  // Never truncate an index silently: a duplicate alias beyond the cap could otherwise auto-answer.
  if (rows.length > 2000 || rows.some(row => !validIndex(row))) throw new Error("Invalid published chat index");
  return rows;
}
export async function readPublishedChatAnswer(questionId: string, characterId: KnowledgeCharacterId, expectedRevisionId?: string): Promise<ChatAnswerEntry | null> {
  const rows = await (await getDatabase()).collection("knowledge_questions").aggregate<ChatAnswerEntry>(publishedChatPipeline(questionId, characterId, expectedRevisionId), { maxTimeMS: 5000 }).toArray();
  const row = rows[0];
  if (!row || !validIndex(row) || typeof row.answer !== "string" || !row.answer.trim() || !row.source?.document || !row.source?.sectionId) return null;
  return row;
}

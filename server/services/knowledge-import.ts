import { createHash } from "node:crypto";
import type { KnowledgeDraft } from "@/server/domain/knowledge";
import type { KnowledgeQuestionModel, KnowledgeRevisionModel } from "@/server/models/knowledge";

export function knowledgeContent(row: Pick<KnowledgeRevisionModel, "canonicalQuestion" | "aliases" | "normalizedPhrases" | "approvedAnswer" | "characterAnswers" | "source" | "reviewNotes">) {
  // Explicit field order: immutable comparison excludes review/import timestamps and state.
  return JSON.stringify({ canonicalQuestion: row.canonicalQuestion, aliases: row.aliases, normalizedPhrases: row.normalizedPhrases,
    approvedAnswer: row.approvedAnswer, characterAnswers: ["truong-chinh", "le-duan", "pham-van-dong", "vo-nguyen-giap"].map(key => row.characterAnswers[key as keyof typeof row.characterAnswers]),
    source: [row.source.document, row.source.sectionId, row.source.sourceSha256, row.source.blockIds, row.source.excerpt, row.source.paragraphIndex, row.source.tableIndex], reviewNotes: row.reviewNotes });
}
export function planKnowledgeImport(drafts: KnowledgeDraft[], questions: KnowledgeQuestionModel[], revisions: KnowledgeRevisionModel[]) {
  const actions: { questionId: string; revisionId: string; action: "insert_draft" | "skip" | "conflict"; reason: string }[] = [];
  for (const draft of drafts) {
    const id = `${draft._id}:v${draft.version}`;
    const previous = revisions.find(row => row._id === id);
    const sameVersion = revisions.find(row => row.questionId === draft._id && row.version === draft.version);
    const logical = questions.find(row => row._id === draft._id);
    const latest = Math.max(0, ...revisions.filter(row => row.questionId === draft._id).map(row => row.version));
    let reason = "", action: "insert_draft" | "skip" | "conflict" = "insert_draft";
    if (draft.status !== "draft" || draft.reviewedBy !== undefined || draft.reviewedAt !== undefined || draft.rejectionReason !== undefined) reason = "Import chỉ nhận draft, không nhận metadata duyệt/từ chối.";
    else if (logical && logical.topicId !== draft.topicId) reason = "Không được đổi topic của ID đã tồn tại.";
    else if (sameVersion && sameVersion._id !== id) reason = "Version đã được sử dụng với revision ID khác.";
    else if (previous) {
      if (previous.questionId !== draft._id || knowledgeContent(previous) !== knowledgeContent(draft)) reason = "Revision đã tồn tại; giữ nguyên mọi trạng thái, cần version mới để thay nội dung.";
      else action = "skip";
    } else if (draft.version <= latest) reason = "Version mới phải lớn hơn mọi revision đã có.";
    if (reason) action = "conflict";
    actions.push({ questionId: draft._id, revisionId: id, action, reason: reason || (action === "skip" ? "Nội dung đã có; không đổi status hoặc publishedVersionId." : "Tạo revision draft, không publish.") });
  }
  return actions;
}
export function knowledgeBatchId(drafts: KnowledgeDraft[]) {
  return createHash("sha256").update(JSON.stringify(drafts.map(row => [row._id, row.version, knowledgeContent(row)]))).digest("hex");
}
export function draftRevision(draft: KnowledgeDraft, batchId: string, now: Date): KnowledgeRevisionModel {
  return { _id: `${draft._id}:v${draft.version}`, questionId: draft._id, version: draft.version,
    canonicalQuestion: draft.canonicalQuestion, aliases: draft.aliases, normalizedPhrases: draft.normalizedPhrases,
    approvedAnswer: draft.approvedAnswer, characterAnswers: draft.characterAnswers, source: draft.source,
    status: "draft", reviewNotes: draft.reviewNotes, createdAt: now, updatedAt: now, importBatchId: batchId };
}

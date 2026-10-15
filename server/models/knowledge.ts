import type { KnowledgeDraft, KnowledgeSource, KnowledgeStatus, KnowledgeCharacterId } from "@/server/domain/knowledge";

export interface KnowledgeQuestionModel {
  _id: string; topicId: KnowledgeDraft["topicId"]; publishedVersionId?: string;
  createdAt: Date; updatedAt: Date;
  managementVersion?: number;
}
export interface KnowledgeRevisionModel {
  _id: string; questionId: string; version: number;
  canonicalQuestion: string; aliases: string[]; normalizedPhrases: string[];
  approvedAnswer: string; characterAnswers: Record<KnowledgeCharacterId, string>;
  source: KnowledgeSource; status: KnowledgeStatus; reviewNotes: string[];
  reviewedBy?: string; reviewedAt?: Date; rejectionReason?: string;
  createdAt: Date; updatedAt: Date; importBatchId: string;
  createdBy?: string;
  basedOnRevisionId?: string;
}

export interface KnowledgeAuditModel {
  _id: string; questionId: string; revisionId: string;
  action: "create_revision" | "submit" | "approve" | "reject" | "publish" | "unpublish";
  actorId: string; actorEmail: string; createdAt: Date; reason: string;
  before: { status: KnowledgeStatus; publishedVersionId: string | null; managementVersion: number };
  after: { status: KnowledgeStatus; publishedVersionId: string | null; managementVersion: number };
  basedOnRevisionId?: string;
  changedFields: string[];
}

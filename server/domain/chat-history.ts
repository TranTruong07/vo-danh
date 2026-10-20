import type { KnowledgeCharacterId } from './knowledge';

export const CHAT_REVIEW_STATUSES = ['new', 'reviewing', 'linked_existing', 'needs_knowledge', 'dismissed', 'resolved'] as const;
export type ChatReviewStatus = typeof CHAT_REVIEW_STATUSES[number];
export type ChatMatchingSource = 'exact_match' | 'alias_match' | 'gemini_match' | 'cache_hit' | 'local_fallback' | 'clarify' | 'out_of_scope' | 'provider_unavailable' | 'quota_exceeded' | 'starter';
export interface ChatInteraction {
  _id: string; sessionRef: string; characterId: KnowledgeCharacterId;
  kind: 'question' | 'starter'; createdAt: Date; expiresAt: Date;
  question: string; redacted: boolean; groupId: string; requestHash: string;
  outcome: 'answered' | 'suggested' | 'unresolved'; matchingSource: ChatMatchingSource;
  suggestedQuestionIds: string[]; selectedQuestionId?: string; publishedVersionId?: string;
  answeredQuestionId?: string; selectedAt?: Date; selectionLatencyMs?: number;
  providerFailure?: string; providerCalls: number; cacheHit: boolean; latencyMs: number;
  reviewReason?: 'no_candidate' | 'clarify' | 'provider_unavailable' | 'out_of_scope';
  feedbackStatus: 'not_requested';
}
export interface ChatReview {
  _id: string; status: ChatReviewStatus; version: number; note: string;
  linkedQuestionId?: string; linkedRevisionId?: string; equivalentGroupId?: string;
  updatedAt: Date; updatedBy: string;
}
export interface ChatReviewAudit {
  _id: string; groupId: string; action: 'review' | 'delete_history'; actorId: string; at: Date;
  from?: ChatReviewStatus; to?: ChatReviewStatus; version?: number; linkedQuestionId?: string;
  equivalentGroupId?: string; deletedCount?: number;
}
export interface ChatHistoryFilter {
  from: Date; to: Date; characterId?: KnowledgeCharacterId; status?: ChatReviewStatus;
  page: number; pageSize: number; text: string; minCount?: number; maxCount?: number;
}
export interface ChatQuestionGroup {
  _id: string; question: string; characterId: KnowledgeCharacterId; count: number;
  unresolved: number; answered: number; suggested: number; selected: number;
  firstAt: Date; lastAt: Date; sources: ChatMatchingSource[]; review: ChatReview | null;
}
export interface ChatAnalytics {
  totals: { asks: number; unique: number; suggestions: number; selections: number; answered: number; unresolved: number; reviewGroups: number };
  outcomes: { source: string; count: number }[];
  days: { day: string; count: number }[];
  popular: ChatQuestionGroup[];
}
export interface ChatGroupDetail {
  group: ChatQuestionGroup;
  // Never send sessionRef or requestHash to the admin browser either.
  interactions: Omit<ChatInteraction, 'sessionRef' | 'requestHash'>[];
  audit: ChatReviewAudit[];
  page: number; pageSize: number;
}

// Offline knowledge contract. No runtime routes expose these drafts.
export const KNOWLEDGE_CHARACTERS = ["pham-van-dong", "hoang-quoc-viet", "truong-chinh", "vo-nguyen-giap"] as const;
// Retained for reading historical artifacts/audit, never substitute one person's answer for another.
export const LEGACY_KNOWLEDGE_CHARACTERS = ["truong-chinh", "le-duan", "pham-van-dong", "vo-nguyen-giap"] as const;
export const ALL_KNOWLEDGE_CHARACTERS = [...KNOWLEDGE_CHARACTERS, "le-duan"] as const;
export type KnowledgeCharacterId = typeof ALL_KNOWLEDGE_CHARACTERS[number];
export type KnowledgeAnswers = Partial<Record<KnowledgeCharacterId, string>>;
export function knowledgeAnswerCharacters(answers: KnowledgeAnswers) {
  return answers['hoang-quoc-viet'] !== undefined ? KNOWLEDGE_CHARACTERS : LEGACY_KNOWLEDGE_CHARACTERS;
}
export function nextKnowledgeQuestionId(identifiers: string[]): string {
  const maximum = identifiers.reduce((max, id) => Math.max(max, Number(id.match(/^cmtt45-q(\d{3,6})$/)?.[1]) || 0), 0);
  if (maximum >= 999999) throw new Error('KNOWLEDGE_ID_EXHAUSTED');
  return `cmtt45-q${String(maximum + 1).padStart(3, '0')}`;
}
export const KNOWLEDGE_TOPIC = "cach-mang-thang-tam-1945" as const;
export type KnowledgeStatus = "draft" | "pending_review" | "approved" | "rejected";
export interface ExtractionBlock {
  id: string; order: number; kind: string; sectionId: string; isHeading: boolean;
  text: string; normalizedText: string; paragraphIndex: number;
  tableIndex?: number; rowIndex?: number; cellIndex?: number;
}
export interface ExtractionManifest {
  schemaVersion: 1; document: string; sourceSha256: string; locatorConvention: string;
  sections: { sectionId: string; title: string }[]; blocks: ExtractionBlock[];
  warnings: string[]; counts: { paragraphs: number; tables: number; blocks: number };
}
export interface KnowledgeSource {
  document: string; sectionId: string; excerpt: string; sourceSha256: string; blockIds: string[];
  paragraphIndex?: number; tableIndex?: number;
}
export interface KnowledgeDraft {
  _id: string; topicId: typeof KNOWLEDGE_TOPIC; sectionId: string;
  canonicalQuestion: string; aliases: string[]; normalizedPhrases: string[];
  approvedAnswer: string; characterAnswers: KnowledgeAnswers;
  source: KnowledgeSource; status: KnowledgeStatus; version: number;
  reviewedBy?: string; reviewedAt?: string; rejectionReason?: string;
  createdAt: string; updatedAt: string; reviewNotes: string[];
}
export interface KnowledgeIssue { questionId: string; code: string; message: string }

export function normalizeKnowledgeSource(text: string): string {
  return text.normalize("NFC").replace(/\s+/gu, " ").trim();
}
// Keep accents, negation, dates and internal punctuation; trim only terminal sentence marks.
export function normalizeKnowledgePhrase(text: string): string {
  return normalizeKnowledgeSource(text).toLocaleLowerCase("vi-VN").replace(/[?!.。？！]+$/u, "").trim();
}

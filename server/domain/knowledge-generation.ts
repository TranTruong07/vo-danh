import type { ExtractionManifest, KnowledgeCharacterId } from './knowledge';

export type ProposalStatus = 'queued' | 'generating' | 'ready_for_review' | 'insufficient_evidence' | 'failed' | 'converted_to_draft' | 'discarded';
// Editorial framing only: no historical claims outside the verbatim source core.
export const PERSONA_FRAMES: Record<KnowledgeCharacterId, string[]> = {
  'truong-chinh': ['Bạn hãy chú ý điểm cốt lõi này: ', 'Ta cùng làm rõ nội dung này: '],
  'le-duan': ['Ta cùng nhìn vào nội dung tài liệu nhé: ', 'Bạn cùng tìm hiểu điểm này nhé: '],
  'pham-van-dong': ['Để bạn dễ theo dõi, tài liệu nêu: ', 'Mình cùng đọc chậm đoạn này nhé: '],
  'vo-nguyen-giap': ['Cháu cùng xem đoạn tư liệu này nhé: ', 'Bác mời cháu tìm hiểu qua tư liệu: '],
};
export interface SourceChunk {
  _id: string; sourceId: string; order: number; section: string; text: string;
  paragraphIndex: number; start: number; end: number; page?: number;
}
export interface SourceRecord {
  _id: string; title: string; originalFilename: string; fileType: 'docx' | 'pdf'; checksum: string;
  uploadedBy: string; uploadedAt: Date; extractionStatus: 'ready' | 'failed';
  chunkCount: number; sourceStatus: 'pending' | 'confirmed'; confirmedBy?: string; confirmedAt?: Date;
  storageRef: string; errors: string[]; size: number;
}
export interface Evidence { sourceId: string; chunkId: string; quote: string; start: number; end: number }
export interface ProposalContent {
  canonicalQuestion: string; aliases: string[]; neutralAnswer: string;
  characterAnswers: Record<KnowledgeCharacterId, string>; evidence: Evidence[];
  warnings: string[]; insufficientEvidence: boolean;
}
export interface Duplicate {
  kind: 'exact_duplicate' | 'possible_duplicate'; id: string; question: string; revisionId?: string;
}
export interface KnowledgeProposal {
  creationMethod?: 'manual' | 'gemini'; requestFingerprint?: string;
  relatedChatGroups?: { groupId: string; question: string }[];
  _id: string; batchId: string; origin: 'document' | 'chat_question'; sourceIds: string[];
  sourceChunkIds: string[]; originalChatGroupId?: string; originalQuestion?: string;
  content?: ProposalContent; duplicates: Duplicate[]; generationModel: string; promptVersion: string;
  generationStatus: ProposalStatus; createdBy: string; createdAt: Date; updatedAt: Date;
  version: number; notes: string; errorCode?: string; draftId?: string; revisionId?: string;
}
export function sourceManifest(source: SourceRecord, chunks: SourceChunk[]): ExtractionManifest {
  const sections = [...new Set(chunks.map(c => c.section))];
  const sectionId = (name: string) => `section-${sections.indexOf(name) + 1}`;
  return { schemaVersion: 1, document: source.originalFilename, sourceSha256: source.checksum,
    locatorConvention: 'Extracted text offsets (UTF-16). PDF page is physical, DOCX paragraph is zero-based; no DOCX page inferred.',
    sections: sections.map(title => ({ sectionId: sectionId(title), title })),
    blocks: chunks.map(c => ({ id: c._id, order: c.order, kind: 'paragraph', sectionId: sectionId(c.section),
      isHeading: false, text: c.text, normalizedText: c.text.normalize('NFC').replace(/\s+/gu, ' ').trim(), paragraphIndex: c.paragraphIndex })),
    warnings: [], counts: { paragraphs: chunks.length, tables: 0, blocks: chunks.length } };
}

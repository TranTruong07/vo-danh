import { KNOWLEDGE_CHARACTERS, type KnowledgeCharacterId, type KnowledgeDraft, type KnowledgeIssue, type KnowledgeStatus } from "./knowledge";

export class KnowledgeAdminError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
export const KNOWLEDGE_STATUS_LABELS: Record<KnowledgeStatus, string> = { draft: "Bản nháp", pending_review: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
export const KNOWLEDGE_CHARACTER_LABELS: Record<KnowledgeCharacterId, string> = { "truong-chinh": "Trường Chinh", "le-duan": "Lê Duẩn", "pham-van-dong": "Phạm Văn Đồng", "vo-nguyen-giap": "Võ Nguyên Giáp" };
export type KnowledgeOperation = "create_revision" | "submit" | "approve" | "reject" | "publish" | "unpublish";
export interface KnowledgeEdit { canonicalQuestion: string; aliases: string[]; approvedAnswer: string; characterAnswers: Record<KnowledgeCharacterId, string> }
export interface KnowledgeCommand {
  action: KnowledgeOperation; revisionId: string; expectedVersion: number; reason: string;
  acknowledged?: boolean; content?: KnowledgeEdit;
}
export interface KnowledgeRevisionView { revisionId: string; draft: KnowledgeDraft; createdBy?: string; basedOnRevisionId?: string }
export interface KnowledgeDetail {
  id: string; preview: boolean; managementVersion: number; publishedVersionId: string | null;
  selected: KnowledgeRevisionView; revisions: KnowledgeRevisionView[];
  warnings: KnowledgeIssue[]; validationErrors: KnowledgeIssue[];
  audit: { id: string; action: string; actorId: string; actorEmail: string; at: string; revisionId: string; reason: string; from: string | null; to: string | null; changedFields: string[] }[];
}
export interface KnowledgeListItem { id: string; question: string; aliases: string[]; section: string; status: KnowledgeStatus; version: number; publishedVersionId: string | null }
export interface KnowledgeList { preview: boolean; items: KnowledgeListItem[] }
export const assertKnowledgeId = (id: string) => { if (!/^cmtt45-q\d{3,6}$/.test(id)) throw new KnowledgeAdminError("INVALID_ID", "Mã câu hỏi không hợp lệ."); };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number) => typeof v === "string" && !!v.trim() && v.length <= max;
export function parseKnowledgeCommand(input: unknown, questionId: string): KnowledgeCommand {
  assertKnowledgeId(questionId);
  const fail = () => { throw new KnowledgeAdminError("INVALID_INPUT", "Thông tin thao tác không hợp lệ. Hãy kiểm tra nội dung và tải lại trang nếu cần."); };
  if (!object(input)) return fail();
  if (Object.keys(input).some(k => !["action", "revisionId", "expectedVersion", "reason", "acknowledged", "content"].includes(k))) return fail();
  if (!["create_revision", "submit", "approve", "reject", "publish", "unpublish"].includes(String(input.action))) return fail();
  if (typeof input.revisionId !== "string" || !new RegExp(`^${questionId}:v[1-9]\\d*$`).test(input.revisionId)) return fail();
  if (!Number.isSafeInteger(input.expectedVersion) || Number(input.expectedVersion) < 0 || !text(input.reason, 2000)) return fail();
  if (input.acknowledged !== undefined && typeof input.acknowledged !== "boolean") return fail();
  if (input.action === "approve" && input.acknowledged !== true) throw new KnowledgeAdminError("REVIEW_REQUIRED", "Cần xác nhận đã đọc nguồn, aliases, đáp án trung tính, bốn lời đáp và các cảnh báo.");
  if (input.action === "create_revision") {
    const c = input.content;
    if (!object(c) || Object.keys(c).length !== 4 || Object.keys(c).some(k => !["canonicalQuestion", "aliases", "approvedAnswer", "characterAnswers"].includes(k))) return fail();
    if (!text(c.canonicalQuestion, 500) || !text(c.approvedAnswer, 12000) || !Array.isArray(c.aliases) || c.aliases.length < 2 || c.aliases.length > 5 || !c.aliases.every(a => text(a, 500))) return fail();
    if (!object(c.characterAnswers) || Object.keys(c.characterAnswers).length !== 4 || !KNOWLEDGE_CHARACTERS.every(k => object(c.characterAnswers) && text(c.characterAnswers[k], 12000))) return fail();
  } else if (input.content !== undefined) return fail();
  return input as unknown as KnowledgeCommand;
}

import "server-only";
import { randomUUID } from "node:crypto";
import { currentAccount } from "./account-session";
import { validateKnowledge } from "./knowledge-validation";
import { KNOWLEDGE_TOPIC, normalizeKnowledgePhrase, type ExtractionManifest, type KnowledgeDraft } from "@/server/domain/knowledge";
import { assertKnowledgeId, KnowledgeAdminError, parseKnowledgeCommand, type KnowledgeCommand, type KnowledgeDetail, type KnowledgeList, type KnowledgeRevisionView } from "@/server/domain/knowledge-admin";
import type { KnowledgeRevisionModel } from "@/server/models/knowledge";
import { listKnowledgeRecords, readKnowledgeAudit, readKnowledgeState, mutateKnowledge, type KnowledgeState, type KnowledgeMutation } from "@/server/repositories/knowledge-admin";
import { readKnowledgeManifest, readKnowledgePreview } from "@/server/repositories/knowledge-source";

interface Actor { userId: string; email: string }
export async function requireKnowledgeAdmin(): Promise<Actor> {
  const account = await currentAccount();
  if (!account) throw new KnowledgeAdminError("UNAUTHENTICATED", "Vui lòng đăng nhập tài khoản quản trị.", 401);
  if (account.role !== "admin") throw new KnowledgeAdminError("FORBIDDEN", "Chỉ quản trị viên được quản lý kiến thức.", 403);
  return { userId: account.userId, email: account.email };
}
export function revisionDraft(row: KnowledgeRevisionModel): KnowledgeDraft {
  return { _id: row.questionId, topicId: KNOWLEDGE_TOPIC, sectionId: row.source.sectionId,
    canonicalQuestion: row.canonicalQuestion, aliases: row.aliases, normalizedPhrases: row.normalizedPhrases,
    approvedAnswer: row.approvedAnswer, characterAnswers: row.characterAnswers, source: row.source,
    status: row.status, version: row.version, reviewNotes: row.reviewNotes,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    ...(row.reviewedBy ? { reviewedBy: row.reviewedBy } : {}), ...(row.reviewedAt ? { reviewedAt: row.reviewedAt.toISOString() } : {}),
    ...(row.rejectionReason ? { rejectionReason: row.rejectionReason } : {}),
  };
}
const view = (row: KnowledgeRevisionModel): KnowledgeRevisionView => ({ revisionId: row._id, draft: revisionDraft(row), createdBy: row.createdBy, basedOnRevisionId: row.basedOnRevisionId });
async function previewPack() {
  const manifest = await readKnowledgeManifest();
  const result = validateKnowledge(await readKnowledgePreview(), manifest);
  if (result.errors.length || result.records.length !== 40 || result.records.some(r => r.version !== 3 || r.status !== "draft" || r.reviewedAt || r.reviewedBy)) throw new KnowledgeAdminError("INVALID_PREVIEW", "Bộ xem trước phải gồm 40 bản nháp revision 3 hợp lệ, chưa duyệt.", 503);
  return { ...result, manifest };
}
export async function adminKnowledgeList(preview = false): Promise<KnowledgeList> {
  await requireKnowledgeAdmin();
  const rows = preview ? [] : await listKnowledgeRecords();
  if (rows.length > 2000) throw new KnowledgeAdminError("TOO_MANY_RECORDS", "Kho kiến thức vượt giới hạn danh sách quản trị.", 503);
  if (preview || !rows.length) {
    const pack = await previewPack();
    return { preview: true, items: pack.records.map(r => ({ id: r._id, question: r.canonicalQuestion, aliases: r.aliases, section: r.sectionId, status: r.status, version: r.version, publishedVersionId: null })) };
  }
  return { preview: false, items: rows.map(r => ({ id: r._id, question: r.latest.canonicalQuestion, aliases: r.latest.aliases, section: r.latest.source.sectionId, status: r.latest.status, version: r.latest.version, publishedVersionId: r.publishedVersionId ?? null })) };
}
export async function adminKnowledgeDetail(id: string, selectedId?: string, preview = false): Promise<KnowledgeDetail> {
  await requireKnowledgeAdmin(); assertKnowledgeId(id);
  if (preview) {
    const pack = await previewPack(), draft = pack.records.find(r => r._id === id);
    if (!draft) throw new KnowledgeAdminError("NOT_FOUND", "Không tìm thấy bản nháp.", 404);
    const selected = { revisionId: `${id}:v${draft.version}`, draft };
    return { id, preview: true, managementVersion: 0, publishedVersionId: null, selected, revisions: [selected], audit: [], warnings: pack.warnings.filter(w => w.questionId.split(", ").includes(id)), validationErrors: [] };
  }
  const [{ question, revisions }, audit, manifest, catalog] = await Promise.all([readKnowledgeState(id), readKnowledgeAudit(id), readKnowledgeManifest().catch(error => {
    if (error instanceof KnowledgeAdminError && error.code === "SOURCE_UNAVAILABLE") return undefined;
    throw error;
  }), listKnowledgeRecords()]);
  const row = selectedId ? revisions.find(r => r._id === selectedId) : revisions[0];
  if (!row) throw new KnowledgeAdminError("NOT_FOUND", "Không tìm thấy revision.", 404);
  const selected = view(row);
  const check = manifest ? validateKnowledge([selected.draft], manifest, catalog.map(r => revisionDraft(r.latest))) : { warnings: [], errors: [{ questionId: id, code: "SOURCE_UNAVAILABLE", message: "Chưa đối chiếu được tài liệu nguồn trên server. Tạm khóa duyệt/công bố; vẫn có thể từ chối hoặc gỡ công bố." }] };
  return { id, preview: false, managementVersion: question.managementVersion ?? 0, publishedVersionId: question.publishedVersionId ?? null,
    selected, revisions: revisions.map(view), warnings: check.warnings, validationErrors: check.errors,
    audit: audit.map(a => ({ id: a._id, action: a.action, actorId: a.actorId, actorEmail: a.actorEmail, at: a.createdAt.toISOString(), revisionId: a.revisionId, reason: a.reason, from: a.before.publishedVersionId, to: a.after.publishedVersionId, changedFields: a.changedFields })),
  };
}
function validRevision(row: KnowledgeRevisionModel, manifest: ExtractionManifest | undefined) {
  if (!manifest) throw new KnowledgeAdminError("SOURCE_UNAVAILABLE", "Cần tài liệu nguồn hợp lệ để duyệt hoặc công bố.", 503);
  const check = validateKnowledge([revisionDraft(row)], manifest);
  if (check.errors.length) throw new KnowledgeAdminError("INVALID_CONTENT", `Chưa thể duyệt/công bố: ${check.errors.map(e => e.message).join(" ")}`);
}
// Pure state transition planner: no authentication bypass endpoint exposes this function.
export function planKnowledgeMutation(state: KnowledgeState, command: KnowledgeCommand, actor: Actor, manifest: ExtractionManifest | undefined, now = new Date()): KnowledgeMutation {
  const { question, revisions } = state;
  const row = revisions.find(r => r._id === command.revisionId && r.questionId === question._id);
  if (!row) throw new KnowledgeAdminError("NOT_FOUND", "Không tìm thấy revision đã chọn.", 404);
  const reject = (message: string) => { throw new KnowledgeAdminError("INVALID_TRANSITION", message, 409); };
  let insert: KnowledgeRevisionModel | undefined, review: KnowledgeMutation["review"], publication: string | null | undefined;
  if (command.action === "create_revision") {
    if (!command.content) throw new KnowledgeAdminError("INVALID_INPUT", "Thiếu nội dung bản nháp.");
    const version = Math.max(...revisions.map(r => r.version)) + 1;
    if (!Number.isSafeInteger(version)) throw new KnowledgeAdminError("INVALID_VERSION", "Không thể cấp revision mới.");
    insert = { _id: `${question._id}:v${version}`, questionId: question._id, version,
      ...command.content, normalizedPhrases: [...new Set([command.content.canonicalQuestion, ...command.content.aliases].map(normalizeKnowledgePhrase))],
      source: row.source, reviewNotes: [...row.reviewNotes, command.reason], status: "draft", createdAt: now, updatedAt: now,
      importBatchId: row.importBatchId, createdBy: actor.userId, basedOnRevisionId: row._id };
    validRevision(insert, manifest);
  } else if (command.action === "publish") {
    if (row.status !== "approved" || !row.reviewedBy || !row.reviewedAt) reject("Chỉ được công bố revision đã duyệt và có người duyệt thực tế.");
    validRevision(row, manifest);
    if (question.publishedVersionId === row._id) reject("Revision này đang được công bố.");
    publication = row._id;
  } else if (command.action === "unpublish") {
    if (question.publishedVersionId !== row._id) reject("Chỉ gỡ revision hiện đang được công bố. Hãy tải lại trang.");
    publication = null;
  } else {
    if (!["draft", "pending_review"].includes(row.status)) reject("Revision đã duyệt hoặc từ chối được giữ nguyên. Hãy tạo revision mới nếu cần sửa.");
    if (command.action === "submit" && row.status !== "draft") reject("Chỉ bản nháp mới được gửi duyệt.");
    if (command.action === "approve" && command.acknowledged !== true) throw new KnowledgeAdminError("REVIEW_REQUIRED", "Cần xác nhận đã rà soát đầy đủ nội dung.");
    if (command.action !== "reject") validRevision(row, manifest);
    review = { revisionId: row._id, previousStatus: row.status, status: command.action === "submit" ? "pending_review" : command.action === "approve" ? "approved" : "rejected",
      ...(command.action !== "submit" ? { reviewedBy: actor.userId, reviewedAt: now } : {}),
      ...(command.action === "reject" ? { rejectionReason: command.reason } : {}) };
  }
  const changedFields = insert ? ["canonicalQuestion", "aliases", "approvedAnswer", "characterAnswers"].filter(key => JSON.stringify(row[key as keyof KnowledgeRevisionModel]) !== JSON.stringify(insert![key as keyof KnowledgeRevisionModel])) : [];
  if (insert && !changedFields.length) reject("Nội dung chưa thay đổi; không cần tạo revision mới.");
  const managementVersion = question.managementVersion ?? 0;
  return { insert, review, publication, audit: { _id: randomUUID(), questionId: question._id, revisionId: insert?._id ?? row._id,
    action: command.action, actorId: actor.userId, actorEmail: actor.email, reason: command.reason, createdAt: now,
    before: { status: row.status, publishedVersionId: question.publishedVersionId ?? null, managementVersion },
    after: { status: insert?.status ?? review?.status ?? row.status, publishedVersionId: publication === undefined ? question.publishedVersionId ?? null : publication, managementVersion: managementVersion + 1 },
    ...(insert ? { basedOnRevisionId: row._id } : {}), changedFields,
  } };
}
export async function adminKnowledgeMutation(id: string, input: unknown) {
  const actor = await requireKnowledgeAdmin();
  const command = parseKnowledgeCommand(input, id);
  const manifest = ["reject", "unpublish"].includes(command.action) ? undefined : await readKnowledgeManifest();
  return mutateKnowledge(id, command.expectedVersion, state => planKnowledgeMutation(state, command, actor, manifest));
}

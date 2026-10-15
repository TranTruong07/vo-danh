import {
  KNOWLEDGE_CHARACTERS, KNOWLEDGE_TOPIC, normalizeKnowledgePhrase, normalizeKnowledgeSource,
  type ExtractionManifest, type KnowledgeDraft, type KnowledgeIssue,
} from "@/server/domain/knowledge";

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = 12000): value is string => typeof value === "string" && !!value.trim() && value.length <= max;
const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const fields = new Set(["_id", "topicId", "sectionId", "canonicalQuestion", "aliases", "normalizedPhrases", "approvedAnswer", "characterAnswers", "source", "status", "version", "reviewedBy", "reviewedAt", "rejectionReason", "createdAt", "updatedAt", "reviewNotes"]);

export function validateKnowledge(input: unknown, manifest: ExtractionManifest, existing: KnowledgeDraft[] = []) {
  const errors: KnowledgeIssue[] = [], warnings: KnowledgeIssue[] = [], records: KnowledgeDraft[] = [];
  const issue = (target: KnowledgeIssue[], questionId: string, code: string, message: string) => target.push({ questionId, code, message });
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.blocks) || !/^[a-f0-9]{64}$/.test(manifest.sourceSha256)) {
    issue(errors, "manifest", "MANIFEST", "Manifest không hợp lệ."); return { records, errors, warnings };
  }
  if (!Array.isArray(input) || !input.length || input.length > 2000) {
    issue(errors, "file", "ARRAY", "Cần danh sách từ 1 đến 2000 câu hỏi."); return { records, errors, warnings };
  }
  const ids = new Set<string>(), blocks = new Map(manifest.blocks.map(block => [block.id, block]));
  for (const [index, row] of input.entries()) {
    const id = object(row) && typeof row._id === "string" ? row._id : `row-${index + 1}`;
    const before = errors.length;
    const fail = (code: string, message: string) => issue(errors, id, code, message);
    if (!object(row)) { fail("OBJECT", "Câu hỏi phải là object."); continue; }
    if (Object.keys(row).some(key => !fields.has(key))) fail("FIELDS", "Có trường ngoài schema; không được cung cấp publishedVersionId hay metadata import.");
    if (!/^cmtt45-q\d{3,6}$/.test(id)) fail("ID", "ID ổn định phải theo dạng cmtt45-q001, không chứa version.");
    if (ids.has(id)) fail("DUPLICATE_ID", "ID câu hỏi bị lặp trong file."); ids.add(id);
    if (row.topicId !== KNOWLEDGE_TOPIC) fail("TOPIC", "Sai topic.");
    if (!text(row.sectionId, 30) || !manifest.blocks.some(block => block.sectionId === row.sectionId)) fail("SECTION", "Mục không có trong tài liệu.");
    if (!text(row.canonicalQuestion, 500)) fail("QUESTION", "Câu hỏi phải có 1–500 ký tự.");
    const aliases = row.aliases;
    if (!Array.isArray(aliases) || aliases.length < 2 || aliases.length > 5 || !aliases.every(alias => text(alias, 500))) fail("ALIASES", "Cần 2–5 aliases không rỗng, tối đa 500 ký tự mỗi alias.");
    if (!text(row.approvedAnswer)) fail("ANSWER", "Thiếu đáp án trung tính (tên trường không phải trạng thái phê duyệt).");
    if (!object(row.characterAnswers) || Object.keys(row.characterAnswers).length !== 4 || !KNOWLEDGE_CHARACTERS.every(character => object(row.characterAnswers) && text(row.characterAnswers[character]))) fail("CHARACTERS", "Phải có đủ đúng bốn lời đáp nhân vật.");
    if (!["draft", "pending_review", "approved", "rejected"].includes(String(row.status))) fail("STATUS", "Trạng thái không hợp lệ.");
    if (!Number.isSafeInteger(row.version) || Number(row.version) < 1) fail("VERSION", "Version phải là số nguyên dương.");
    if (!date(row.createdAt) || !date(row.updatedAt) || Date.parse(String(row.updatedAt)) < Date.parse(String(row.createdAt))) fail("DATES", "Ngày tạo/cập nhật không hợp lệ.");
    if (!Array.isArray(row.reviewNotes) || !row.reviewNotes.every(note => text(note, 2000))) fail("NOTES", "reviewNotes phải là danh sách ghi chú.");
    if (row.status === "approved" && (!text(row.reviewedBy, 200) || !date(row.reviewedAt))) fail("REVIEWER", "Approved phải có reviewer và thời gian duyệt; validator không cấp quyền duyệt.");
    if (row.status === "rejected" && !text(row.rejectionReason, 2000)) fail("REJECTION", "Rejected phải có lý do.");
    const source = row.source;
    if (!object(source)) fail("SOURCE", "Thiếu nguồn.");
    else {
      if (Object.keys(source).some(key => !["document", "sectionId", "excerpt", "sourceSha256", "blockIds", "paragraphIndex", "tableIndex"].includes(key))) fail("SOURCE_FIELDS", "Nguồn có trường ngoài schema.");
      if (source.document !== manifest.document || source.sourceSha256 !== manifest.sourceSha256) fail("SOURCE_HASH", "Nguồn không khớp phiên bản DOCX.");
      if (source.sectionId !== row.sectionId) fail("SOURCE_SECTION", "Mục nguồn không khớp câu hỏi.");
      const refs = source.blockIds;
      if (!Array.isArray(refs) || !refs.length || !refs.every(ref => typeof ref === "string" && blocks.has(ref)) || new Set(refs).size !== refs.length) fail("SOURCE_LOCATOR", "blockIds phải tồn tại, không lặp.");
      else {
        const selected = refs.map(ref => blocks.get(ref)!);
        if (selected[0].sectionId !== source.sectionId || selected.some((block, i) => i > 0 && block.order <= selected[i - 1].order)) fail("SOURCE_ORDER", "Nguồn phải theo thứ tự tài liệu và bắt đầu tại mục đã khai báo.");
        if (source.paragraphIndex !== undefined && source.paragraphIndex !== selected[0].paragraphIndex) fail("SOURCE_PARAGRAPH", "paragraphIndex không khớp nguồn.");
        if (source.tableIndex !== undefined && !selected.some(block => block.tableIndex === source.tableIndex)) fail("SOURCE_TABLE", "tableIndex không khớp nguồn.");
        const extracted = normalizeKnowledgeSource(selected.map(block => block.text).join("\n"));
        if (!text(source.excerpt, 20000) || !extracted.includes(normalizeKnowledgeSource(source.excerpt))) fail("SOURCE_EXCERPT", "Trích dẫn không xuất hiện trong các block nguồn đã chỉ định.");
      }
    }
    if (text(row.canonicalQuestion, 500) && Array.isArray(aliases) && aliases.every(alias => typeof alias === "string")) {
      const phrases = [...new Set([row.canonicalQuestion, ...aliases].map(normalizeKnowledgePhrase))];
      if (!phrases.every(Boolean) || JSON.stringify(row.normalizedPhrases) !== JSON.stringify(phrases)) fail("NORMALIZED", "normalizedPhrases không đúng canonicalQuestion + aliases.");
      if (phrases.length !== aliases.length + 1) issue(warnings, id, "LOCAL_ALIAS", "Alias lặp sau chuẩn hóa; cần biên tập.");
    }
    const historicalText = `${row.canonicalQuestion} ${row.approvedAnswer} ${JSON.stringify(row.characterAnswers)}`;
    if (/Lê Duẩn/u.test(historicalText)) issue(warnings, id, "LE_DUAN", "Đối chiếu V.2, bảng V.5, đính chính sau bảng và IX.4; không suy diễn trực tiếp chỉ huy Sài Gòn tháng 8/1945.");
    if (/Quân lệnh số 1/u.test(historicalText)) issue(warnings, id, "QUAN_LENH", "Phân biệt ban bố đêm 13/8 và Võ Nguyên Giáp đọc ngày 16/8 tại Tân Trào.");
    if (/(19|23|25)\/8|2\/9/u.test(historicalText)) issue(warnings, id, "DATES_REVIEW", "Đối chiếu riêng Hà Nội, Huế, Sài Gòn và Tuyên ngôn Độc lập; không gộp các sự kiện.");
    if (/chủ quan|khách quan/u.test(historicalText)) issue(warnings, id, "CAUSES", "Duyệt nghĩa aliases, phân biệt nguyên nhân chủ quan và khách quan.");
    if (errors.length === before) records.push(row as unknown as KnowledgeDraft);
  }
  const owners = new Map<string, Set<string>>();
  for (const row of [...existing.filter(row => !ids.has(row._id)), ...records]) {
    for (const phrase of [row.canonicalQuestion, ...row.aliases].map(normalizeKnowledgePhrase)) {
      const set = owners.get(phrase) ?? new Set<string>(); set.add(row._id); owners.set(phrase, set);
    }
  }
  for (const set of owners.values()) if (set.size > 1) issue(warnings, [...set].join(", "), "ALIAS_COLLISION", "Cùng một câu/alias khớp nhiều ID; chỉ được gợi ý, không tự trả lời. Cần người duyệt kiểm tra nghĩa.");
  return { records, errors, warnings };
}

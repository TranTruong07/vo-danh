import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import type { ExtractionManifest, KnowledgeDraft, KnowledgeIssue } from "@/server/domain/knowledge";

export function options(extra: Record<string, { type: "boolean" | "string" }> = {}): Record<string, string | boolean | undefined> {
  return parseArgs({ options: { source: { type: "string", default: "docs/source/Tong-hop-kien-thuc.docx" }, manifest: { type: "string", default: "knowledge/extraction-manifest.json" }, file: { type: "string", default: "knowledge/draft-questions.json" }, ...extra }, strict: true }).values;
}
export function readJson(path: string): unknown { return JSON.parse(readFileSync(path, "utf8")); }
export function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}
export function checkedManifest(source: string, path: string): ExtractionManifest {
  const local = process.platform === "win32" ? ".local/knowledge-venv/Scripts/python.exe" : ".local/knowledge-venv/bin/python";
  const python = process.env.KNOWLEDGE_PYTHON || (existsSync(local) ? local : "python");
  const result = spawnSync(python, ["-X", "utf8", "scripts/extract-knowledge.py", "--source", source, "--out", path, "--check"], { encoding: "utf8", timeout: 30000, windowsHide: true });
  if (result.status !== 0) throw new Error("Không xác minh được manifest với DOCX gốc. Chạy knowledge:extract và kiểm tra môi trường Python.");
  return readJson(path) as ExtractionManifest;
}
const safe = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function reviewReport(records: KnowledgeDraft[], errors: KnowledgeIssue[], warnings: KnowledgeIssue[], manifest?: ExtractionManifest): string {
  const lines = ["# Báo cáo kiểm tra dữ liệu chatbot", "", `Tổng: ${records.length} bản hợp lệ về cấu trúc; ${errors.length} lỗi; ${warnings.length} cảnh báo.`, "", "Tất cả lời đáp là mô phỏng giáo dục, không phải phát ngôn nguyên văn của nhân vật. Đây là dữ liệu CHƯA ĐƯỢC DUYỆT. Trường approvedAnswer chỉ là tên schema. Không có dữ liệu nào được approve/publish bằng validator.", "", "Máy chỉ kiểm tra cấu trúc, nguồn và một số dấu hiệu cần xem xét; không xác minh toàn bộ sự thật lịch sử hoặc nghĩa tương đương của alias. Người quản trị phải đọc toàn bộ từng mục.", "", "## Lỗi và cảnh báo", "", ...[...errors, ...warnings].map(issue => `- ${safe(issue.questionId)} — ${issue.code}: ${safe(issue.message)}`)];
  if (manifest) {
    lines.push("", "## Đối chiếu mâu thuẫn hoặc điểm dễ hiểu nhầm trong nguồn", "", "Giữ nguyên các đoạn dưới đây từ tài liệu; cần người quản trị đọc mô tả ở V.2/bảng V.5 cùng đính chính sau bảng và IX.4. Công cụ không dùng nguồn ngoài để sửa nội dung, không coi việc trích đúng chữ là xác nhận lịch sử.");
    const sensitive = manifest.blocks.filter(block => !block.isHeading && (block.sectionId === "V.2" || block.sectionId === "IX.4" || block.text.startsWith("Đính chính quan trọng") || (block.tableIndex === 0 && block.rowIndex === 2)));
    for (const block of sensitive) lines.push("", `**${block.sectionId} — ${block.id}:**`, "", safe(block.text));
    lines.push("", "Lời đáp nhân vật là đề xuất biên tập cho mô phỏng giáo dục. Phong cách hội thoại không phải kết luận về cách nói có thật của nhân vật. Người quản trị cần đối chiếu từng mệnh đề với nguồn và duyệt riêng cả bốn phiên bản.");
  }
  for (const row of records) {
    lines.push("", `## ${row._id} — revision ${row.version} — ${row.status}`, "", `**Câu hỏi:** ${safe(row.canonicalQuestion)}`, "", "**Aliases:**", "", ...row.aliases.map(alias => `- ${safe(alias)}`), "", "**Đáp án trung tính:**", "", safe(row.approvedAnswer));
    for (const [character, answer] of Object.entries(row.characterAnswers)) lines.push("", `**${character}:**`, "", safe(answer));
    lines.push("", `**Nguồn:** ${safe(row.source.document)} — ${row.source.sectionId} — ${row.source.blockIds.join(", ")}`, "", safe(row.source.excerpt), "", ...row.reviewNotes.map(note => `- Ghi chú: ${safe(note)}`), "", "- [ ] Đối chiếu tài liệu và các đính chính liên quan", "- [ ] Duyệt câu hỏi và ý nghĩa từng alias", "- [ ] Duyệt đáp án trung tính và cả bốn lời đáp", "- [ ] Xác nhận người duyệt và thời gian qua quy trình quản trị (chưa có ở Phase 1)");
  }
  return lines.join("\n") + "\n";
}

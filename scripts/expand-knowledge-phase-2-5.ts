import { existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { checkedManifest, readJson, reviewReport } from "./knowledge/common";
import { buildPhase25Drafts } from "./knowledge/phase-2-5";
import { validateKnowledge } from "../server/services/knowledge-validation";
import type { KnowledgeDraft } from "../server/domain/knowledge";

// No database imports, environment loading, network or app-runtime changes.
const file = "knowledge/draft-questions-phase-2-v4.json";
const report = "knowledge/review-report-phase-2-v4.md";
const changesFile = "knowledge/phase-2-5-changes.json";
try {
  for (const path of [file, report, changesFile]) if (existsSync(path)) throw new Error(`Refusing to overwrite ${path}`);
  const manifest = checkedManifest("docs/source/Tong-hop-kien-thuc.docx", "knowledge/extraction-manifest.json");
  const baseline = readJson("knowledge/draft-questions-phase-2-v3.json") as KnowledgeDraft[];
  const { drafts, changes } = buildPhase25Drafts(baseline, manifest, new Date().toISOString());
  const checked = validateKnowledge(drafts, manifest);
  if (checked.errors.length) throw new Error(JSON.stringify(checked.errors));
  const oldWarnings = validateKnowledge(baseline, manifest).warnings;
  const warningRows = oldWarnings.map(w => `| ${w.questionId} | ${w.code} | Đã đối chiếu lại locator của câu và đính chính liên quan; chưa được người quản trị xác nhận | Cần duyệt |`);
  const preface = [
    "# Phase 2.5 — Phiếu rà soát bản nháp v4", "",
    `Snapshot ${drafts.length} logical questions; ${changes.length} revision mới: 19 câu mới v1, 9 sửa nội dung v4, 9 chỉ thêm aliases v4; 22 bản v3 giữ nguyên. Tên file v4 là phiên bản bộ dữ liệu, không phải mọi record đều version=4.`, "",
    "## N17 / N18: quyết định biên tập có giới hạn", "",
    "N17 (q057): đọc body/87 và bảng V.5 cùng body/90, body/111, body/167. Có thể mô tả quá trình xây dựng cơ sở/tổ chức/vận động, nhưng phải giữ mốc bị bắt 1940, Côn Đảo, trở về sau thắng lợi. Nguồn không phân ngày/chức trách cụ thể cho từng hoạt động. Draft nêu rõ giới hạn đó, không khẳng định Lê Duẩn chỉ đạo khởi nghĩa tháng 8.", "",
    "N18 (q058): body/86,88,89 mô tả phong trào và sức mạnh tập thể Nam Bộ; body/90, bảng V.5, body/111 và IX.4 ngăn quy thắng lợi cho riêng Lê Duẩn. Không suy diễn thêm địa phương, tổ chức hoặc người chỉ huy cụ thể. Hai câu đủ căn cứ để đề xuất trong phạm vi giới hạn này; cần duyệt đặc biệt, chưa giải quyết dứt điểm cảnh báo lịch sử.", "",
    "Không có câu đề xuất bị chặn hoàn toàn vì thiếu nguồn sau khi giới hạn phạm vi. Không có căn cứ cho các mở rộng như ngày về đất liền chính xác, năm bắt đầu hoạt động Phạm Văn Đồng hoặc tên các tỉnh 14–18/8; không tạo đáp án cho chúng.", "",
    "## Đối chiếu đủ 18 cảnh báo cũ — không tự đóng", "",
    "| Câu | Nhóm | Kết quả | Trạng thái |", "| --- | --- | --- | --- |", ...warningRows, "",
    "DATES_REVIEW: body/17 phân biệt tuyên bố đầu hàng 15/8 và ký văn kiện 2/9; body/62–66 tách Hà Nội 19/8, Huế 23/8, Sài Gòn 25/8 và Tuyên ngôn 2/9. Không dùng tên nhóm cảnh báo chung thay việc đọc đúng từng sự kiện.", "",
    "QUAN_LENH: body/57 là ban bố đêm 13/8; body/105 là Võ Nguyên Giáp thay mặt Ủy ban Quân sự cách mạng đọc ngày 16/8 tại Tân Trào và tiến về Thái Nguyên. R04/R06 giữ đúng chủ thể và hành động, không đồng nhất hai mốc.", "",
    "LE_DUAN: body/111 và IX.4 là đính chính bắt buộc. CAUSES: body/135–144 tách chủ quan/khách quan; body/146–148 nêu quan hệ, cơ hội không tự tạo thắng lợi. R09 khôi phục đúng đường lối và quyết định kịp thời, không quy công riêng một cá nhân.", "",
    `Validator hiện có báo ${checked.warnings.length} cảnh báo; các cảnh báo tăng do nội dung mới/khôi phục, không có nghĩa 18 cảnh báo cũ đã được đóng. Xem danh sách đầy đủ dưới đây.`, "",
    "## Danh sách revision thay đổi", "", "| ID | Đề xuất | Loại | Revision |", "| --- | --- | --- | --- |",
    ...changes.map(c => `| ${c.questionId} | ${c.proposalId} | ${c.kind} | ${c.previousVersion ?? "mới"} → ${c.version} |`), "",
    "Dữ liệu vẫn draft, không reviewer giả, không import, approve hoặc publish. `approvedAnswer` chỉ là tên trường schema. Checklist review bên dưới là hướng dẫn đọc; quyền duyệt phải thực hiện qua workflow admin hiện có.", "",
  ].join("\n");
  const serialize = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
  writeFileSync(file, serialize(drafts), { encoding: "utf8", flag: "wx" });
  writeFileSync(report, preface + reviewReport(checked.records, checked.errors, checked.warnings, manifest), { encoding: "utf8", flag: "wx" });
  writeFileSync(changesFile, serialize({
    artifactType: "offline_editorial_change_manifest", humanReviewRequired: true, doNotImportAsKnowledge: true,
    baselineSha256: createHash("sha256").update(readFileSync("knowledge/draft-questions-phase-2-v3.json")).digest("hex"),
    changes, unchangedIds: drafts.filter(q => q.version === 3).map(q => q._id),
    warnings: checked.warnings, inheritedWarnings: oldWarnings.map(w => ({ ...w, status: "needs_admin_review", resolved: false })),
    sourceReconciliation: [{ proposalId: "N17", decision: "bounded_draft_requires_review", resolved: false }, { proposalId: "N18", decision: "bounded_draft_requires_review", resolved: false }],
  }), { encoding: "utf8", flag: "wx" });
  console.log(JSON.stringify({ logicalQuestions: drafts.length, newRevisions: changes.length, errors: checked.errors.length, warnings: checked.warnings.length, dbWrites: 0 }));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Phase 2.5 failed.");
  process.exitCode = 1;
}

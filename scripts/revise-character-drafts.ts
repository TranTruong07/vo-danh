import { existsSync } from "node:fs";
import { checkedManifest, options, readJson, writeJson } from "./knowledge/common";
import { proposeCharacterDialogue } from "./knowledge/character-dialogue";
import { SOURCE_SHA256 } from "./knowledge/draft-outline";
import { validateKnowledge } from "@/server/services/knowledge-validation";

try {
  const args = options({ out: { type: "string" } });
  const out = String(args.out || "knowledge/draft-questions-phase-2.json");
  if (existsSync(out)) throw new Error("File đích đã tồn tại; chọn --out mới để giữ nguyên lịch sử biên tập.");
  const manifest = checkedManifest(String(args.source), String(args.manifest));
  if (manifest.sourceSha256 !== SOURCE_SHA256) throw new Error("Nguồn đã đổi; cần đối chiếu lại đề xuất lời thoại trước khi biên tập.");
  const input = validateKnowledge(readJson(String(args.file)), manifest);
  if (input.errors.length || !input.records.length) throw new Error("Dữ liệu đầu vào chưa hợp lệ.");
  if (input.records.some(row => row.status !== "draft" || row.reviewedAt || row.reviewedBy)) throw new Error("Chỉ biên tập bản draft chưa được duyệt.");
  const now = new Date().toISOString();
  const records = input.records.map(row => ({ ...row, version: row.version + 1, updatedAt: now,
    characterAnswers: proposeCharacterDialogue(row._id),
    reviewNotes: [...row.reviewNotes.map(note => `Ghi chú kế thừa revision ${row.version}: ${note}`),
      "Phase 2: đề xuất biên tập lời thoại mô phỏng giáo dục, không phải lời nói hoặc hồi ức có thật của nhân vật. Chưa được duyệt.",
      "Trường Chinh: phân tích theo ý; Lê Duẩn: nhấn mạnh, khích lệ; Phạm Văn Đồng: giải thích nhẹ nhàng; Võ Nguyên Giáp: cô đọng, ghi nhớ và đối chiếu.",
      "Lời đáp đã diễn đạt lại, cần người quản trị đối chiếu từng mệnh đề với source.excerpt; kiểm tra đặc biệt Lê Duẩn, Quân lệnh số 1, ngày tháng và vai trò tập thể.",
    ],
  }));
  if (validateKnowledge(records, manifest).errors.length) throw new Error("Bản biên tập chưa hợp lệ; không ghi file.");
  writeJson(out, records);
  console.log(JSON.stringify({ file: out, drafts: records.length, approved: 0, published: 0, databaseWrites: 0 }));
} catch (error) { console.error(error instanceof Error ? error.message : "Không biên tập được bản nháp."); process.exitCode = 1; }

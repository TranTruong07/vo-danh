import { existsSync } from "node:fs";
import { DRAFT_OUTLINE, SOURCE_SHA256 } from "./knowledge/draft-outline";
import { checkedManifest, options, writeJson } from "./knowledge/common";
import { KNOWLEDGE_TOPIC, normalizeKnowledgePhrase, type KnowledgeDraft } from "@/server/domain/knowledge";
import { validateKnowledge } from "@/server/services/knowledge-validation";

try {
  const args = options(), file = String(args.file);
  if (existsSync(file)) throw new Error("File đích đã tồn tại. Chọn --file khác; không ghi đè nội dung đang được duyệt.");
  const manifest = checkedManifest(String(args.source), String(args.manifest));
  if (manifest.sourceSha256 !== SOURCE_SHA256) throw new Error("DOCX đã đổi. Cần người biên tập cập nhật outline và đối chiếu locators trước khi sinh nháp.");
  const now = new Date().toISOString();
  const records: KnowledgeDraft[] = DRAFT_OUTLINE.map(entry => {
    const blocks = entry.body.map(body => {
      const block = manifest.blocks.find(block => block.id === (typeof body === "number" ? `body/${body}` : body));
      if (!block || block.isHeading || !block.normalizedText) throw new Error(`Không tìm thấy nguồn nội dung body/${body}.`);
      return block;
    });
    const excerpt = blocks.map(block => block.text).join("\n");
    return {
      _id: entry.id, topicId: KNOWLEDGE_TOPIC,
      sectionId: blocks[0].sectionId, canonicalQuestion: entry.question, aliases: entry.aliases,
      normalizedPhrases: [...new Set([entry.question, ...entry.aliases].map(normalizeKnowledgePhrase))],
      approvedAnswer: excerpt,
      characterAnswers: {
        "truong-chinh": `Cùng xem nội dung được trình bày trong tư liệu: ${excerpt}`,
        "le-duan": `Bạn có thể đối chiếu nội dung này trong tài liệu: ${excerpt}`,
        "pham-van-dong": `Để tìm hiểu câu hỏi này, chúng ta cùng đọc tư liệu: ${excerpt}`,
        "vo-nguyen-giap": `Chúng ta hãy dựa vào tài liệu để tìm hiểu: ${excerpt}`,
      },
      source: { document: manifest.document, sectionId: blocks[0].sectionId, sourceSha256: manifest.sourceSha256,
        excerpt, blockIds: blocks.map(block => block.id), paragraphIndex: blocks[0].paragraphIndex,
        ...(blocks[0].tableIndex === undefined ? {} : { tableIndex: blocks[0].tableIndex }) },
      status: "draft", version: 1, createdAt: now, updatedAt: now,
      reviewNotes: ["Bản nháp trích nguyên nội dung các đoạn nguồn; lời dẫn mô phỏng do công cụ tạo offline, chưa duyệt.", "Cần người quản trị duyệt ý nghĩa từng alias, độ dài lời đáp và cả bốn phiên bản nhân vật; không phải lời nói nguyên văn của nhân vật."],
    };
  });
  if (validateKnowledge(records, manifest).errors.length) throw new Error("Outline sinh bản nháp không hợp lệ; chưa ghi file. Cần kiểm tra ID và nguồn.");
  writeJson(file, records);
  console.log(`Đã tạo ${records.length} draft; 0 approved, 0 published. Không ghi DB.`);
} catch (error) { console.error(error instanceof Error ? error.message : "Không tạo được bản nháp."); process.exitCode = 1; }

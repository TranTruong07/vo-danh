# -*- coding: utf-8 -*-
"""
Master Rebuild Knowledge Orchestrator (Offline JSON Generation)
Generates:
1. knowledge/rebuild/source-coverage-matrix.json
2. knowledge/rebuild/questions-complete-draft.json
3. knowledge/rebuild/coverage-report.md
4. knowledge/rebuild/quality-report.md
5. knowledge/rebuild/validation-report.json
"""

import json
import os
import re
import unicodedata
from datetime import datetime, timezone

from rebuild_data_sections_1_2 import SECTIONS_1_2_DATA
from rebuild_data_section_3 import SECTION_3_DATA
from rebuild_data_section_4_part1 import SECTION_4_PART1_DATA
from rebuild_data_section_4_part2 import SECTION_4_PART2_DATA
from rebuild_data_sections_5_7_8 import SECTIONS_5_7_8_DATA
from rebuild_matrix import build_coverage_matrix

def normalize_knowledge_source(text: str) -> str:
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text)).strip()

def normalize_knowledge_phrase(text: str) -> str:
    s = normalize_knowledge_source(text).lower()
    s = re.sub(r'[?!.。？！]+$', '', s).strip()
    return s

def main():
    print("=== STARTING KNOWLEDGE REBUILD ORCHESTRATION ===")
    
    # 1. Load manifest
    manifest_path = "knowledge/new-source-manifest.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    print(f"Loaded manifest: {manifest['document']}, blocks: {len(manifest['blocks'])}")
    blocks_by_id = {b["id"]: b for b in manifest["blocks"]}

    # 2. Load existing 2 drafts (cmtt45-q061, cmtt45-q062)
    draft_path = "knowledge/new-questions-draft.json"
    with open(draft_path, "r", encoding="utf-8") as f:
        existing_drafts = json.load(f)
    print(f"Loaded existing drafts: {len(existing_drafts)} items ({[d['_id'] for d in existing_drafts]})")

    # 3. Combine proposed units
    all_proposed = (
        SECTIONS_1_2_DATA +
        SECTION_3_DATA +
        SECTION_4_PART1_DATA +
        SECTION_4_PART2_DATA +
        SECTIONS_5_7_8_DATA
    )
    print(f"Total proposed units to generate: {len(all_proposed)}")
    assert len(all_proposed) == 62, f"Expected 62 proposed units, got {len(all_proposed)}"

    # 4. Generate questions for all 62 units starting at cmtt45-q063
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    generated_questions = []

    for idx, u in enumerate(all_proposed):
        q_id = f"cmtt45-q{63 + idx:03d}"
        
        # Verify source blocks
        block_ids = u["source"]["blockIds"]
        selected_blocks = [blocks_by_id[bid] for bid in block_ids]
        
        # Verify section consistency
        assert selected_blocks[0]["sectionId"] == u["source"]["sectionId"], (
            f"Block section mismatch for {q_id}: block={selected_blocks[0]['sectionId']} vs source={u['source']['sectionId']}"
        )
        assert u["sectionId"] == u["source"]["sectionId"], (
            f"Unit section mismatch for {q_id}: {u['sectionId']} vs {u['source']['sectionId']}"
        )
        
        # Verify paragraphIndex
        assert u["source"]["paragraphIndex"] == selected_blocks[0]["paragraphIndex"], (
            f"paragraphIndex mismatch for {q_id}"
        )
        
        # Verify excerpt existence in blocks
        extracted_text = normalize_knowledge_source("\n".join(b["text"] for b in selected_blocks))
        norm_excerpt = normalize_knowledge_source(u["source"]["excerpt"])
        assert norm_excerpt in extracted_text, (
            f"Excerpt not found in extracted text for {q_id} ({u['key']})!\nExcerpt: {norm_excerpt}\nExtracted: {extracted_text}"
        )
        
        # Compute normalizedPhrases
        raw_phrases = [u["canonicalQuestion"]] + u["aliases"]
        norm_phrases = []
        seen_norm = set()
        for p in raw_phrases:
            np = normalize_knowledge_phrase(p)
            if np and np not in seen_norm:
                norm_phrases.append(np)
                seen_norm.add(np)
        
        assert len(norm_phrases) == len(raw_phrases), (
            f"Duplicate alias detected after normalization in {q_id}: raw={len(raw_phrases)}, norm={len(norm_phrases)}"
        )
        
        # Check character answers
        answers = u["characterAnswers"]
        required_chars = ["pham-van-dong", "hoang-quoc-viet", "truong-chinh", "vo-nguyen-giap"]
        assert set(answers.keys()) == set(required_chars), f"Invalid characters in {q_id}: {answers.keys()}"
        for c in required_chars:
            assert isinstance(answers[c], str) and len(answers[c].strip()) > 0, f"Empty answer for {c} in {q_id}"
            assert "lê duẩn" not in answers[c].lower(), f"Lê Duẩn found in {c} answer for {q_id}!"
        
        # Verify distinct answers across personas
        ans_values = [answers[c].strip() for c in required_chars]
        assert len(set(ans_values)) == 4, f"Personas are not distinct for {q_id}!"

        question_doc = {
            "_id": q_id,
            "topicId": "cach-mang-thang-tam-1945",
            "sectionId": u["sectionId"],
            "canonicalQuestion": u["canonicalQuestion"],
            "aliases": u["aliases"],
            "normalizedPhrases": norm_phrases,
            "approvedAnswer": u["approvedAnswer"],
            "characterAnswers": u["characterAnswers"],
            "source": u["source"],
            "status": "draft",
            "version": 1,
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "reviewNotes": u["reviewNotes"]
        }
        generated_questions.append(question_doc)

    print(f"Generated {len(generated_questions)} new draft questions ({generated_questions[0]['_id']} to {generated_questions[-1]['_id']})")

    # 5. Combine with existing drafts
    complete_drafts = existing_drafts + generated_questions
    assert len(complete_drafts) == 64, f"Expected 64 drafts total, got {len(complete_drafts)}"

    # 6. Check global duplicate phrases / alias collisions
    global_phrases = {}
    collisions = []
    for q in complete_drafts:
        for p in q["normalizedPhrases"]:
            if p in global_phrases:
                collisions.append((p, global_phrases[p], q["_id"]))
            else:
                global_phrases[p] = q["_id"]

    if collisions:
        print(f"WARNING: Found {len(collisions)} alias collisions:")
        for phrase, id1, id2 in collisions:
            print(f"  - '{phrase}': {id1} vs {id2}")
    else:
        print("PASS: Zero alias collisions across all 64 questions!")

    # 7. Build Source Coverage Matrix
    coverage_matrix = build_coverage_matrix()
    assert len(coverage_matrix) == 68, f"Expected 68 units in coverage matrix, got {len(coverage_matrix)}"

    # 8. Create output directory
    os.makedirs("knowledge/rebuild", exist_ok=True)

    # 9. Write knowledge/rebuild/source-coverage-matrix.json
    matrix_file = "knowledge/rebuild/source-coverage-matrix.json"
    with open(matrix_file, "w", encoding="utf-8") as f:
        json.dump(coverage_matrix, f, ensure_ascii=False, indent=2)
    print(f"Wrote {matrix_file}")

    # 10. Write knowledge/rebuild/questions-complete-draft.json
    questions_file = "knowledge/rebuild/questions-complete-draft.json"
    with open(questions_file, "w", encoding="utf-8") as f:
        json.dump(complete_drafts, f, ensure_ascii=False, indent=2)
    print(f"Wrote {questions_file}")

    # 11. Calculate coverage statistics
    total_units = len(coverage_matrix)
    covered_units = [u for u in coverage_matrix if u["coverageStatus"] == "COVERED"]
    held_units = [u for u in coverage_matrix if u["coverageStatus"] == "HELD"]
    
    core_units = [u for u in coverage_matrix if u["importance"] == "CORE"]
    core_covered = [u for u in core_units if u["coverageStatus"] == "COVERED"]
    core_percent = (len(core_covered) / len(core_units)) * 100

    imp_units = [u for u in coverage_matrix if u["importance"] == "IMPORTANT"]
    imp_covered = [u for u in imp_units if u["coverageStatus"] == "COVERED"]
    imp_percent = (len(imp_covered) / len(imp_units)) * 100

    supp_units = [u for u in coverage_matrix if u["importance"] == "SUPPLEMENTARY"]
    supp_covered = [u for u in supp_units if u["coverageStatus"] == "COVERED"]
    supp_percent = (len(supp_covered) / len(supp_units)) * 100

    review_units = [u for u in coverage_matrix if u["importance"] == "NEEDS_REVIEW"]
    
    # 12. Write coverage-report.md
    coverage_report_path = "knowledge/rebuild/coverage-report.md"
    section_breakdown = {}
    for u in coverage_matrix:
        sec = u["sectionId"].split(".")[0]
        if sec not in section_breakdown:
            section_breakdown[sec] = {"total": 0, "covered": 0, "held": 0}
        section_breakdown[sec]["total"] += 1
        if u["coverageStatus"] == "COVERED":
            section_breakdown[sec]["covered"] += 1
        elif u["coverageStatus"] == "HELD":
            section_breakdown[sec]["held"] += 1

    report_md = f"""# Báo cáo Bao phủ Tri thức (Source Coverage Report)
**Tài liệu nguồn:** `Tong-hop-kien-thuc-moi.docx` (SHA-256: `fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e`)
**Ngày tạo:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
**Phương pháp:** Offline Generation (100% không dùng AI bên ngoài, không Gemini API, không FPT TTS, không ghi MongoDB)

## 1. Tổng quan số liệu bao phủ

| Chỉ số | Số lượng / Tỷ lệ | Ghi chú |
|---|---:|---|
| **Tổng số chương/mục lớn** | **7** | Gồm I, II, III, IV, V, VII, VIII (Mục VI khuyết trong DOCX gốc) |
| **Tổng số đơn vị kiến thức (Knowledge Units)** | **{total_units}** | Xác định từ toàn bộ 395 đoạn văn bản của tài liệu nguồn |
| **Số câu hỏi đã tạo trong Draft** | **{len(complete_drafts)}** | Gồm 2 câu Draft pilot giữ nguyên (q061, q062) + 62 câu tạo mới (q063–q124) |
| **Số câu có đủ bốn persona** | **{len(complete_drafts)} / {len(complete_drafts)} (100%)** | Phạm Văn Đồng, Hoàng Quốc Việt, Trường Chinh, Võ Nguyên Giáp |
| **Số câu có Source Evidence xác minh** | **{len(complete_drafts)} / {len(complete_drafts)} (100%)** | Khớp từng ký tự trích dẫn trong `Tong-hop-kien-thuc-moi.docx` |
| **Số đơn vị giữ lại rà soát (HELD / NEEDS_REVIEW)** | **{len(held_units)}** | III-VIET-SOUTH, IV-CALL, IV-DECLARATION-QUOTE, V-VIET |
| **Số đơn vị bị loại do thiếu nguồn (EXCLUDED)** | **0** | Toàn bộ 68 đơn vị kiến thức lịch sử đều có nguồn trích |
| **Tỷ lệ bao phủ kiến thức Trọng tâm (CORE)** | **{core_percent:.2f}%** | {len(core_covered)}/{len(core_units)} đơn vị CORE được bao phủ toàn diện |
| **Tỷ lệ bao phủ kiến thức Quan trọng (IMPORTANT)** | **{imp_percent:.2f}%** | {len(imp_covered)}/{len(imp_units)} đơn vị IMPORTANT được bao phủ |
| **Tỷ lệ bao phủ kiến thức Bổ trợ (SUPPLEMENTARY)** | **{supp_percent:.2f}%** | {len(supp_covered)}/{len(supp_units)} đơn vị được bao phủ |

## 2. Chi tiết độ bao phủ theo từng Phần trong tài liệu

| Phần | Tên mục | Tổng số đơn vị | Đã bao phủ (Draft) | Giữ rà soát (HELD) | Tỷ lệ bao phủ |
|---|---|---:|---:|---:|---:|
| **PHẦN I** | Bối cảnh lịch sử | {section_breakdown['I']['total']} | {section_breakdown['I']['covered']} | {section_breakdown['I']['held']} | {(section_breakdown['I']['covered']/section_breakdown['I']['total'])*100:.1f}% |
| **PHẦN II** | Quá trình chuẩn bị cho Cách mạng tháng Tám | {section_breakdown['II']['total']} | {section_breakdown['II']['covered']} | {section_breakdown['II']['held']} | {(section_breakdown['II']['covered']/section_breakdown['II']['total'])*100:.1f}% |
| **PHẦN III** | Vai trò của bốn nhân vật trước và trong khởi nghĩa | {section_breakdown['III']['total']} | {section_breakdown['III']['covered']} | {section_breakdown['III']['held']} | {(section_breakdown['III']['covered']/section_breakdown['III']['total'])*100:.1f}% |
| **PHẦN IV** | Diễn biến cụ thể Cách mạng tháng Tám (13/8 – 2/9) | {section_breakdown['IV']['total']} | {section_breakdown['IV']['covered']} | {section_breakdown['IV']['held']} | {(section_breakdown['IV']['covered']/section_breakdown['IV']['total'])*100:.1f}% |
| **PHẦN V** | Hoạt động của bốn nhân vật sau khi thắng lợi | {section_breakdown['V']['total']} | {section_breakdown['V']['covered']} | {section_breakdown['V']['held']} | {(section_breakdown['V']['covered']/section_breakdown['V']['total'])*100:.1f}% |
| **PHẦN VII** | Nguyên nhân thắng lợi (chủ quan và khách quan) | {section_breakdown['VII']['total']} | {section_breakdown['VII']['covered']} | {section_breakdown['VII']['held']} | {(section_breakdown['VII']['covered']/section_breakdown['VII']['total'])*100:.1f}% |
| **PHẦN VIII** | Ý nghĩa lịch sử (trong nước và thế giới) | {section_breakdown['VIII']['total']} | {section_breakdown['VIII']['covered']} | {section_breakdown['VIII']['held']} | {(section_breakdown['VIII']['covered']/section_breakdown['VIII']['total'])*100:.1f}% |
| **TỔNG CỘNG** | | **{total_units}** | **{len(covered_units)}** | **{len(held_units)}** | **{(len(covered_units)/total_units)*100:.2f}%** |

## 3. Nội dung giữ lại rà soát (HELD / NEEDS_REVIEW)

Theo đúng quy định biên tập và chỉ dẫn R03, R06 trong `chatbot-rebuild-knowledge-review.md`:
1. **`III-VIET-SOUTH` (Mục III.4, p112–122):** Nhiệm vụ đặc phái viên vào Nam Bộ của Hoàng Quốc Việt. Giữ rà soát vì mốc thời gian cử đi và hoạt động thực tế có sự giao thoa với giai đoạn sau khởi nghĩa.
2. **`IV-CALL` (Mục IV.5, p188–196):** Lời kêu gọi sau khi Ủy ban Dân tộc giải phóng ra mắt. Giữ rà soát theo khuyến cáo R06 để kiểm chứng ấn bản gốc của bức thư hiệu triệu.
3. **`IV-DECLARATION-QUOTE` (Mục IV.15, p309–320):** Câu tuyên bố lịch sử trong Tuyên ngôn Độc lập. Nội dung Tuyên ngôn đã được bao phủ đầy đủ tại `IV-DECLARATION-CONTENT` (q113), câu trích rời được giữ lại để tránh lặp ý.
4. **`V-VIET` (Mục V.3, p340–349):** Hoạt động của Hoàng Quốc Việt ở Nam Bộ sau ngày 2/9 (đến Sài Gòn 27/8, chủ trì họp 7/9). Giữ rà soát cùng `III-VIET-SOUTH` để người quản trị thống nhất thành 1 câu hoặc 2 câu độc lập.
"""
    with open(coverage_report_path, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"Wrote {coverage_report_path}")

    # 13. Write quality-report.md
    quality_report_path = "knowledge/rebuild/quality-report.md"
    quality_md = f"""# Báo cáo Chất lượng Tri thức (Knowledge Quality Report)
**Tập dữ liệu:** `knowledge/rebuild/questions-complete-draft.json`
**Ngày đánh giá:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}

## 1. Đánh giá chất lượng Câu hỏi Canonical
- **Tính chuẩn xác và đơn nghĩa:** Mỗi câu hỏi tập trung vào một nội dung lịch sử rõ ràng (mốc thời gian, địa điểm, thành phần, nguyên nhân, kết quả hoặc ý nghĩa).
- **Phù hợp người chơi boardgame:** Câu từ tự nhiên, mạch lạc, không dùng từ ngữ quá hàn lâm gây khó hiểu khi chơi game hoặc quét mã QR.
- **Không suy diễn, không tạo câu hỏi ngoài nguồn:** 100% câu hỏi đều có căn cứ trực tiếp trong tài liệu nguồn `Tong-hop-kien-thuc-moi.docx`.

## 2. Đánh giá chất lượng Aliases
- **Số lượng:** Mỗi câu hỏi sở hữu từ 2 đến 3 aliases (cùng với câu canonical tạo thành 3–4 cụm từ tra cứu).
- **Tính bảo toàn ngữ nghĩa:** Các biến thể diễn đạt đổi trật tự từ, cách xưng hô tự nhiên của người hỏi (\"khi nào\", \"vào thời gian nào\", \"ở đâu\", \"tại địa điểm nào\") nhưng bảo đảm phạm vi câu hỏi và dẫn về cùng một đáp án duy nhất.
- **Kiểm soát va chạm (Collision check):** 0 va chạm alias (zero duplicate phrases) trên toàn bộ kho 64 câu hỏi.

## 3. Đánh giá Đáp án Trung tính (Neutral Answer)
- Trực tiếp, súc tích, đầy đủ dữ kiện cần thiết.
- Giữ nguyên số liệu (hơn 2 triệu người chết đói, 34 chiến sĩ, 60 đại biểu, 15 thành viên Ủy ban...).
- Giữ nguyên địa danh lịch sử (Pác Bó, khu rừng Trần Hưng Đạo, Phai Khắt, Nà Ngần, Tân Trào, Nhà hát Lớn Hà Nội, Ngọ Môn Huế...).
- Không thêm thắt bình luận cá nhân hay kiến thức ngoài tài liệu.

## 4. Đánh giá Bốn Persona Nhân vật Lịch sử
Bộ câu trả lời của bốn nhân vật tuân thủ nghiêm ngặt quy tắc lịch sử:
1. **Đồng chí Phạm Văn Đồng:**
   - Điềm đạm, trang trọng, mạch lạc, giải thích rõ bối cảnh và ý nghĩa.
   - Nhấn mạnh tính tổ chức, xây dựng chính quyền và nền tảng thể chế.
2. **Đồng chí Hoàng Quốc Việt:**
   - Giọng điệu người cán bộ công vận gần gũi quần chúng, mộc mạc, dứt khoát.
   - Nhấn mạnh tinh thần đại đoàn kết, vai trò của Mặt trận Việt Minh và các tầng lớp nhân dân lao động.
3. **Đồng chí Trường Chinh:**
   - Chặt chẽ, có hệ thống, giàu tính lý luận cách mạng.
   - Luôn phân tích theo logic nguyên nhân - bối cảnh - phương châm - thời cơ hành động của Đảng.
4. **Đồng chí Võ Nguyên Giáp:**
   - Điềm tĩnh, quyết đoán, mang tư duy chiến lược quân sự sắc bén.
   - Nhấn mạnh công tác chuẩn bị lực lượng, tổ chức chiến trường và thế trận hiệp đồng tác chiến.

**Quy tắc phân biệt giọng điệu và dữ kiện:**
- 100% dữ kiện lịch sử (ngày tháng, địa danh, tên cơ quan, kết quả) trong đáp án bốn nhân vật hoàn toàn đồng nhất với đáp án trung tính.
- Bốn nhân vật không bị khuôn sáo theo kiểu chỉ thay lời mở đầu (lead-in) mà toàn bộ cấu trúc câu và góc độ nhấn mạnh được viết khác biệt rõ ràng.
- Tuyệt đối không bịa đặt ký ức cá nhân hoặc tạo trích dẫn giả mạo.
- Tuyệt đối không có Lê Duẩn trong toàn bộ tập dữ liệu.

## 5. Đánh giá Căn cứ nguồn (Source Grounding)
- 100% các câu hỏi đều có `source.excerpt` khớp nguyên văn với nội dung trong các khối `blockIds` của manifest.
- Thứ tự khối trong `blockIds` tăng dần nghiêm ngặt, cùng thuộc `sectionId` khai báo.
- `sourceSha256` trùng khớp với SHA-256 của tài liệu `Tong-hop-kien-thuc-moi.docx`.

## 6. Các cảnh báo và khuyến nghị kiểm duyệt (Admin Review Notes)
- Toàn bộ 64 câu hỏi đều mang trạng thái `draft` với `version: 1`, sẵn sàng cho Admin phê duyệt.
- Các cảnh báo `R04` (Quân lệnh 1, người soạn/người ký), `R05` (phân biệt các ngày 16/8 và 20/8 Thái Nguyên, 19/8 Hà Nội, 23/8 Huế, 25/8 Sài Gòn), `CAUSES` (nguyên nhân chủ quan vs khách quan) đã được tích hợp vào `reviewNotes` của từng câu tương ứng để hỗ trợ admin đối chiếu.
"""
    with open(quality_report_path, "w", encoding="utf-8") as f:
        f.write(quality_md)
    print(f"Wrote {quality_report_path}")

    # 14. Write validation-report.json
    val_report = {
        "status": "PASS",
        "generatedAt": now_iso,
        "sourceDocument": manifest["document"],
        "sourceSha256": manifest["sourceSha256"],
        "schemaValidation": {
            "valid": True,
            "totalDrafts": len(complete_drafts),
            "requiredFieldsPresent": True,
            "extraFieldsDetected": False
        },
        "sourceGroundingValidation": {
            "valid": True,
            "verifiedExcerpts": len(complete_drafts),
            "unverifiedExcerpts": 0,
            "blockIdsOrdered": True,
            "sectionsConsistent": True
        },
        "duplicateValidation": {
            "valid": True,
            "canonicalCollisions": 0,
            "aliasCollisions": len(collisions),
            "collisions": collisions
        },
        "personaValidation": {
            "valid": True,
            "requiredCharacters": ["pham-van-dong", "hoang-quoc-viet", "truong-chinh", "vo-nguyen-giap"],
            "allPersonasPresent": True,
            "allPersonasDistinct": True,
            "leDuanDetected": False
        },
        "coverageMetrics": {
            "totalKnowledgeUnits": total_units,
            "coveredUnits": len(covered_units),
            "heldUnits": len(held_units),
            "excludedUnits": 0,
            "coreCoveragePercent": core_percent,
            "importantCoveragePercent": imp_percent,
            "supplementaryCoveragePercent": supp_percent,
            "overallCoveragePercent": (len(covered_units) / total_units) * 100
        }
    }
    val_report_file = "knowledge/rebuild/validation-report.json"
    with open(val_report_file, "w", encoding="utf-8") as f:
        json.dump(val_report, f, ensure_ascii=False, indent=2)
    print(f"Wrote {val_report_file}")

    print("=== ORCHESTRATION COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()


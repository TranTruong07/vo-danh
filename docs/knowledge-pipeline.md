# Pipeline tri thức chatbot — Phase 1

> Cập nhật: backend chat đã có ở [Phase 2](chatbot-phase-2.md); workflow quản trị revision/review/publish/audit ở [Phase 3](chatbot-phase-3.md). Phần dưới giữ kết quả Phase 1. Bộ cần rà soát hiện tại là revision 3; chưa chạy import apply hoặc approve/publish dữ liệu thật.

Pipeline offline cho `CODEX_IMPLEMENTATION_GUIDE.md`, bao gồm versioning ở mục 15. Chưa có API chat, approve, publish hoặc UI duyệt. Không gọi LLM, Google TTS hay R2. Giữ nguyên trò chơi và popup hiện có.

## Kết quả dữ liệu

- Nguồn: `docs/source/Tong-hop-kien-thuc.docx` do chủ dự án cung cấp.
- Manifest giữ 189 paragraphs (bao gồm 15 ô của bảng), 1 bảng, thứ tự body và đầy đủ I–X. Locator zero-based; chỉ số body và paragraph khác nhau sau bảng.
- `knowledge/draft-questions.json`: 40 câu hỏi, mỗi câu 2 aliases, một đáp án trung tính và bốn lời đáp đầy đủ; tất cả `draft`, version 1. Lời đáp giữ nguyên các đoạn nguồn với lời dẫn mô phỏng giáo dục. Không giả làm phát ngôn nguyên văn hoặc ký ức của nhân vật.
- `knowledge/review-report.md`: đọc câu hỏi, aliases, năm lời đáp, nguồn và checklist từng câu. Có đối chiếu nguyên văn V.2/bảng V.5 với đính chính Lê Duẩn và IX.4.
- Validator: 0 lỗi cấu trúc, 18 cảnh báo cần xem xét. Không kiểm chứng lịch sử hoặc nghĩa tương đương của aliases một cách tự động.
- `knowledge/import-report.json`: dry-run 40 insert dự kiến, 0 ghi DB, 0 approved, 0 published; không có xung đột với DB tại thời điểm chạy.

Các file JSON và báo cáo có kiến thức chưa duyệt được gitignore, nằm ngoài `public/`, không thêm vào PWA hoặc gửi client. Không commit DOCX gốc nếu chưa được cho phép. Giữ bản gốc để kiểm tra tái lập; thiếu nguồn thì pipeline dừng.

## Cài đặt

Tại root dự án, dùng môi trường Python riêng. Các lệnh bên dưới tuân thủ RTK của workspace; trên máy không dùng RTK có thể bỏ tiền tố `rtk proxy`.

```powershell
rtk proxy npm install
rtk proxy python -m venv .local/knowledge-venv
rtk proxy .local\knowledge-venv\Scripts\python.exe -m pip install -r scripts/requirements-knowledge.txt
```

Trên Linux/macOS, executable Python của venv là `.local/knowledge-venv/bin/python`. `knowledge:extract` và bước kiểm chứng tự tìm venv theo OS; có thể chỉ định `KNOWLEDGE_PYTHON` tới Python đã cài python-docx. `tsx` là devDependency để script dùng được TS/path alias và connection MongoDB hiện có. Không thêm framework test hoặc thư viện DB thứ hai.

## Trích xuất và tạo bản nháp

```powershell
rtk proxy npm run knowledge:extract
rtk proxy npm run knowledge:drafts
rtk proxy npm run knowledge:validate
```

`knowledge:drafts` **từ chối ghi đè file đã tồn tại**, bảo vệ phần biên tập đang chờ duyệt. Nếu cần so sánh một lần sinh mới:

```powershell
rtk proxy npm run knowledge:drafts -- --file .local/candidate-drafts.json
rtk proxy npm run knowledge:validate -- --file .local/candidate-drafts.json --report .local/candidate-review.md
```

Outline thủ công trong `scripts/knowledge/draft-outline.ts` giữ ID tường minh cho từng câu và trỏ đúng các block của DOCX có SHA-256 cố định. ID không phụ thuộc vị trí trong danh sách. Nếu đổi DOCX, extractor vẫn đọc được nhưng generator dừng đến khi người biên tập đối chiếu và cập nhật outline/hash. Không thay hash chỉ để bỏ qua kiểm tra; giữ ID logical cũ, cấp ID mới cho câu mới.

Validator tái trích DOCX và so sánh toàn bộ manifest trước khi kiểm tra JSON; thay manifest hoặc nguồn mà không cập nhật dữ liệu sẽ bị từ chối. Kiểm tra ID/version, bốn nhân vật, nguồn theo block/paragraph/table/hash, ngày tháng metadata, trạng thái, normalized phrases và aliases trùng giữa các ID. Alias trùng là cảnh báo để review; runtime sau này phải gợi ý, không tự chọn đáp án.

## Import an toàn

Tái sử dụng `.env.local` qua `@next/env`, `MONGODB_URI`, `MONGODB_DB_NAME` và `lib/db/client.ts`. Không cần biến API AI hoặc secret mới. Không hiển thị URI trong báo lỗi.

```powershell
rtk proxy npm run knowledge:import
rtk proxy npm run knowledge:import -- --dry-run
```

Cả hai lệnh đều chỉ đọc MongoDB và ghi báo cáo local. Không tạo index/collection trong dry-run. Script đối chiếu phiên bản hiện có và alias với dữ liệu DB. **Đợt triển khai này chỉ chạy dry-run.**

Chỉ khi chủ dự án cho phép ghi DB, người vận hành mới chạy:

```powershell
rtk proxy npm run knowledge:import -- --apply
```

Lệnh apply chỉ nhận `draft` không có reviewer/reviewedAt/rejectionReason. Không hỗ trợ nhập một file đã tự đổi status thành approved. Không có thao tác approve/publish trong CLI này.

Hai collection mới theo mục 15 của guide:

| Collection | Nội dung |
| --- | --- |
| knowledge_questions | ID logical, topic, ngày tạo/cập nhật; sau này mới có publishedVersionId |
| knowledge_question_revisions | ID `<questionId>:v<version>`, nội dung đầy đủ, trạng thái, nguồn, importBatchId |

Index chỉ tạo khi apply: unique `(questionId, version)`, `(status, questionId)`, topic cho logical questions. Không sửa schema hoặc index của quiz/characters/tài khoản/đơn hàng.

- Cùng ID/version/nội dung: bỏ qua, không thay status/reviewer hoặc publishedVersionId.
- Cùng ID/version nhưng nội dung khác: dừng với conflict; kể cả revision cũ còn draft, không ghi đè.
- Nội dung mới: giữ ID logical, dùng version cao hơn mọi revision đã có để tạo draft mới. Bản published cũ vẫn nguyên vẹn.
- Insert revision dùng unique key; nếu import đồng thời trùng revision, một bên dừng, không cập nhật revision bên kia.
- Import nhiều câu không phải một transaction toàn bộ batch. Nếu mất kết nối giữa chừng, các draft đã ghi vẫn ở lại, chưa publish; chạy dry-run để xem rồi chạy lại khi được phép. Upsert logical dùng riêng `$setOnInsert`, có thể nối lại logical record sau một lần insert bị gián đoạn.
- Không xóa record, không có tùy chọn overwrite-approved. Việc approve/reject/publish/unpublish/rollback có audit và kiểm tra quyền admin thuộc giai đoạn sau.

## Kiểm duyệt tiếp theo

Người quản trị đọc `knowledge/review-report.md`, sửa câu hỏi/aliases/lời đáp trong JSON khi cần, giữ `status=draft`, rồi validate lại. Cần đặc biệt kiểm tra Lê Duẩn (đính chính), hai hành động ban bố/đọc Quân lệnh, các ngày thắng lợi từng địa phương, nguyên nhân chủ quan/khách quan và vai trò tập thể. Câu hỏi nhiều ý trong bộ nháp có một đáp án kết hợp được soạn offline để duyệt; runtime không tự nối nhiều đáp án.

Không xem việc đánh dấu checklist Markdown hoặc sửa JSON thành approved là quyền công bố. Phase 2–4 cần workflow admin server-side và published pointer, chỉ trả lời đúng một `characterAnswers[resolvedCharacterId]` của revision approved đang publish. Không gộp ngân hàng quiz vào knowledge.

Khảo sát Phase 2 đã tìm thấy đủ bốn nhân vật và cấu hình mapping server riêng. Xem `docs/chatbot-phase-2.md` cho mapping hiện tại; khảo sát Phase 0 vẫn lưu trạng thái tại thời điểm trước đó.

## Kiểm thử

```powershell
rtk proxy npm run knowledge:test
rtk proxy .local\knowledge-venv\Scripts\python.exe -X utf8 tests/knowledge-extraction.test.py
rtk proxy npx tsc --noEmit
```

Tests gồm DOCX paragraphs/bảng/ô gộp theo thứ tự, mười mục và đính chính; schema/nguồn/Unicode/phủ định/aliases; không tự duyệt; import idempotent, revision bất biến, draft mới giữ pointer cũ, dry-run không ghi và race insert. Bộ test dữ liệu thật cần DOCX và các JSON đã sinh local.

Không import/seed trong build/deploy. Runtime còn dùng popup placeholder như trước cho đến khi triển khai các phase tiếp theo.

## Kết quả kiểm tra ngày 14/10/2026

- 11/11 test Node pipeline và 2/2 test Python extraction đạt.
- TypeScript và ESLint các file mới đạt.
- Production build Next.js đạt, PWA sinh 76 public assets; không thêm route hay đưa knowledge vào offline pack.
- Test hồi quy Node sau thay đổi: 65/70 đạt. Năm lỗi auth giống hệt baseline 54/59, do loader test cũ tìm sai `server/services/character.ts`; không có lỗi mới trong các test hiện hữu.
- Full lint còn 5 lỗi loader test và 1 cảnh báo img đã ghi nhận trước tác vụ; không tuyên bố toàn repo hết lỗi.
- Import đã chạy ở chế độ dry-run, không chạy apply hoặc tạo indexes; kiểm thử nhánh ghi/race bằng mock repository, chưa kiểm thử apply lên DB thật.

## File thay đổi trong đợt Phase 0–1

- `docs/chatbot-phase-0.md`, `docs/knowledge-pipeline.md`, `knowledge/README.md`: khảo sát, kế hoạch, mapping, checklist và hướng dẫn.
- `scripts/extract-knowledge.py`, `scripts/requirements-knowledge.txt`, `scripts/knowledge/extract-runner.mjs`: extractor DOCX offline.
- `scripts/knowledge/draft-outline.ts`, `scripts/generate-drafts.ts`: outline có ID ổn định và sinh nháp từ nguồn.
- `scripts/knowledge/common.ts`, `scripts/validate-knowledge.ts`, `scripts/import-knowledge.ts`: kiểm chứng nguồn, báo cáo và CLI.
- `server/domain/knowledge.ts`, `server/models/knowledge.ts`, `server/services/knowledge-validation.ts`, `server/services/knowledge-import.ts`, `server/repositories/knowledge-import.ts`: hợp đồng dữ liệu và xử lý version/import.
- `tests/knowledge.test.mjs`, `tests/knowledge-extraction.test.py`: kiểm thử pipeline.
- `package.json`, `package-lock.json`: thêm scripts và devDependency tsx; `.gitignore`: bảo vệ nguồn/bản nháp và Python cache.
- Năm artifact local trong `knowledge/`: manifest, draft JSON, review Markdown/JSON, import JSON (không commit).

Không sửa UI/logic gameplay, auth, thanh toán, TTS, scanner hoặc PWA trong đợt này; các thay đổi trước đó vẫn giữ nguyên.

## Bản biên tập lời thoại Phase 2

Đề xuất mới nhất: `knowledge/draft-questions-phase-2-v3.json` (40 draft revision 3). Bản revision 1 và 2 được giữ riêng, không ghi đè. Đọc `knowledge/review-report-phase-2.md` để duyệt lời thoại của bốn nhân vật; phong cách là mô phỏng giáo dục, không phải lời nói lịch sử. Chưa import/approve/publish.

```powershell
rtk proxy npm run knowledge:validate -- --file knowledge/draft-questions-phase-2-v3.json --report knowledge/review-report-phase-2.md
rtk proxy npm run knowledge:import -- --dry-run --file knowledge/draft-questions-phase-2-v3.json --report knowledge/import-report-phase-2.json
```

`knowledge:dialogue-drafts` tạo revision draft mới từ bản nháp đầu vào và đề xuất biên tập offline trong `scripts/knowledge/character-dialogue.ts`; cần `--out` mới nếu file mặc định đã tồn tại. Công cụ không sửa file đã có, không nhận bản đã duyệt và không ghi DB. Toàn bộ kết quả backend/API/kiểm thử và giới hạn: [chatbot-phase-2.md](chatbot-phase-2.md).

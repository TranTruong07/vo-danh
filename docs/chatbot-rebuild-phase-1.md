# Chatbot knowledge rebuild — Phase 1

Ngày: 2026-11-02. **Đã hoàn tất cleanup được xác nhận và thăm dò 2 lượt; đã import 2 Draft. Chưa hoàn tất generation toàn bộ tài liệu.** Không approve/publish/deploy.

**Cập nhật 2026-11-03 — chờ xác nhận batch mới:** hoàn tất kế hoạch 68 ý hỏi, gồm 2 Draft có sẵn, 62 ý đề xuất thêm và 4 ý giữ để rà soát. Đợt tiếp tục không gọi Gemini, không ghi MongoDB. Xem [kế hoạch generation](chatbot-rebuild-generation-plan.md) và phần `planningContinuation` trong [báo cáo kiểm thử](chatbot-rebuild-phase-1-test-report.json). Các số liệu cleanup/pilot dưới đây là lịch sử ngày 02/11, không phải thao tác chạy lại.

## Kết quả thực tế

| Hạng mục | Kết quả |
|---|---|
| Database | `vo_danh` |
| Xóa kiến thức cũ | 60 `knowledge_questions`, 75 `knowledge_question_revisions` |
| Published pointers bị loại bỏ | 59, nằm trong question documents; không có collection pointer riêng |
| Aliases | Nằm trong revisions, không có collection alias riêng cần xóa |
| Kho mới | 2 logical questions, 2 revisions v1 draft |
| Approved / published / runtime index | 0 / 0 / 0 |
| Orphan / broken pointer / conflict | 0 / 0 / 0 |
| Gemini | 2/2 HTTP 200, không retry, hết ngân sách được duyệt |
| Aliases / đủ bốn persona | 4 aliases / 2 câu |
| Cần người duyệt / loại vì insufficient evidence | 2 / 0 |

Cleanup dùng transaction và đối chiếu số lượng, nguồn/hash, ID/version và checksum toàn bộ document trước ghi. Không drop collection, không xóa DB. Lệnh cleanup đã thực hiện xong; không chạy lại. Snapshot sau cleanup có 0 questions/revisions, 0 pointers và 0 runtime entries.

Tám collection bảo toàn sau toàn bộ đợt được đối chiếu SHA-256 BSON: `knowledge_audit` (135), `knowledge_generation_audit` (8), `knowledge_generation_locks` (1), `knowledge_private_files.files` (1), `knowledge_private_files.chunks` (1), `knowledge_proposals` (4), `knowledge_source_chunks` (187), `knowledge_sources` (1). Collection budget giữ nguyên bản cũ và thêm counter ngày 2026-11-02 với 2 lượt, không reset. Không có snapshot toàn bộ collection quiz/payment để tuyên bố so sánh byte; code không thao tác các collection đó.

## Code và hành vi

- Roster mới: Phạm Văn Đồng, Hoàng Quốc Việt, Trường Chinh, Võ Nguyên Giáp. Giữ legacy types/labels để đọc lịch sử cũ, không đổi tên nội dung đáp án Lê Duẩn thành Hoàng Quốc Việt.
- `CHAT_CHARACTER_HOANG_QUOC_VIET_ID` được ưu tiên; nếu thiếu thì dùng `CHAT_CHARACTER_LE_DUAN_ID` theo xác nhận chủ dự án. ID dùng lại: `6acf0cf89c11e27aef18841a`. Không tạo QR/hồ sơ mới, không sửa hồ sơ nhân vật; tên/ảnh ngoài chatbot do chủ dự án cập nhật trong admin.
- Bộ cấp ID khi convert proposal đọc cả ID còn lại trong audit, tránh tái sử dụng q001–q060 đang được chat history tham chiếu. Pilot dùng q061–q062; lần cấp mới tiếp theo từ q063.
- Import fingerprint bao gồm key/value của mọi persona và ổn định thứ tự key, nhận diện thay đổi Hoàng Quốc Việt và skip khi giống hệt.
- `/admin/knowledge` đọc MongoDB kể cả khi kho trống; không tự quay lại preview v3. Preview tường minh đọc `knowledge/new-questions-draft.json`. Form mới có 4 persona mới. Đọc revision lịch sử giữ roster gốc.
- Nguồn mới được pin theo SHA-256, private manifest và DOCX cố định trên server; không nhận đường dẫn từ client. Build tracing đưa đủ tài liệu private vào admin runtime. Không đưa drafts/DOCX vào public hoặc PWA.
- Gemini vẫn dùng provider, JSON Schema, prompt/grounding parser hiện có. Lõi factual phải có nguyên văn trong evidence và cả 4 lời đáp; khác biệt persona qua lời dẫn. Không thay matcher/model/billing/feature flag hay `.env.local`.
- Pilot CLI chỉ điều phối provider và validator hiện có, dùng chung daily budget, checkpoint trước gọi, marker exclusive chống chạy lại. Không tự xác nhận nguồn Mongo hay tạo actor/reviewer giả.
- Cache AI chứa quyết định, không trả lời lịch sử; cache key có candidate/revision. Runtime reread published pointer. Retry/selection không trả revision đã thu hồi. Đã kiểm tra đọc thật: q001 cũ và q061 Draft đều trả `null`. Không xóa chat history hoặc ledger cũ.

## Tài liệu mới và chất lượng

Nguồn `Tong-hop-kien-thuc-moi.docx`: 395 blocks/paragraphs, 394 không rỗng, 0 bảng, 7 mục đánh số I–V, VII–VIII và kết luận. Thiếu mục VI trong tài liệu; không tự bù. SHA-256 `fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e`.

Đọc phân tích đầy đủ và các điểm NEEDS_REVIEW tại [chatbot-rebuild-knowledge-review.md](chatbot-rebuild-knowledge-review.md). Không dùng nguồn cũ để tạo đáp án. Hai mẫu giữ nguyên output AI; chưa kiểm định lịch sử độc lập, không approve. Khác biệt persona hiện ở lời dẫn; chưa phải viết lại thân đáp án tự nhiên đa dạng. Không tự hạ grounding gate để tăng độ đa dạng.

## Gemini live

| Lượt | Source block | HTTP | Thời gian pipeline | Tokens input/output/total | Kết quả |
|---|---|---|---|---|---|
| 1 | body/24 | 200 | 2926 ms | 627/393/1020 | cmtt45-q061 v1 draft |
| 2 | body/310 | 200 | 2596 ms | 638/482/1120 | cmtt45-q062 v1 draft |

Tổng 2.140 tokens; 2 generateContent requests thực tế. API `v1beta`, model `gemini-3.5-flash-lite`; không tools/search hoặc retry. Thời gian là từ bắt đầu gọi provider đến validate/export, không phải benchmark latency mạng thuần. Raw output giữ trong `.local/knowledge-rebuild/pilot-call-1-raw.json` và `pilot-call-2-raw.json` để đối chiếu; không log key/prompt/cookie.

Free Tier: chủ dự án đã xác nhận project chưa liên kết billing; kiểm tra [giá chính thức](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite) ngày 2026-11-02 có input/output miễn phí. [Model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) xác nhận Structured Outputs; API metadata xác nhận model truy cập được và hỗ trợ generateContent. Không thể kiểm chứng billing/quota project chỉ bằng API listing. App budget lúc trước 0/5, sau 2/5; vẫn dừng vì ngân sách đợt chỉ 2 lượt, không dùng 3 lượt còn lại.

## Import và chạy thử

Đã chạy validation và dry-run: 2 insert, 0 skip, 0 conflict, 0 alias collision. Apply: 2 writes draft. Dry-run sau import: 0 insert, 2 skip. Không reviewer, không approved, không publishedVersionId. Import dùng insert-only hiện có; không tạo audit review giả.

Lệnh kiểm tra an toàn sau import:
```powershell
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --source docs/source/Tong-hop-kien-thuc-moi.docx --manifest knowledge/new-source-manifest.json --file knowledge/new-questions-draft.json --dry-run --report .local/knowledge-rebuild/import-check.json
```

Lệnh apply đã chạy cùng tham số nguồn/file, thay `--dry-run` bằng `--apply`. Không cần chạy lại. Snapshot cũ và báo cáo private ở `.local/knowledge-rebuild/`; không có tác vụ reset tự động.

Đăng nhập admin hiện có → `/admin/knowledge` → q061/q062 để xem neutral, aliases, bốn persona, source và review notes. Trang chi tiết `/admin/knowledge/cmtt45-q061` và `/admin/knowledge/cmtt45-q062`. Chỉnh sửa bằng revision mới; chưa bấm Approve/Publish cho đến đợt review người dùng chủ động quyết định.

Hai bản Draft đang tham chiếu nguồn private tĩnh. Chưa upload/confirm tài liệu mới vào `knowledge_sources`/GridFS. Muốn mở rộng bằng UI `/admin/knowledge/sources`, admin cần tải đúng DOCX mới, đọc nội dung và xác nhận nguồn bằng tài khoản thật. Không chọn tài liệu cũ làm căn cứ cho đợt rebuild.

## Kiểm thử

| Nhóm | Kết quả |
|---|---|
| Unit/regression gồm các phase cũ | 247/248 pass; 1 failure có sẵn |
| Kiểm thử rebuild | 8/8 pass trong suite trên |
| Python extraction | 3/3 pass, gồm nguồn mới và nguồn cũ |
| DOCX/PDF extraction TypeScript | 11/11 pass |
| TypeScript | pass |
| ESLint phạm vi thay đổi | pass |
| Production build | pass, workspace cô lập, không .env, không deploy |
| Mongo integration có ghi/xóa/fixture/concurrency | NOT_RUN: không chạy trên database hiện tại; dùng mock, không yêu cầu MONGODB_TEST_URI |
| Kiểm tra Mongo thật read-only/import | pass theo postflight; không tính thay thế test transaction lỗi/concurrent |
| Browser E2E | chưa chạy |

Failure cũ: `tests/knowledge-phase-2-5.test.mjs`, “holdout contains independent short/reordered/unaccented/negative/multi/scope cases”. Snapshot metrics Phase 2.5 không trùng matcher hiện tại (none 27 theo snapshot, thực tế 25; không có unsafe auto answer). Chạy bản HEAD trước thay đổi trong thư mục riêng cũng 15/16 pass cùng failure. Không sửa benchmark/nhãn/matching để làm xanh kết quả.

Build có cảnh báo multiple lockfiles vì thư mục copy cô lập và socket hang up/retry khi build thiếu mạng; vẫn exit 0, 45 static pages hoàn tất. Guard chặn fetch và Mongo; generationCalls trong regression/build = 0. PDF fixtures báo thiếu font fallback; 11 assertions vẫn pass. Không đánh dấu browser/iOS hay Mongo test chưa chạy là PASS.

Tái chạy:
```powershell
rtk proxy node scripts/check-knowledge-rebuild.mjs test
rtk proxy .local/knowledge-venv/Scripts/python.exe -X utf8 tests/knowledge-extraction.test.py
rtk proxy node --conditions=react-server --import tsx tests/knowledge-generation-extraction.ts
rtk proxy node node_modules/typescript/bin/tsc --noEmit
rtk proxy node scripts/check-knowledge-rebuild.mjs build
```

## File thay đổi

- `.env.chat.example`
- `features/knowledge/knowledge-detail.tsx`
- `features/knowledge/knowledge-list.tsx`
- `features/knowledge/proposal-fields.tsx`
- `next.config.ts`
- `scripts/extract-knowledge.py`
- `scripts/knowledge/character-dialogue.ts`
- `scripts/knowledge/phase-2-5.ts`
- `server/domain/knowledge-admin.ts`
- `server/domain/knowledge-generation.ts`
- `server/domain/knowledge.ts`
- `server/infrastructure/gemini-knowledge-generator.ts`
- `server/models/knowledge.ts`
- `server/repositories/knowledge-generation.ts`
- `server/repositories/knowledge-source.ts`
- `server/services/chat-characters.ts`
- `server/services/chat-history-admin.ts`
- `server/services/knowledge-admin.ts`
- `server/services/knowledge-generation-validation.ts`
- `server/services/knowledge-import.ts`
- `server/services/knowledge-validation.ts`
- `tests/chat-repositories.test.mjs`
- `tests/chat.test.mjs`
- `tests/knowledge-extraction.test.py`
- `tests/knowledge-generation.test.mjs`
- `tests/knowledge.test.mjs`
- `tests/support/knowledge-admin-fixture.mjs`

File tạo thêm:

- `scripts/cleanup-old-knowledge.ts`
- `scripts/rebuild-knowledge-pilot.ts`
- `scripts/check-knowledge-rebuild.mjs`
- `server/services/knowledge-cleanup.ts`
- `server/repositories/knowledge-cleanup.ts`
- `tests/knowledge-rebuild.test.mjs`
- `knowledge/new-source-manifest.json`
- `knowledge/new-questions-draft.json`
- `docs/chatbot-rebuild-phase-1.md`
- `docs/chatbot-rebuild-phase-1-test-report.json`
- `docs/chatbot-rebuild-knowledge-review.md`

Artifact JSON và DOCX đang được `.gitignore` loại theo quy tắc private có sẵn; cần đóng gói nội bộ cùng source khi triển khai sau này, không đưa vào public hoặc mặc định coi đã nằm trong git. Những `.env.*.example` untracked khác có sẵn được giữ nguyên.

## Giới hạn và điểm dừng

- Chỉ hoàn tất 2 mẫu theo ngân sách được phép. Kế hoạch cập nhật có 68 ý hỏi, Draft coverage 2/68 = 2,94%; không phải coverage đã duyệt hoặc kiểm định đầy đủ sự thật lịch sử.
- R01–R10 cần rà soát, bao gồm trích nguồn thiếu, thứ tự mục, vai trò Hoàng Quốc Việt, Quân lệnh 1 và timeline.
- Chưa chạy integration ghi/xóa/concurrency trên Mongo test và browser E2E. Không tạo fixture vào production để thay thế.
- Website chưa được deploy/restart bởi tác vụ này. Tiến trình đang chạy cần reload code mới để dùng roster và preview mới.
- Không tự đổi hồ sơ Lê Duẩn; chủ dự án đã chọn giữ ID và đổi tên sang Hoàng Quốc Việt, cần kiểm tra tên/ảnh/lời mở đầu qua admin.

## Hướng dẫn Phase 2 sau khi người dùng duyệt

1. Xem 2 mẫu và giải quyết các điểm nguồn NEEDS_REVIEW với chứng cứ, không tự sửa lịch sử.
2. Quyết định phạm vi câu còn thiếu và cấp ngân sách generation mới nếu muốn mở rộng; giữ nguyên checkpoint hiện tại.
3. Dùng tài khoản admin thật để chỉnh revision, đối chiếu canonical/alias/neutral/persona/evidence. Approve và Publish là hai thao tác chủ động riêng; hiện chưa thực hiện.
4. Sau publish có kiểm soát mới thử chatbot cả bốn nhân vật bằng phiên QR hợp lệ. Hiện Published trống nên chatbot chỉ fallback, đó là trạng thái dự kiến.

## Rollback

Không tự restore kiến thức cũ đã được chủ dự án yêu cầu xóa. Không dùng git reset/clean. Nếu cần dừng mở rộng, giữ nguyên 2 Draft và ngừng CLI; chúng không được runtime truy xuất. Thay đổi code có thể hoàn tác theo diff sau review, nhưng không nên phục hồi preview cũ hoặc cấp mã q001 từ đầu. Không tự xóa/reset budget hoặc ledger, không publish để thử.

## Kết quả tiếp tục ngày 2026-11-03

- MongoDB đọc từ cấu hình hiện tại xác nhận `vo_danh`: 2 logical questions, 2 revisions draft v1, 0 approved/published/runtime; q061/q062 giữ nguyên. 11 collection knowledge trước/sau có cùng count và SHA-256 BSON. Không đổi env, reset ledger hoặc tạo database.
- Dry-run nguồn mới: 0 insert, 2 skip, 0 conflict, 0 alias collision, 0 writes. Cảnh báo DATES_REVIEW q062 còn nguyên; R01–R10 vẫn cần người duyệt.
- App budget ngày UTC 03/11: 0/5, còn 5; counter ngày trước còn nguyên. Không đồng nhất counter nội bộ với quota/Free Tier hiện hành của provider hoặc quyền sử dụng được cấp.
- Đợt này 0 generation calls, 0 imports. Hai lượt pilot trước đã hết ngân sách được duyệt.
- Unit/mock/regression: 256/257 pass; lỗi còn lại là snapshot Phase 2.5 có sẵn. Riêng 9 tests planning/grounding/duplicate mới pass. Python extraction 3/3, DOCX/PDF TypeScript 11/11, TypeScript, lint phạm vi sửa và build cô lập đều pass. Browser E2E và integration có ghi thật: NOT_RUN.
- B01 đề xuất tối đa 3 calls, mỗi call 1 proposal, tối đa 3 Draft hợp lệ: Đức đầu hàng (body/4), Hội nghị Trung ương 8 (body/25), chuẩn bị quân sự tháng 4/1945 (body/58–64). Chưa được phép chạy. Cần điều phối batch riêng giữ checkpoint cũ; không chạy lại pilot.

File mới của đợt planning: `scripts/knowledge/rebuild-generation-plan.mjs`, `scripts/plan-knowledge-rebuild.mjs`, `scripts/inspect-rebuild-plan.ts`, `tests/knowledge-generation-plan.test.mjs`, `knowledge/new-generation-plan.json`, `docs/chatbot-rebuild-generation-plan.md`. Harness `scripts/check-knowledge-rebuild.mjs` thêm `--planning` để ghi log riêng, không ghi đè kết quả cũ. Cập nhật ba báo cáo rebuild hiện có. Không sửa runtime, dữ liệu nguồn, hai Draft, persona whitelist hoặc matching trong đợt này.

Điểm dừng theo mục 6 và 10 trong yêu cầu CONTINUE PHASE 1: chờ xác nhận riêng B01 trước khi gọi Gemini và import các Draft mới của batch. Chưa chuyển Phase 2.

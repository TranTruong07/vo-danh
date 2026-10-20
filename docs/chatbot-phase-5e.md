# Phase 5E — AI Knowledge Generation Pipeline

Ngày thực hiện: 18/10/2026. Phạm vi theo tệp yêu cầu kết thúc tại Task 11, bước 2; chủ dự án xác nhận không có phần tiếp theo.

## Kết quả

Đã triển khai hai đầu vào dùng chung service:

1. `/admin/knowledge/sources` → upload DOCX/PDF → trích xuất và chia đoạn → đọc, xác nhận nguồn → `/admin/knowledge/generate` → chọn đoạn/số câu → tạo proposal → `/admin/knowledge/proposals` → biên tập → tạo Draft → workflow kiểm duyệt hiện hữu.
2. Chi tiết nhóm tại `/admin/chat-questions` → **Tạo kiến thức từ câu hỏi này** → trang generate nhận `groupId` → backend xác thực admin và đọc câu hỏi từ MongoDB → chọn đoạn nguồn → cùng luồng proposal/Draft.

Không có thao tác tự approve/publish. Không gọi Gemini live trong đợt triển khai; không ghi MongoDB của dự án, thay cấu hình `.env.local`, sửa Published Knowledge hoặc deploy. Quiz, QR, TTS, PWA, payment và matching runtime giữ nguyên. Không thực hiện Phase 5C.4, 5D.1 hoặc phase tiếp theo.

## Khảo sát và tái sử dụng

- Kiến trúc Next.js hiện có: UI → route handler → service → repository → MongoDB, dùng kết nối `lib/db/client.ts`.
- Tái sử dụng `requireKnowledgeAdmin`, `KnowledgeAdminError`, HTTP adapter, kiểm tra same-origin, `validateKnowledge`, schema logical/revision/audit và workflow submit/approve/reject/publish.
- Revision cũ dùng tài liệu DOCX cố định. `readKnowledgeManifest(reference)` nay nhận nguồn theo revision: nguồn upload được tra theo ID chunk bất biến, kiểm tra hash/tên/trạng thái xác nhận; nguồn cũ vẫn dùng manifest và kiểm tra SHA như trước.
- `/api/chat` và bộ lọc approved + published pointer không thay đổi.
- R2 hiện dùng bucket có URL public cho ảnh/âm thanh. Tài liệu nguồn dùng GridFS riêng, không đưa vào public bucket hoặc PWA.
- Dùng SDK `@google/genai` đã có, API `v1beta`, model từ `GEMINI_MODEL`. Generator admin tách khỏi question matcher.

## Upload, nguồn và giới hạn

- Raw binary upload qua route admin: kiểm tra Origin, MIME, đuôi file, magic bytes; đọc stream với giới hạn thực tế, không chỉ tin Content-Length.
- Mặc định 10 MiB/file (cấu hình tối đa 20), 100 trang PDF (tối đa 200), 200.000 ký tự (tối đa 500.000).
- DOCX: yauzl đọc lazy entry, giới hạn 2.000 entry, 30 MiB tổng dung lượng giải nén khai báo, 8 MiB/entry, tỷ lệ nén tối đa 150; giới hạn byte thực đọc. Chặn entry mã hóa, macro, OLE/embedded/ActiveX, DTD/entity, altChunk. XML parser saxes đọc đoạn/bảng theo thứ tự, không tải quan hệ bên ngoài.
- PDF: pdfjs-dist 4.8.69 legacy build tương thích Node hiện có; tắt eval/font rendering, chỉ đọc text layer, kiểm tra trang và ký tự; từ chối file không đọc được, cần mật khẩu, JavaScript hoặc attachment được parser phát hiện. Không OCR.
- Chunk tối đa 5.000 ký tự, giữ section, thứ tự paragraph, offset UTF-16 trong paragraph hoặc text trang. PDF có trang vật lý; DOCX không bịa số trang. Section ID trong revision được ánh xạ thành `section-N`; tiêu đề thật vẫn có trong manifest/UI.
- PDF nhiều cột, font đặc biệt và bảng phức tạp có thể cho thứ tự text chưa phù hợp: admin phải đọc bản trích trước khi xác nhận. Parser chạy trong Node server, chưa có worker sandbox riêng để cô lập CPU/memory; giới hạn ứng dụng không phải bảo đảm chống mọi file PDF gây tốn tài nguyên.
- File sai định dạng bị từ chối trước khi lưu kho. Source đã lưu có metadata uploader, checksum, loại/tên, kích thước, extraction status, source status, số chunk, storage reference và errors. Không có endpoint public tải file.

### MongoDB/BSON

Các collection mới chỉ được tạo khi admin thực hiện thao tác thật:

- `knowledge_sources`: metadata nhỏ; `knowledge_source_chunks`: mỗi document chỉ một chunk, tối đa khoảng 20 KB text UTF-8.
- `knowledge_private_files.files` và `.chunks`: GridFS mặc định chia file thành các block nhỏ, không nhét file 10–20 MB vào một BSON document giới hạn 16 MiB.
- `knowledge_proposals`, `knowledge_generation_audit`: nội dung có giới hạn độ dài, lưu riêng từng proposal và snapshot trước/sau biên tập; không nhét toàn tài liệu hoặc batch vào một document.
- `knowledge_generation_budget`: hạn mức theo ngày UTC, độc lập quota matching.
- `knowledge_generation_locks`: tuần tự hóa các lần chuyển proposal thành Draft.

Indexes được tạo ở luồng mutation, không ở GET/build. Chunks có unique `(sourceId, order)`, nguồn/proposal có index sắp xếp; audit có index entity/time. File nguồn làm tăng dung lượng MongoDB, không cam kết gói miễn phí đủ cho số lượng upload không giới hạn. Nếu metadata transaction thất bại, repository thử xóa chính GridFS upload vừa tạo; crash đột ngột vẫn có thể để file mồ côi cần kiểm kê thủ công.

## Gemini, grounding và persona

- Tối đa 3 nguồn, 12 đoạn và 24.000 ký tự/lượt; 1–5 đề xuất. Chỉ gửi đoạn text đã chọn, không gửi file binary, cookie, key hoặc lịch sử toàn phiên.
- Structured Outputs + runtime validation; schema không cấp quyền cho model tạo logical ID, actor, status revision hay published pointer. Prompt coi nội dung tài liệu/câu hỏi là dữ liệu, không phải chỉ thị.
- Backend kiểm tra source/chunk thuộc tập đã chọn, tìm quote nguyên văn và tự tính offset. Citation do model tự khai báo không được xem là bằng chứng nếu không tìm thấy.
- **Giới hạn thận trọng của bản này:** mỗi proposal dựa trên một chunk, một nguồn; neutral answer phải là đoạn liên tục nguyên văn trong quote. Bốn persona giữ nguyên phần này và chỉ thêm một trong hai lời dẫn sư phạm theo nhân vật, hoặc dùng nguyên phần trung tính. UI cho chọn lời dẫn tương ứng. Nếu AI/admin thêm dữ kiện hoặc diễn đạt ngoài khung thì proposal trở lại `insufficient_evidence`, chưa chuyển Draft.
- Vì vậy bản này chưa hỗ trợ tổng hợp nhiều đoạn hay paraphrase đáp án tự do. Đây là giới hạn có chủ đích của kiểm chứng tự động, không phải tuyên bố đã giải quyết semantic entailment. Câu hỏi, ngữ cảnh, tính đúng của nguồn, các mâu thuẫn và ý nghĩa lịch sử vẫn do admin duyệt.
- Warnings và thông báo lời thoại mô phỏng được hiển thị trước khi tạo Draft. Admin phải xác nhận đã đối chiếu evidence và đủ bốn lời đáp; source phải được admin xác nhận riêng.
- Timeout generator admin 30 giây, AbortSignal + deadline; một SDK attempt, không tự retry. Timeout matcher 5 giây, model và feature flag matching không bị sửa.
- Daily application budget mặc định 5 lượt, tối đa cấu hình 20; lỗi vẫn tiêu hao lượt đã reserve. Đây không phải quota miễn phí do Google bảo đảm.
- `requestId` gắn actor được hash thành proposal/batch ID. Bấm lại cùng request không gọi AI thêm. Muốn lượt mới admin phải bấm nút chuẩn bị lượt mới. Không xóa/reset ledger các phase trước.
- Status proposal tách khỏi revision. Provider lỗi được lưu `failed` và mã đã lọc, không raw prompt/error. Khi process bị ngắt, admin có thể bỏ qua proposal `generating` sau 5 phút; không tự gọi lại hoặc hoàn quota.

Tham khảo API: [Google Structured Outputs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en). Việc provider chấp nhận schema/prompt này chưa được xác minh live trong Phase 5E.

## Duplicate và chuyển Draft

- So sánh canonical/aliases với các revision draft, pending, approved và proposal đang biên tập; bao gồm cả trong batch và kiểm tra lại ngay trong transaction chuyển Draft.
- Exact dùng normalization hiện có, không bỏ phủ định/ngày tháng. Possible dùng độ giao token đã chuẩn hóa không dấu (ít nhất 4 token chung, Jaccard ≥ 0,55), chỉ là cờ biên tập; không thay threshold/matching chatbot hoặc tự hợp nhất câu hỏi.
- Exact duplicate chặn logical question mới. Admin chọn logical ID hiện hữu để tạo revision mới; proposal trùng khác phải được xử lý/bỏ qua trước.
- Possible duplicate yêu cầu admin xác nhận quyết định. UI có link đối chiếu lời đáp hiện hữu. Chưa benchmark ngưỡng duplicate; có thể có false positive/negative và không được coi là semantic equivalence.
- Transaction khóa conversion, đọc lại proposal/version/nguồn/catalog, cấp ID hoặc version kế tiếp, insert revision `draft`, giữ pointer Published, thêm audit bằng actor đăng nhập và đánh dấu proposal converted. Không cập nhật nội dung revision cũ.
- UI yêu cầu lưu biên tập trước khi tạo Draft, ngăn nội dung chưa lưu khác nội dung server. CAS version ngăn hai tab ghi đè proposal nhau.
- MongoDB cần hỗ trợ transaction/replica set, giống workflow admin hiện có. Chưa chạy integration transaction/GridFS trên DB thật.

## API mới

Tất cả yêu cầu admin server-side; response private/no-store. Các mutation kiểm tra same-origin.

| Endpoint | Method | Chức năng |
|---|---|---|
| `/api/admin/knowledge/sources` | GET | Danh sách 20 nguồn/trang |
| `/api/admin/knowledge/sources` | POST | Upload binary, header MIME + `X-File-Name` encoded |
| `/api/admin/knowledge/sources/[id]` | GET | Metadata và chunk của nguồn |
| `/api/admin/knowledge/sources/[id]` | PATCH | `{confirmed:true}` xác nhận nguồn bằng admin thật |
| `/api/admin/knowledge/generate` | GET | Context groupId đọc từ database và trạng thái bật AI |
| `/api/admin/knowledge/generate` | POST | `{requestId, sourceIds, chunkIds, count, groupId?}` |
| `/api/admin/knowledge/proposals` | GET | Danh sách proposal, 20/trang |
| `/api/admin/knowledge/proposals/[id]` | GET | Nội dung, evidence, duplicate hiện tại |
| `/api/admin/knowledge/proposals/[id]` | PATCH | Biên tập hoặc bỏ qua, có expected `version` |
| `/api/admin/knowledge/proposals/[id]` | POST | Tạo Draft, xác nhận evidence/persona, targetId/duplicateDecision nếu cần |

Không thêm endpoint approve/publish mới; dùng workflow hiện hữu.

## Cấu hình và chạy thử

Mẫu: `.env.knowledge-generation.example`. Chưa thay `.env.local`.

```dotenv
KNOWLEDGE_GENERATION_ENABLED=false
KNOWLEDGE_GENERATION_DAILY_CALLS=5
KNOWLEDGE_UPLOAD_MAX_MB=10
KNOWLEDGE_MAX_PAGES=100
KNOWLEDGE_MAX_CHARS=200000
```

Generator đọc server-only `GEMINI_API_KEY` và `GEMINI_MODEL` hiện có; default model `gemini-3.5-flash-lite`, API v1beta. Không bật billing. Chỉ bật `KNOWLEDGE_GENERATION_ENABLED=true` khi chủ dự án sẵn sàng chạy thử live và đã kiểm tra hạn mức project. Không cần thay `CHAT_AI_MATCHING_ENABLED` hoặc `CHAT_AI_AUTO_ANSWER`.

1. Đăng nhập tài khoản admin theo cơ chế hiện có ở Home hoặc `/admin/login`; không có tài khoản/reviewer mới được seed.
2. Vào `/admin/knowledge/sources`, upload một tài liệu được phép sử dụng. Đọc nội dung trích và xác nhận hợp lệ. Tài liệu cố định cũ không tự được đăng ký mới; có thể upload cùng file để chọn các chunk cho generator.
3. Vào Generate, chọn nguồn/đoạn, đặt số câu. Hoặc mở chi tiết nhóm ở `/admin/chat-questions` rồi chọn nút tạo kiến thức.
4. Tạo một lượt, mở Proposals, đọc evidence và warnings; chỉnh sửa và lưu biên tập. Nếu thiếu bằng chứng, sửa cho đúng nguồn hoặc bỏ qua.
5. So sánh duplicate; chọn ID đích nếu cần revision mới. Xác nhận kiểm tra và lưu Draft.
6. Mở bản nháp → đọc nguồn/bốn persona → submit → admin quyết định approve/reject → publish khi được phép. Không dùng Gemini proposal trực tiếp trong chat.

Trước khi thử ghi, nên cấu hình database test riêng. Không dùng dữ liệu production để thay cho integration test. Nếu deploy serverless sau này, phải đối chiếu giới hạn request body của nền tảng: giới hạn 10 MB ở ứng dụng không vượt được giới hạn nhỏ hơn của hosting.

## Kiểm thử và giới hạn xác minh

- 191/191 unit/regression tests đạt (matching, session, Published enforcement, history, admin workflow và generation).
- 11/11 kiểm tra extractor đạt: DOCX đoạn/bảng/thứ tự, macro/embedded/ActiveX, DTD, compression bomb, MIME/magic, quá dung lượng, PDF text và PDF không có text.
- TypeScript đạt; ESLint các file Phase 5E đạt.
- Lint toàn source với `--ignore-pattern .local/**`: còn 5 lỗi cũ `no-assign-module-variable` trong `tests/character-images.test.mjs`, `character-questions.test.mjs`, `history-game.test.mjs`, `orders.test.mjs`, `support/load-typescript.mjs`; 1 cảnh báo `<img>` ở `app/author/page.tsx`. Không sửa các file ngoài phạm vi.
- Production build trong workspace riêng đạt; không copy `.env.local`, không chạy script sinh lại PWA. Có cảnh báo nhiều lockfile và experimental JSON module; build có log network retry, không phải Gemini generation. Harness chặn global fetch/Mongo connect, không phải firewall chặn mọi socket của công cụ build.
- 0 generation live, 0 thao tác lên database dự án. Test persistence/service dùng mock; chưa kiểm chứng MongoDB transaction, indexes, GridFS và concurrency trên database test riêng.
- Chưa kiểm thử UI tương tác trong browser thật, chưa có screenshot desktop/mobile. Chưa xác nhận chất lượng proposal từ Gemini thật, tỉ lệ thiếu bằng chứng, throughput hoặc parser trên toàn bộ định dạng PDF thực tế.
- Dependency audit sau cập nhật yauzl lên 3.4.0 không còn báo lỗi package parser mới; còn 9 cảnh báo dependency sẵn có ngoài phạm vi. Không chạy audit fix rộng hoặc nâng Next.js.

Lệnh tái kiểm tra (không nạp `.env.local`):

```powershell
rtk proxy node scripts/check-knowledge-generation.mjs test
rtk proxy node --conditions=react-server --import tsx tests/knowledge-generation-extraction.ts
rtk proxy npx tsc --noEmit
rtk proxy npx eslint . --ignore-pattern .local/**
rtk proxy node scripts/check-knowledge-generation.mjs build
```

## File tạo/sửa

- Domain: `server/domain/knowledge-generation.ts`.
- Services: `server/services/knowledge-generation.ts`, `knowledge-generation-validation.ts`; sửa `knowledge-admin.ts` để tra nguồn của revision.
- Repository: `server/repositories/knowledge-generation.ts`; sửa `knowledge-source.ts`.
- Infrastructure: `server/infrastructure/knowledge-extraction.ts`, `knowledge-upload-http.ts`, `gemini-knowledge-generator.ts`.
- API: năm route mới trong `app/api/admin/knowledge/{sources,sources/[id],generate,proposals,proposals/[id]}/route.ts`.
- Pages: `app/admin/knowledge/{sources,generate,proposals}/page.tsx`.
- UI: `features/knowledge/knowledge-generation.tsx`, `.css`; thêm điều hướng ở `knowledge-list.tsx` và nút ở `features/admin/chat-history-admin.tsx`.
- Test: `tests/knowledge-generation.test.mjs`, `knowledge-generation-extraction.ts`; cập nhật một mock của `tests/knowledge-admin.test.mjs` để phản ánh nguồn theo revision.
- Tooling: `scripts/check-knowledge-generation.mjs`; `package.json`, lockfile thêm pdfjs-dist, yauzl, saxes, types yauzl; `next.config.ts` externalize parser server; `.gitignore` và `.env.knowledge-generation.example`.
- Báo cáo: tài liệu này và `docs/chatbot-phase-5e-test-report.json`.

## Rollback

Giữ `KNOWLEDGE_GENERATION_ENABLED=false` để khóa các generation mới. Nếu cần gỡ UI/API mới, chỉ revert các thay đổi Phase 5E được liệt kê, không reset cả working tree vì có các phase trước chưa commit. Nếu đã có revision dùng nguồn upload, phải giữ source resolver và kho nguồn để workflow review/publish còn đối chiếu được. Không xóa collections hoặc revision để rollback UI.

Dừng tại Phase 5E, chờ chủ dự án kiểm tra trước khi bật live hoặc triển khai tiếp.

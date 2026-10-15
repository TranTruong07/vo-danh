# Chatbot boardgame lịch sử — Phase 3: Knowledge Review & Publishing

Ngày kiểm tra: **14/10/2026**.

**Đã triển khai giao diện và backend quản trị kiến thức. Chưa import dữ liệu, chưa approve/publish câu lịch sử nào, chưa thay đổi dữ liệu production.** Dừng tại Phase 3 để chủ dự án kiểm tra.

Phạm vi theo yêu cầu Phase 3 mới nhất: quản trị kiến thức. Các đề mục Phase 3 về popup trong guide/báo cáo cũ không phải phạm vi lần này. Popup chatbot, quiz, điểm số, QR, PWA, TTS, thanh toán và authentication hiện hữu không bị thay đổi logic.

## 1. Tài liệu đã đọc và kết quả

Đã đọc toàn bộ `CODEX_IMPLEMENTATION_GUIDE.md`, `docs/chatbot-phase-0.md`, `docs/chatbot-phase-2.md`, `docs/knowledge-pipeline.md`, `knowledge/review-report-phase-2.md`, quy tắc `.agents/rules/`, `RTK.md` và các hướng dẫn Next.js cài trong `node_modules/next/dist/docs/` liên quan đến route handlers, params bất đồng bộ, forms/authentication và file tracing.

| Công việc | Kết quả |
| --- | --- |
| Khảo sát MongoDB và revision 3 | Hoàn thành bằng thao tác chỉ đọc |
| Validate và dry-run | 40 draft revision 3 hợp lệ, 0 lỗi cấu trúc, 18 cảnh báo; 40 inserts dự kiến, 0 writes |
| Quy trình import | Tái sử dụng importer, thêm script Phase 3 khóa revision 3; **không chạy `--apply`** |
| Admin knowledge management | Danh sách/tìm kiếm/lọc, nguồn, 5 lời đáp, revision mới, review, publish/unpublish, lịch sử và audit |
| Bảo vệ backend | Auth admin, validation, origin, optimistic concurrency và Mongo transaction |
| Kiểm thử | Unit, browser fixture, HTTP không đăng nhập, TypeScript/build đạt; integration Mongo ghi dữ liệu chưa chạy |
| Dữ liệu thật cho chatbot | Chưa có approved + published; chờ xác nhận import và quản trị viên duyệt |

## 2. Khảo sát dữ liệu và 18 cảnh báo

Tại thời điểm kiểm tra, `knowledge_questions`, `knowledge_question_revisions`, `knowledge_import_batches` và `knowledge_audit` chưa tồn tại; số document từng collection là 0. Index kiến thức published trả 0 mục. Mapping server của cả bốn nhân vật vẫn hợp lệ. Lệnh Mongo `hello` cho thấy deployment hỗ trợ transaction. Các kiểm tra này không tạo collection/index và không ghi dữ liệu.

File `knowledge/draft-questions-phase-2-v3.json` gồm 40 bản nháp, mỗi bản có một đáp án trung tính và bốn lời đáp nhân vật. Tất cả version 3, status draft, không reviewer/reviewedAt. Không sửa nội dung lịch sử hoặc tạo bản biên tập mới trong Phase 3.

SHA-256 của file revision 3:

```text
88eadd13039a5a87d4c1c871ed8f75c49aa36990ddef4e2cbbb642eabaec1dba
```

Artifacts local:

- `knowledge/review-report-phase-3.md` và `.json`: validate, đối chiếu nội dung và cảnh báo.
- `knowledge/import-report-phase-3.json`: dry-run, 40 `insert_draft`, 0 writes/approved/published, không alias trùng giữa các question ID trong bộ import.
- Các artifact chứa kiến thức riêng tiếp tục được ignore; không đưa vào `public/` hoặc PWA.

### Cảnh báo cần quản trị viên rà soát

Các mã trong bảng có tiền tố **`cmtt45-q`**. Đây là cảnh báo cần đối chiếu nguồn, **không phải kết luận nội dung đã đúng hoặc đã được duyệt**.

| Nhóm | Số cảnh báo | Mã câu hỏi | Nội dung cần kiểm tra |
| --- | ---: | --- | --- |
| `DATES_REVIEW` | 8 | 002, 003, 017, 018, 019, 020, 028, 037 | Phân biệt các mốc Hà Nội, Huế, Sài Gòn, Tuyên ngôn Độc lập; không gộp các sự kiện. Riêng q003 cần phân biệt thông báo Nhật đầu hàng và lễ ký đầu hàng theo nguồn. |
| `QUAN_LENH` | 4 | 014, 022, 025, 026 | Phân biệt ban bố Quân lệnh số 1 đêm 13/8 và Võ Nguyên Giáp đọc ngày 16/8 tại Tân Trào theo tài liệu. |
| `LE_DUAN` | 3 | 023, 038, 039 | Đối chiếu mục V.2, bảng V.5, đính chính sau bảng và IX.4; không suy diễn Lê Duẩn trực tiếp chỉ huy Sài Gòn tháng 8/1945. |
| `CAUSES` | 3 | 031, 032, 033 | Kiểm tra nghĩa aliases, phân biệt nguyên nhân chủ quan/khách quan. |

Với từng câu, đọc source excerpt và các locator đầy đủ; đối chiếu từng mệnh đề trong neutral answer và bốn lời đáp. Giữ vai trò tập thể theo tài liệu. Lời đáp theo nhân vật là **mô phỏng giáo dục**, không biến thành trích dẫn/phát ngôn lịch sử có thật. Validator/test thành công không thay thế duyệt lịch sử.

## 3. Kiến trúc và quy tắc dữ liệu

```text
Admin page / client component
  → GET/POST /api/admin/knowledge[/<questionId>]
  → server/services/knowledge-admin.ts
  → server/repositories/knowledge-admin.ts
  → MongoDB hiện hữu

Nguồn đối chiếu (chỉ server)
  → server/repositories/knowledge-source.ts
  → DOCX + extraction manifest + bộ preview revision 3
```

- Dùng lại `currentAccount()`, user/session MongoDB và cơ chế admin hiện có. Mọi service công khai kiểm tra role admin trước khi đọc/ghi knowledge. API kiểm tra quyền ở backend, không chỉ ẩn nút UI.
- `reviewedBy`, `createdBy`, actor ID/email trong audit lấy từ tài khoản admin đăng nhập. Client không được gửi reviewer, status, published pointer hoặc metadata nguồn. Không tạo reviewer giả trong DB; danh tính giả chỉ có trong fixture kiểm thử cô lập.
- Mỗi lần sửa tạo revision mới: version lớn nhất hiện có + 1, status draft, không kế thừa approval. Nội dung revision cũ được giữ nguyên. Có `basedOnRevisionId`, `createdBy` và audit `changedFields`.
- Editor cho sửa canonical question, aliases, neutral answer và bốn lời đáp. Source/excerpt/locators được kế thừa từ revision gốc, không chỉnh tùy ý qua API này. Thay tài liệu nguồn cần quy trình nguồn/revision được giao riêng.
- Draft có thể gửi duyệt (`pending_review`) hoặc được admin duyệt trực tiếp. Approve/reject chỉ nhận draft hoặc pending_review. Approved/rejected là trạng thái cuối của revision; muốn sửa tạo revision mới.
- Approve yêu cầu xác nhận đã đọc nguồn, aliases, năm lời đáp và cảnh báo; lưu người duyệt/thời điểm thật. **Approve không publish.**
- Publish chỉ nhận revision approved có metadata duyệt, nguồn hợp lệ, neutral answer và cả bốn lời đáp. Chỉ đổi `knowledge_questions.publishedVersionId`.
- Unpublish chỉ gỡ pointer hiện tại; không xóa revision hoặc đổi approved sang trạng thái khác. Có thể chọn revision approved cũ để publish lại; thao tác này được ghi audit.
- Sửa câu đang published không thay bản đang phục vụ; bản cũ vẫn dùng đến khi admin publish bản mới hoặc unpublish bản cũ.
- Mọi mutation cần lý do và `expectedVersion`. `managementVersion` tăng sau mỗi thao tác; stale request nhận 409, tránh ghi đè thao tác từ tab/admin khác.
- Revision/status, pointer, managementVersion và audit ghi trong **cùng Mongo transaction**, snapshot + majority. Audit thất bại thì rollback cả mutation. Không fallback sang ghi rời rạc khi DB không hỗ trợ transaction. Index chỉ được chuẩn bị khi mutation được admin yêu cầu, không trong GET/build/dry-run.
- Audit lưu action, question/revision, actor ID/email, thời điểm, lý do, trạng thái/pointer/version trước và sau, revision gốc và nhóm field đã sửa. Không có endpoint xóa audit/revision.
- Hash DOCX phải khớp nguồn đã pin; excerpt phải khớp manifest. Thiếu/sai nguồn thì khóa sửa/gửi duyệt/approve/publish; vẫn cho reject/unpublish dữ liệu DB để xử lý sự cố.

### Bất biến của chatbot

`/api/chat` và `/api/chat/answer` không đổi. Repository chat vẫn join **đúng revision được `publishedVersionId` trỏ tới**, cùng question ID/topic, `status=approved`, có reviewer/date và đủ nội dung. Draft, pending, rejected, approved chưa published, pointer sai hoặc thiếu lời đáp không được dùng để trả lời/gợi ý.

Không cache knowledge giữa request. Publish/unpublish được đọc lại từ DB; chọn suggestion và exact answer cũng kiểm tra lại revision. Alias trùng không tự trả lời mơ hồ; suggestions của Phase 2 giữ nguyên. Không gọi LLM.

## 4. API mới

Tất cả API dưới đây yêu cầu cookie đăng nhập admin. Response có `Cache-Control: no-store, private`, `Vary: Cookie`, `X-Content-Type-Options: nosniff`.

| Endpoint | Chức năng |
| --- | --- |
| `GET /api/admin/knowledge` | Danh sách DB; nếu rỗng hiển thị preview 40 draft |
| `GET /api/admin/knowledge?preview=1` | Xem trước draft revision 3, chỉ đọc |
| `GET /api/admin/knowledge/<id>` | Revision mới nhất, mọi revision, nguồn, warnings và audit |
| `GET /api/admin/knowledge/<id>?revision=<id>:v3` | Chọn revision cụ thể trong DB |
| `GET /api/admin/knowledge/<id>?preview=1` | Chi tiết draft trong file preview |
| `POST /api/admin/knowledge/<id>` | Một trong sáu action dưới đây |

Body mẫu (gửi từ UI cùng origin):

```json
{
  "action": "approve",
  "revisionId": "cmtt45-q001:v3",
  "expectedVersion": 0,
  "reason": "Ghi rõ kết quả đối chiếu nguồn và cảnh báo của người duyệt",
  "acknowledged": true
}
```

Action: `create_revision`, `submit`, `approve`, `reject`, `publish`, `unpublish`. `acknowledged: true` bắt buộc khi approve. `create_revision` cần `content` gồm chính xác `canonicalQuestion`, `aliases`, `approvedAnswer`, `characterAnswers` với đủ bốn canonical persona ID. API từ chối field lạ. `expectedVersion` lấy từ GET mới nhất, không hardcode 0 sau mỗi thao tác.

Thành công trả `{ revisionId, managementVersion }`. Lỗi `{ error, message }`: 400 input không hợp lệ, 401 chưa đăng nhập, 403 không phải admin/origin sai, 404 không tìm thấy, 409 chuyển trạng thái không hợp lệ hoặc dữ liệu đã đổi, 413 body quá lớn, 415 sai content type, 503 nguồn/DB/transaction chưa khả dụng. POST chỉ nhận JSON, kiểm tra stream tối đa 256 KiB và Origin; không bật CORS rộng.

Không có endpoint import, bulk approve/publish, xóa câu hỏi hay ghi status tùy ý.

## 5. Import — cần chủ dự án xác nhận trước khi apply

Từ thư mục dự án, dùng MongoDB/env hiện có và kiểm tra đúng môi trường đích:

```powershell
rtk proxy npm run knowledge:validate -- --file knowledge/draft-questions-phase-2-v3.json --report knowledge/review-report-phase-3.md
rtk proxy npm run knowledge:import:phase3 -- --dry-run
```

Script `knowledge:import:phase3` chọn file revision 3 và truyền `--required-version 3`. Importer từ chối version khác trước khi đọc/ghi DB, từ chối draft có metadata review, giữ quy trình idempotent/không ghi đè revision cũ. Không truyền `--apply` thì chỉ dry-run. File revision 1/2 không phải bộ cần import ở bước này.

**Lệnh sau chỉ là hướng dẫn cho bước được chủ dự án xác nhận; chưa chạy trong Phase 3:**

```powershell
rtk proxy npm run knowledge:import:phase3 -- --apply
```

Apply chỉ tạo logical question/revision draft, không approve/publish. Import có thể hoàn thành một phần nếu bị ngắt; xem report rồi dry-run lại trước khi retry. Không xóa collection hoặc sửa JSON thành approved để bỏ qua workflow. Sau import, kiểm tra số câu/revision rồi thực hiện rà soát thủ công trên admin.

## 6. Đăng nhập và duyệt 40 câu

1. Chạy ứng dụng như hiện tại (`npm run dev` hoặc build/start). Không cần khóa LLM. Kiểm tra MongoDB và cấu hình admin hiện có; không đưa bí mật vào báo cáo.
2. Mở `/admin/login` (chuyển về popup `/?auth=login`) và đăng nhập tài khoản khớp `ADMIN_EMAIL`/`ADMIN_PASSWORD` đã cấu hình. Không tạo tài khoản giả để duyệt.
3. Chọn **Kiến thức chatbot** ở sidebar hoặc mở `/admin/knowledge`.
4. Khi DB rỗng, trang hiển thị **40 bản nháp revision 3** ở chế độ xem trước. Có thể đọc/search/filter/đối chiếu; nút mutation không xuất hiện. Xem trước không import dữ liệu.
5. Sau khi được phép import, bấm **Kiểm tra dữ liệu đã import**. Mở từng câu; đọc canonical question/aliases, nguồn/excerpt/locators, neutral answer và bốn lời đáp.
6. Cần sửa thì tạo revision mới từ revision đang xem, nhập lý do. Lưu tạo draft mới, giữ bản cũ. Chọn lại revision mới để rà soát.
7. Chọn **Duyệt** hoặc **Từ chối**. Khi duyệt, xác nhận đã kiểm tra toàn bộ nội dung/cảnh báo và ghi lý do có ý nghĩa. Checkbox không thay cho kiểm tra nguồn thực tế.
8. Sau approve, chọn **Công bố** riêng và xác nhận. Đối chiếu badge phiên bản đang công bố và audit. Muốn rút nội dung khỏi chatbot, chọn đúng revision đang published rồi **Gỡ công bố**.
9. Lặp lại cho 40 câu; không có duyệt hàng loạt. Lịch sử revision hiển thị người tạo/người duyệt, thời gian, lý do từ chối; audit hiển thị tài khoản thao tác và thay đổi pointer.

Danh sách tìm kiếm câu hỏi/alias/mã không phân biệt dấu, lọc trạng thái revision mới nhất hoặc đang công bố. Câu có draft mới vẫn có thể đang dùng revision approved cũ; hai trạng thái hiển thị riêng.

## 7. Kiểm thử chatbot với dữ liệu thật đã được duyệt

Chỉ làm sau khi import được cho phép và admin đã tự rà soát/approve/publish ít nhất một câu. Popup chưa nối API trong Phase 3; kiểm tra backend theo Phase 2:

1. Mở online `/play/<ObjectId nhân vật>`, đợi quiz hiện có tạo phiên bình thường. Lấy `PublicQuestion.id` từ response `startQuizAction` trong DevTools Network. Không dùng `round` trên URL hoặc ID câu hỏi ABCD thay session ID.
2. Trong Console cùng trình duyệt/cookie và origin:

```javascript
const sessionId = 'PublicQuestion.id CỦA PHIÊN HIỆN TẠI';
await fetch('/api/chat', {
  method: 'POST', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, message: 'DÁN CANONICAL QUESTION ĐÃ PUBLISH' })
}).then(r => r.json());
```

3. Exact canonical/alias duy nhất phải trả `answered` với lời đáp của nhân vật server xác định từ phiên; thử cả bốn nhân vật. Không truyền `characterId` từ client.
4. Lỗi gõ gần đúng có thể trả `suggest`; chọn `questionId` qua `POST /api/chat/answer` với `{ sessionId, questionId }`. Câu ngoài phạm vi phải bị từ chối, không sinh dữ kiện mới.
5. Trên môi trường kiểm thử, xác nhận draft/rejected/approved chưa publish không trả lời; sau unpublish câu đó không còn trong knowledge index. Phiên sai/hết hạn hoặc khác cookie phải bị chặn. Quota Phase 2 vẫn áp dụng.

Chat thực tế ghi counter rate limit như chức năng hiện hữu. **Lần này không tạo phiên chơi hoặc gửi request chat hợp lệ lên production để kiểm thử.** Không lấy approval trong test làm approval nội dung thật.

## 8. Kết quả kiểm thử

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run knowledge:admin:test` | **13 unit tests đạt; 1 integration skip** vì chưa có `MONGODB_TEST_URI` |
| `node tests/knowledge-admin.browser.mjs` | Đạt: 40 dòng, search, preview chỉ đọc, modal giữa màn hình, checkbox duyệt, lỗi 409, payload revision mới, mobile không tràn ngang |
| Toàn bộ Node tests `tests/*.test.mjs` | **101 đạt, 5 lỗi baseline, 1 skip / 107 tests**; 23 test chatbot Phase 2 vẫn đạt |
| TypeScript | `tsc --noEmit` và TypeScript trong build đạt |
| ESLint file Phase 3 | Đạt |
| Full ESLint | 5 lỗi baseline loader test + 1 cảnh báo img; không có lỗi mới Phase 3 |
| `npm run build` | Đạt; 31 trang generate, routes admin knowledge/API được nhận diện; script PWA hiện hữu tạo 80 public assets |
| HTTP production build ở cổng riêng 3012 | **15 kiểm tra đạt**: 4 GET API và 6 POST action chưa đăng nhập nhận 401; 2 trang redirect login; 3 URL file riêng nhận 404 |
| MongoDB read-only | Kho knowledge rỗng, transaction được hỗ trợ; 0 writes |
| Server file tracing | Cả hai trang/hai API có DOCX/manifest/preview trong server traces; các file này không nằm trong `pwa-assets.json` |
| `git diff --check` | Đạt; chỉ thông báo LF/CRLF của file đã thay đổi từ trước |

Unit tests bao phủ approve/reject/publish/unpublish, draft mới, publish lại revision cũ, thiếu source/metadata/lời đáp, spoof reviewer/status, authorization service/HTTP, origin/body validation, DTO, CAS và transaction/audit. Approval/publication trong test chỉ thao tác trên **fixture tổng hợp**, không phải 40 câu lịch sử.

Browser test bundle component thật với fixture, mock navigation/API trên server tạm. Không đăng nhập application thật, không ghi auth session/knowledge production. Screenshots `.local/knowledge-ui/`: `list-desktop.png`, `confirm-desktop.png`, `detail-mobile.png`; đã xem kiểm tra bố cục, dấu tiếng Việt, modal/mobile. Server HTTP kiểm tra riêng đã dừng; không đổi cổng/server đang dùng.

### Integration MongoDB có ghi dữ liệu

`tests/knowledge-admin-mongo.test.mjs` chỉ chạy khi process có **`MONGODB_TEST_URI` của môi trường kiểm thử riêng**; không đọc `.env.local`, không fallback `MONGODB_URI`. Cần replica set/Atlas test có quyền tạo/xóa DB test. Không dùng URI production.

Test tạo DB ngẫu nhiên `codex_knowledge_test_<uuid>`, xác minh rỗng, seed fixture; kiểm tra transaction, audit rollback, stale version, hai mutation đồng thời và chat chỉ thấy approved+published. Cuối test chỉ xóa DB mang tên ngẫu nhiên này. Mongo standalone không hỗ trợ transaction thì skip rõ lý do.

Sau khi thiết lập biến môi trường test riêng bằng phương thức quản lý secrets của bạn:

```powershell
rtk proxy npm run knowledge:admin:test
```

Chưa có môi trường này nên **chưa xác nhận mutation integration trên MongoDB thật**. Khảo sát read-only cho thấy production hỗ trợ transaction không thay thế integration test.

### Lỗi baseline ngoài phạm vi

- 5 test `tests/auth.test.mjs` lỗi loader tìm `server/services/character.ts` qua dependency TTS hiện hữu, đã ghi trong Phase 2.
- Full ESLint: `no-assign-module-variable` ở `tests/character-images.test.mjs`, `character-questions.test.mjs`, `history-game.test.mjs`, `orders.test.mjs`, `support/load-typescript.mjs`; cảnh báo `<img>` ở `app/author/page.tsx`.
- Node 20.13.1; dependency TTS hiện hữu yêu cầu engine cao hơn như Phase 2. Không đổi TTS/dependencies lần này.

## 9. File tạo và thay đổi

**Tạo mới:**

- `app/admin/knowledge/page.tsx`
- `app/admin/knowledge/[id]/page.tsx`
- `app/admin/knowledge/error.tsx`
- `app/admin/knowledge/knowledge.css`
- `app/api/admin/knowledge/route.ts`
- `app/api/admin/knowledge/[id]/route.ts`
- `features/knowledge/knowledge-list.tsx`
- `features/knowledge/knowledge-detail.tsx`
- `server/domain/knowledge-admin.ts`
- `server/infrastructure/knowledge-admin-http.ts`
- `server/repositories/knowledge-admin.ts`
- `server/repositories/knowledge-source.ts`
- `server/services/knowledge-admin.ts`
- `tests/knowledge-admin.test.mjs`
- `tests/knowledge-admin-mongo.test.mjs`
- `tests/knowledge-admin.browser.mjs`
- `tests/support/knowledge-admin-fixture.mjs`
- `docs/chatbot-phase-3.md`

**Chỉnh file hiện hữu:**

- `server/models/knowledge.ts`: managementVersion, creator/based-on metadata, audit model.
- `features/admin/admin-frame.tsx`: tab/sidebar, title và search target knowledge.
- `scripts/import-knowledge.ts`: tùy chọn bắt buộc revision, kiểm tra trước kết nối DB.
- `package.json`: scripts import Phase 3/admin tests; không thêm dependency.
- `next.config.ts`: server tracing file nguồn riêng cho routes quản trị.
- `docs/chatbot-phase-2.md`, `docs/knowledge-pipeline.md`: liên kết báo cáo mới, giữ kết quả lịch sử của các phase trước.

**Artifacts local ignore:** báo cáo validate/import Phase 3; `.local/knowledge-phase3-readonly.ts`, `.local/knowledge-phase3-http.mjs`, screenshots/browser bundle. Không sửa draft revision 1/2/3, DOCX hoặc manifest. Giữ nguyên các thay đổi TTS/UI/PWA có sẵn; không commit/reset/revert.

## 10. Phần còn chờ

- Chủ dự án kiểm tra code/UI/báo cáo rồi quyết định cho phép import `--apply`. **Chưa chạy apply.**
- Quản trị viên rà soát 40 câu, 160 lời đáp, 18 cảnh báo rồi approve/publish từng revision. **Chưa có approval/publication thật.**
- Cần `MONGODB_TEST_URI` riêng để kiểm thử transaction, sau đó end-to-end với dữ liệu được người có quyền duyệt.
- Popup chưa nối API; không tự triển khai Phase 4 hoặc mở rộng gameplay.
- DOCX, manifest, preview là artifact riêng ignore trong Git. Khi triển khai phải cung cấp cho build/server bằng kênh artifact riêng. `outputFileTracingIncludes` đã kiểm tra hoạt động; không đặt chúng vào public. Thiếu/sai nguồn thì từ chối approve/publish.
- Review UI dùng source excerpt từ manifest đối chiếu DOCX; đọc toàn nguồn ngoài excerpt vẫn thuộc trách nhiệm reviewer. Không tự sửa nguồn mâu thuẫn.
- Mutation cần Mongo transaction; DB standalone không có đường tắt ghi rời rạc. Chưa deploy, chỉnh production env hoặc ghi production DB.

Phase 3 dừng tại đây để chủ dự án kiểm tra và quyết định bước tiếp theo.

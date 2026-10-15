# Phase 3A — Kiểm tra hạ tầng và chuẩn bị import snapshot v4

Ngày báo cáo: **15/10/2026**, múi giờ Asia/Bangkok. Trạng thái: **sẵn sàng về cấu trúc/kế hoạch import draft; chờ chủ dự án xác nhận ghi MongoDB**.

Không chạy `--apply`, approve, publish, đăng nhập tự động, tạo reviewer, tạo database hay sửa/xóa dữ liệu MongoDB. Không thay đổi API chatbot, quiz, QR, TTS, PWA hoặc nội dung lịch sử. Không triển khai giai đoạn tiếp theo.

## 1. Kết luận

- Kết nối đọc được database **`vo_danh`** theo cấu hình MongoDB hiện tại của workspace. Chưa có collection knowledge nào.
- Snapshot v4 có **59 logical questions**, gồm **19 revision v1, 22 revision v3 và 18 revision v4**. Tên snapshot v4 không đồng nghĩa tất cả record phải có `version: 4`.
- Validator: **59 record hợp lệ, 0 lỗi, 23 cảnh báo**. Dry-run thực tế: **59 revision thêm mới, 0 bỏ qua, 0 conflict, 0 alias collision**.
- Có thể import **dưới dạng draft** sau khi được xác nhận và dry-run lại ngay trước thao tác. Đây không phải kết luận nội dung lịch sử đã được duyệt.
- Hạ tầng admin hiện có hỗ trợ revision v4 trong MongoDB. Preview riêng vẫn là bộ v3; chưa đổi preview trong Phase 3A.
- Quyền ghi thực tế và transaction có ghi chưa được thử. Chưa có URI database test riêng. Không tuyên bố đã kiểm chứng end-to-end approve/publish trên MongoDB thật.

## 2. Tài liệu và mã đã rà soát

Đã đọc `CODEX_IMPLEMENTATION_GUIDE.md`, `docs/chatbot-phase-2.5.md`, `docs/knowledge-pipeline.md`, snapshot v4, toàn bộ review report v4 và change manifest, cùng quy tắc `.agents/rules/` và `RTK.md`. Đối chiếu snapshot v3, extraction manifest và SHA-256 của DOCX qua validator hiện có. Nội dung tự sinh trong review report v4 khớp hoàn toàn báo cáo validator mới; phần bổ sung Phase 2.5 giữ nguyên 18 cảnh báo cũ và quyết định giới hạn phạm vi N17/N18.

Các nhóm mã chính:

- Mongo: `lib/db/client.ts`, `server/models/knowledge.ts`.
- Import: `scripts/import-knowledge.ts`, `scripts/knowledge/common.ts`, `server/services/knowledge-import.ts`, `server/repositories/knowledge-import.ts`, validator.
- Admin: `app/admin/knowledge/`, `app/api/admin/knowledge/`, `features/knowledge/`, `server/domain/knowledge-admin.ts`, service/repository admin, source repository, HTTP adapter.
- Quyền: `server/services/account-session.ts`, `accounts.ts`, `admin-auth.ts`, `server/repositories/users.ts`.
- Runtime: `server/repositories/chat-knowledge.ts` và các unit test chatbot/admin/import.
- Đọc hướng dẫn environment variables của phiên bản Next.js cài trong `node_modules/next/dist/docs/` trước khi thêm script dùng `@next/env`.

Fingerprint đầy đủ của đầu vào được lưu trong [`knowledge/phase-3a-readiness.json`](../knowledge/phase-3a-readiness.json). SHA-256 snapshot v4:

```text
8b23eb5abc1092fbb0641716e0df820be4c955ef6df3977b870f2247c80d598b
```

## 3. MongoDB thực tế — chỉ đọc

Lần kiểm tra đầu: `2026-10-14T15:42:45.674Z` (22:42 ngày 14/10 tại Asia/Bangkok).
Lần kiểm tra sau: `2026-10-14T20:13:52.011Z` (03:13 ngày 15/10 tại Asia/Bangkok).

| Hạng mục | Trước | Sau |
| --- | ---: | ---: |
| Collection có tên bắt đầu bằng `knowledge` | 0 | 0 |
| Logical questions | 0 | 0 |
| Revisions | 0 | 0 |
| Approved revisions | 0 | 0 |
| Logical questions có publishedVersionId | 0 | 0 |
| Câu thực sự đọc được bằng repository chatbot | 0 | 0 |
| Revision trùng questionId/version hoặc ID sai định dạng liên kết | 0 | 0 |
| Revision mồ côi / published pointer hỏng | 0 / 0 | 0 / 0 |

`knowledge_questions`, `knowledge_question_revisions`, `knowledge_audit` và `knowledge_import_batches` **chưa tồn tại**; không phải đã tồn tại nhưng rỗng. Không có revision cũ hay published data để xung đột tại thời điểm khảo sát. Inventory revision trong báo cáo máy là `[]`.

Lệnh `hello` xác nhận topology hỗ trợ transaction. Kiểm tra này không chứng minh quyền ghi/index của credential. `MONGODB_TEST_URI` chưa được cấu hình; có cấu hình `ADMIN_EMAIL` và `ADMIN_PASSWORD` nhưng không đưa giá trị bí mật vào báo cáo.

Script dùng trực tiếp read repository, `listCollections`, `find`, `listIndexes`, `hello` và aggregation đọc published data. Không gọi helper tạo index. Đặc biệt không dùng authentication repository để khảo sát DB, vì các helper đọc tài khoản hiện có có thể khởi tạo index.

Hai bản kiểm kê trước/sau khớp về collections, counts, metadata, integrity và published state. Đây là quan sát trên database được cấu hình tại workspace; không suy rộng sang một deployment đang dùng URI/database khác.

## 4. Kết quả dry-run và thay đổi dự kiến

Báo cáo nguyên gốc từ importer: [`knowledge/import-report-phase-3a-v4.json`](../knowledge/import-report-phase-3a-v4.json). File có đầy đủ **59 action theo questionId/revisionId**, reason và toàn bộ cảnh báo.

```text
mode: dry-run
insert_draft: 59
skip: 0
conflict: 0
duplicateAliases: 0
writes: 0
approved: 0
published: 0
batchId: 4107700ed30396924e70ce453dc33a463fdbaaf120e44fc216cc2739a560d6f9
```

Nếu được phép apply và DB không thay đổi so với khảo sát:

| Collection / trạng thái | Thay đổi dự kiến |
| --- | --- |
| `knowledge_questions` | Thêm 59 logical records q001–q059, không có publishedVersionId |
| `knowledge_question_revisions` | Thêm 59 draft: 19 v1 + 22 v3 + 18 v4; không có metadata người duyệt |
| Tổng document mới | 118: 59 logical + 59 revision |
| Approved / published / runtime-readable | Vẫn 0 / 0 / 0 |
| `knowledge_audit` | Importer không ghi collection này; audit quản trị được tạo khi có thao tác quản trị sau này |
| `knowledge_import_batches` | Importer hiện không dùng collection này; batchId nằm trên revision và báo cáo cục bộ |
| Xóa/ghi đè revision, đổi published pointer | Không |

Apply sẽ tạo index unique `(questionId, version)`, index `(status, questionId)` cho revisions và `(topicId)` cho logical questions, ngoài index `_id` mặc định. **Chưa tạo các index/collection này trong Phase 3A.** Trường `writes` của importer đếm revision được chèn, không phải tổng document logical + revision.

**37 revision mới so với file v3 không phải số insert trên DB hiện tại.** Vì DB chưa có knowledge, cần thêm đủ 59. Nếu đã có chính xác 40 revision v3 thì test trong bộ nhớ cho kết quả 37 insert / 22 skip. Nếu đã có đầy đủ snapshot v4 giống hệt thì 0 insert / 59 skip.

Import snapshot chỉ nhập các revision trong file. Với DB rỗng, q001 chẳng hạn chỉ có v4; không tự tạo lại v1–v3. Các bản v3 cũ vẫn giữ nguyên trong file nguồn, nhưng không tự trở thành lịch sử MongoDB. Nếu cần lưu toàn bộ lịch sử trước v4 trong DB thì phải có kế hoạch import lịch sử riêng được xác nhận, không thực hiện ngầm.

## 5. Importer hiện có

Giữ nguyên importer; không cần sửa để hỗ trợ version hỗn hợp.

- `knowledge:import` là lệnh generic, **không ép version 3**. Shortcut `knowledge:import:phase3` mới cố định file v3 và `--required-version 3`; không sử dụng shortcut đó cho v4.
- Input phải là draft, không có reviewedBy/reviewedAt/rejectionReason. Cấm nhận dữ liệu approved/published qua import.
- Trùng ID/version và nội dung bất biến giống nhau: `skip`; không đổi review status hay published pointer. So sánh bao gồm canonical, aliases, normalized phrases, neutral, cả bốn persona, source locator/excerpt và review notes.
- Trùng ID/version nhưng nội dung khác, version bị dùng dưới ID khác, đổi topic hoặc đưa version mới thấp hơn/equal version đã có: `conflict`, dừng trước apply.
- Chèn revision bằng `insertOne`; logical dùng `$setOnInsert` nên không cập nhật pointer của record có sẵn. Unique index chặn chèn revision trùng khi chạy đồng thời.
- Dry-run chỉ đọc; chỉ nhánh `--apply` mới tạo index/chèn dữ liệu. Cờ `--apply` và `--dry-run` không được dùng cùng nhau.
- Import cả batch **không nằm trong một transaction**. Khi gián đoạn có thể còn một phần draft đã chèn; phải dry-run lại để xem các action rồi mới retry sau xác nhận. Nhánh skip có thể khôi phục logical record thiếu bằng `$setOnInsert` sau một lần import bị ngắt; không nhập lại revision.
- Importer lưu `importBatchId` và báo cáo cục bộ; không có audit event kiểu import trong `knowledge_audit`. Audit approve/reject/publish là luồng riêng. Nếu yêu cầu mọi import có actor audit thì đây là cải tiến cần làm riêng, không giả lập reviewer cho import hiện tại.

## 6. Danh sách cảnh báo còn mở

**23 cảnh báo trên 22 câu; 18 cảnh báo cũ vẫn cần duyệt.** Validator chỉ gắn cờ rà soát, không chứng thực lịch sử hay giải quyết mâu thuẫn nguồn.

| Nhóm | Số | Các câu |
| --- | ---: | --- |
| `DATES_REVIEW` | 9 | q002, q003, q017, q018, q019, q020, q028, q037, q058 |
| `QUAN_LENH` | 4 | q014, q022, q025, q026 |
| `LE_DUAN` | 6 | q023, q038, q039, q054, q057, q058 |
| `CAUSES` | 4 | q013, q031, q032, q033 |

Mọi ID trong bảng có tiền tố `cmtt45-`. Cảnh báo bổ sung so với bộ 18 cũ là q013/CAUSES, q054/LE_DUAN, q057/LE_DUAN và hai cảnh báo của q058.

- Mốc thời gian: phân biệt tuyên bố đầu hàng 15/8 và ký văn kiện 2/9; Hà Nội 19/8, Huế 23/8, Sài Gòn 25/8 và Tuyên ngôn 2/9. Đọc đúng sự kiện của từng câu, không áp mô tả chung thay đối chiếu nguồn.
- Quân lệnh số 1: phân biệt ban bố đêm 13/8 và việc Võ Nguyên Giáp đọc ngày 16/8 tại Tân Trào, đúng chủ thể/hành động.
- Lê Duẩn: phải đọc V.2, bảng V.5, đính chính sau bảng và IX.4 cùng nhau. q057/N17 và q058/N18 có giới hạn nguồn rõ ràng, cần duyệt đặc biệt; không tự coi cảnh báo đã đóng.
- Nguyên nhân thắng lợi: phân biệt chủ quan/khách quan, nghĩa aliases và vai trò tập thể; không bổ sung dữ kiện ngoài nguồn.

Các cảnh báo không chặn **lưu draft**; cần người quản trị xử lý/ghi nhận căn cứ trước approve và publish. Xem toàn văn từng warning trong dry-run JSON và [`knowledge/review-report-phase-3a-validation.json`](../knowledge/review-report-phase-3a-validation.json).

## 7. Admin, quyền và audit

| Thành phần | Kết quả rà soát |
| --- | --- |
| `/admin/knowledge` | Có danh sách, lọc canonical/aliases/trạng thái; DB chọn revision lớn nhất của mỗi logical question |
| `/admin/knowledge/[id]` | Canonical, aliases, neutral, bốn persona, nguồn/excerpt/locator, cảnh báo, lịch sử revisions và audit |
| `GET /api/admin/knowledge` | Danh sách DB; `?preview=1` đọc bộ preview riêng |
| `GET /api/admin/knowledge/[id]` | Chi tiết; hỗ trợ `?revision=cmtt45-q001:v4`, hoặc preview chỉ đọc |
| `POST /api/admin/knowledge/[id]` | Cùng endpoint nhận action `create_revision`, `submit`, `approve`, `reject`, `publish`, `unpublish` |
| Authentication / authorization | Session cookie phía server; bắt buộc tài khoản role admin. Chưa đăng nhập: 401 hoặc redirect login; user thường: 403 qua API |
| Reviewer | Lấy userId/email từ `currentAccount()`, không nhận actor/reviewer/status/pointer tự khai từ payload |
| Approve / reject | Chỉ draft/pending_review; approve cần xác nhận đã rà soát và nguồn/nội dung hợp lệ; reject bắt buộc lý do |
| Publish | Chỉ approved, có reviewer/thời điểm duyệt, nguồn hợp lệ; chưa approved bị từ chối |
| Chỉnh sửa | Tạo version lớn hơn mọi version hiện có; revision cũ và published pointer được giữ lại |
| Audit | Lưu actor thật, action, revision, lý do, trạng thái/pointer trước-sau trong cùng transaction với mutation |
| Đồng thời | expectedVersion/managementVersion chống ghi trên trạng thái cũ; transaction bảo vệ mutation + audit |
| HTTP | Kiểm tra Origin, JSON, giới hạn payload; response private/no-store; không lộ lỗi DB chi tiết |

Unit test mới xác nhận list nhận 59 bản version hỗn hợp không rơi vào preview, detail đọc/validate v4 và vẫn giữ v3 trong history khi DB có cả hai. Chưa chạy thao tác admin trên DB thật vì có thể ghi dữ liệu; đặc biệt login có thể provision tài khoản admin, tạo session, auth attempt và index.

Repository `/api/chat` vẫn chỉ đọc revision được `publishedVersionId` trỏ tới, cùng questionId, `status: approved`, metadata reviewer hợp lệ và đủ bốn lời đáp. Không chọn revision mới nhất chỉ vì version cao hơn. Đã chạy repository đọc này trên DB thực tế: **0 câu**. Import 59 draft không tự mở dữ liệu cho chatbot.

## 8. Vì sao preview vẫn v3; phương án dùng v4

Có bốn vị trí cố định:

1. `server/repositories/knowledge-source.ts`: đọc `knowledge/draft-questions-phase-2-v3.json`.
2. `previewPack()` trong `server/services/knowledge-admin.ts`: bắt buộc đúng 40 record, mọi record version 3 và draft.
3. `features/knowledge/knowledge-list.tsx`, `knowledge-detail.tsx`: nhãn xem trước/import ghi revision 3.
4. `next.config.ts`: file tracing cho admin/API include file v3.

Vì DB rỗng, `/admin/knowledge` tự vào preview. Đổi riêng đường dẫn JSON sang v4 sẽ **không đủ**: guard 40/v3 sẽ từ chối snapshot 59 bản hỗn hợp.

Phương án hiện có sau import được xác nhận: mở `/admin/knowledge` **không có `preview=1`**. Trang sẽ đọc 59 logical questions từ DB và hiển thị các revision draft của snapshot v4. Published data không thay đổi.

Nếu muốn xem v4 trước khi import, đề xuất giai đoạn sửa preview riêng: chọn snapshot từ danh sách cho phép trên server; validate toàn bộ draft/source nhưng không ép mọi version bằng 4; đổi nhãn thành tên snapshot và số bản thực tế; thêm file v4 vào tracing; giữ preview chỉ đọc/admin-only. Không nhận đường dẫn file tùy ý từ client, không đặt draft trong `public/`, không đổi repository `/api/chat`. **Chưa triển khai phương án này trong Phase 3A.**

## 9. Kiểm thử

| Kiểm tra | Kết quả |
| --- | --- |
| Validator v4, đối chiếu DOCX bằng Python | 59 hợp lệ, 0 lỗi, 23 cảnh báo |
| Importer dry-run trên MongoDB cấu hình | 59 insert dự kiến, 0 skip, 0 conflict, 0 writes |
| 7 test mới `knowledge-v4-import.test.mjs` | 7 pass |
| Toàn bộ `tests/*.test.mjs` | **130 test: 124 pass, 5 fail, 1 skip** |
| TypeScript `tsc --noEmit` | Pass |
| ESLint hai file code/test mới | Pass |
| Mongo integration có ghi | Skip: chưa có `MONGODB_TEST_URI` riêng |
| Read-only inventory trước/sau | Không thay đổi knowledge state |

5 lỗi đều ở `tests/auth.test.mjs`: đăng ký, đăng nhập, quên mật khẩu, token hết hạn và rate limit. Cùng nguyên nhân loader test báo `ENOENT server/services/character.ts` khi resolve dependency qua speech/character-question. Đây là nhóm lỗi đã được ghi ở Phase 2.5, không phải lỗi mới từ importer. Giữ nguyên phần auth/TTS ngoài phạm vi; không tuyên bố toàn suite đạt. Log cục bộ: `.local/phase-3a-unit-tests.log`.

7 test mới gồm mixed-version validation, DB rỗng, import lại giống hệt, baseline v3, content/ID/topic/version conflict, admin list và admin detail/history v4. Toàn bộ fixture Mongo nằm trong bộ nhớ; không tạo reviewer trong database.

Không chạy các browser test có ghi dữ liệu. Không chạy build trong Phase 3A; các kiểm tra yêu cầu ở đây là TypeScript, unit tests và dry-run, và không có thay đổi app runtime.

## 10. Lệnh chạy và điều kiện trước import

Chạy từ `D:\UI_Web_Tinh\vo-danh`. Dùng importer trực tiếp, không dùng shortcut ép v3, không truyền `--required-version 4` vì snapshot có version 1/3/4.

Kiểm tra chỉ đọc có thể lặp lại:

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/inspect-knowledge-readonly.ts --report knowledge/phase-3a-mongo-recheck.json
rtk proxy node --import tsx scripts/validate-knowledge.ts --file knowledge/draft-questions-phase-2-v4.json --report knowledge/review-report-phase-3a-validation.md
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --dry-run --file knowledge/draft-questions-phase-2-v4.json --report knowledge/import-report-phase-3a-v4.json
```

**Lệnh apply dưới đây chỉ để chủ dự án xem/xác nhận; chưa chạy:**

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --apply --file knowledge/draft-questions-phase-2-v4.json --report knowledge/import-report-phase-3a-v4-apply.json
```

Trước apply cần xác nhận đây đúng database đích `vo_danh`, chấp nhận nhập snapshot draft thay vì tự dựng lịch sử cũ, và chạy lại validation/dry-run nếu dữ liệu hoặc DB đã thay đổi. Chỉ tiếp tục khi không có conflict. Quyền ghi/tạo index của credential chưa được kiểm chứng bằng một thao tác ghi và không được thử trên production trong giai đoạn này.

23 cảnh báo vẫn phải được quản trị viên rà soát trước duyệt/publish; việc lưu draft không giải quyết các cảnh báo. URI test riêng là điều kiện để chạy integration có ghi, không được lấy URI production làm fallback hoặc tự tạo test DB trên production.

Sau khi import được xác nhận và thực hiện ở lượt sau: đối chiếu số record, chạy dry-run lại để kiểm tra skip đủ 59, mở trang admin để review; không tự approve/publish. Nếu import bị gián đoạn, kiểm kê/dry-run lại rồi xin xác nhận kế hoạch retry, không xóa dữ liệu để làm lại.

## 11. Cách truy cập admin

- Website theo cấu hình `NEXT_PUBLIC_APP_URL`: **https://vodanh.dpdns.org/admin/knowledge**. Điều này là đường dẫn cấu hình, chưa phải xác nhận deployment đó đang chạy cùng code/DB với workspace.
- Khi chạy local bằng `rtk proxy npm run dev`: **http://localhost:3001/admin/knowledge**.
- Nếu chưa đăng nhập, ứng dụng chuyển về `/?auth=login`. Dùng `ADMIN_EMAIL` và `ADMIN_PASSWORD` đang cấu hình trên server; không đăng ký reviewer giả. Đăng nhập xong vào mục **Kho kiến thức** hoặc mở trực tiếp URL trên.
- Trước import, trang hiện preview 40 bản v3. Sau import snapshot v4, URL không có `preview=1` hiện 59 câu trong MongoDB. `?preview=1` vẫn là preview v3 cho đến khi có thay đổi preview riêng.

## 12. File mới và phạm vi thay đổi

Code/test mới:

- `scripts/inspect-knowledge-readonly.ts`: kiểm kê chỉ đọc, không có chế độ mutation; không ghi URI hoặc credential vào báo cáo.
- `tests/knowledge-v4-import.test.mjs`: 7 test cho snapshot v4, idempotency/conflicts và admin v4.

Báo cáo mới:

- `docs/chatbot-phase-3a.md` — tài liệu này.
- `knowledge/import-report-phase-3a-v4.json` — dry-run từ importer hiện có.
- `knowledge/phase-3a-readiness.json` — tổng hợp machine-readable, fingerprints và giới hạn kiểm chứng.
- `knowledge/phase-3a-mongo-before.json`, `knowledge/phase-3a-mongo-after.json` — trạng thái Mongo chỉ đọc.
- `knowledge/review-report-phase-3a-validation.md`, `.json` — kết quả validator, không ghi đè report v4.
- `.local/phase-3a-unit-tests.log` — log unit test cục bộ.

Không sửa importer, service/API/UI đang chạy, cấu hình môi trường hoặc dữ liệu v3/v4. Các JSON/review report knowledge nằm trong đường dẫn private đang được gitignore theo quy ước dự án; không tự force-add, không đưa vào public assets. Giữ nguyên các thay đổi có sẵn ngoài Phase 3A.

**Dừng ở đây để chủ dự án kiểm tra và xác nhận trước mọi thao tác ghi MongoDB.**

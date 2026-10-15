# Phase 3B — Import snapshot v4 vào MongoDB

Hoàn thành ngày **15/10/2026**, múi giờ Asia/Bangkok. Chủ dự án đã xác nhận cho phép nhập 59 revision draft vào database `vo_danh` để demo. **Đã import thành công một lần; không approve/publish và không thực hiện Phase 3C.**

## Kết quả

| Kiểm tra | Kết quả thực tế |
| --- | ---: |
| Database | `vo_danh` |
| Logical questions | 59 |
| Revisions | 59 |
| Draft revisions | 59 |
| Version 1 / 3 / 4 | 19 / 22 / 18 |
| Revision approved | 0 |
| Logical record có trường `publishedVersionId`, kể cả null | 0 |
| Revision có metadata reviewedBy/reviewedAt/rejectionReason | 0 |
| Revision mồ côi | 0 |
| Logical question không có revision | 0 |
| Duplicate questionId/version hoặc revision ID không khớp | 0 |
| Nội dung revision khớp snapshot v4 | 59/59 |
| Revision khớp importBatchId | 59/59 |
| Câu chatbot được phép đọc qua published repository | 0 |

Post-import dry-run: **0 insert, 59 skip, 0 conflict, 0 writes**. Trang admin và API đã đọc dữ liệu MongoDB, `preview: false`; HTML trang danh sách render đủ 59 liên kết câu hỏi.

## 1. Tài liệu và xác nhận môi trường trước import

Đã đọc lại guide triển khai, báo cáo Phase 3A, knowledge pipeline, snapshot v4, báo cáo dry-run Phase 3A và review report v4. Đọc lại importer, repository, connection và các quy tắc dự án. Fingerprint của 9 đầu vào được ghi ở `knowledge/phase-3a-readiness.json` đều không đổi, gồm nguồn DOCX, manifest, snapshot v3/v4 và các tài liệu liên quan.

Môi trường thao tác là workspace `D:\UI_Web_Tinh\vo-danh`, nạp `.env.local` bằng `@next/env`, không có file `.env.production`/`.env.development` được nạp bổ sung trong lần preflight. Cấu hình đích:

- `MONGODB_DB_NAME=vo_danh`; database thực tế driver trả về cũng là `vo_danh`.
- `NEXT_PUBLIC_APP_URL=https://vodanh.dpdns.org`, khớp Phase 3A.
- Kiểm kê lúc `2026-10-14T20:21:29.102Z` (03:21 ngày 15/10 tại Asia/Bangkok): **không có collection knowledge**, 0 logical questions, 0 revisions, 0 approved/published. Các chỉ tiêu khớp Phase 3A, không có dấu hiệu thay đổi bất thường.
- Topology hỗ trợ transaction. Không đổi URI, quyền DB, cấu hình mạng hoặc tạo database mới.

Thông tin môi trường không chứa credential được lưu trong [`phase-3b-environment.json`](../knowledge/phase-3b-environment.json). Có fingerprint host MongoDB cho lần này, không ghi URI/host thô/mật khẩu. Phase 3A không lưu fingerprint host nên không khẳng định đã đối chiếu vật lý cluster bằng checksum cũ; việc xác nhận dựa trên cấu hình workspace, tên DB thực tế và trạng thái knowledge.

Snapshot v4 SHA-256:

```text
8b23eb5abc1092fbb0641716e0df820be4c955ef6df3977b870f2247c80d598b
```

## 2. Validation và dry-run trước ghi

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/inspect-knowledge-readonly.ts --report knowledge/phase-3b-mongo-before.json
rtk proxy node --import tsx scripts/validate-knowledge.ts --file knowledge/draft-questions-phase-2-v4.json --report knowledge/review-report-phase-3b-validation.md
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --dry-run --file knowledge/draft-questions-phase-2-v4.json --report knowledge/import-report-phase-3b-preflight.json
```

Kết quả: **59 record hợp lệ, 0 lỗi, 23 cảnh báo**. Toàn bộ action, batchId, warnings và duplicateAliases khớp báo cáo Phase 3A: 59 insert dự kiến, 0 skip, 0 conflict, 0 alias collision. Cổng kiểm tra tên DB, input fingerprints và đối chiếu Phase 3A đã đạt trước khi chạy apply.

23 cảnh báo lịch sử vẫn mở: 9 `DATES_REVIEW`, 4 `QUAN_LENH`, 6 `LE_DUAN`, 4 `CAUSES`, trên 22 câu. Không đóng 18 cảnh báo cũ; q057/N17 và q058/N18 vẫn cần rà soát đặc biệt. Import draft không xác nhận tính đúng đắn lịch sử hoặc nghĩa tương đương của aliases.

## 3. Lệnh apply đã thực hiện

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --apply --file knowledge/draft-questions-phase-2-v4.json --report knowledge/import-report-phase-3b.json
```

Dùng đúng importer, input và chế độ apply đã nêu trong Phase 3A; chỉ đổi tên file report sang tên Phase 3B theo yêu cầu. Không dùng shortcut ép revision 3, không truyền `--required-version 4`, không sửa importer.

Process kết thúc với **exit code 0**:

```json
{
  "mode": "apply",
  "insertsPlanned": 59,
  "skips": 0,
  "writes": 59,
  "approved": 0,
  "published": 0,
  "report": "knowledge/import-report-phase-3b.json"
}
```

`writes: 59` đếm revision được chèn. Thay đổi knowledge thực tế là **59 logical documents + 59 revision documents = 118 documents** trong hai collection mới thuộc database `vo_danh` đang có:

- `knowledge_questions` — 59 logical records.
- `knowledge_question_revisions` — 59 draft records, nội dung nguyên vẹn từ snapshot.

Index đã tạo theo importer: unique `(questionId, version)`, `(status, questionId)` và logical `(topicId)`, cùng các index `_id` mặc định. Không ghi đè revision, không xóa record, không sửa published pointer, không tạo review metadata.

BatchId:

```text
4107700ed30396924e70ce453dc33a463fdbaaf120e44fc216cc2739a560d6f9
```

Không có lỗi giữa chừng, không retry apply. Vì DB ban đầu chưa có knowledge, mỗi logical question hiện có đúng **một** revision từ snapshot; không dựng thêm lịch sử v1–v3 cho các câu đang ở v4. File lịch sử v3 vẫn giữ nguyên.

Importer không tạo event `knowledge_audit`: provenance của import là batchId, snapshot và báo cáo apply này. Chưa có thao tác quản trị kiến thức nên chưa có reviewer hoặc audit approve/publish. Đây là hành vi importer đã được ghi nhận ở Phase 3A.

## 4. Kiểm tra sau import và idempotency

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/inspect-knowledge-readonly.ts --report knowledge/phase-3b-mongo-after.json
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --dry-run --file knowledge/draft-questions-phase-2-v4.json --report knowledge/import-report-phase-3b-postflight.json
rtk proxy node --conditions=react-server --import tsx .local/phase3b-verify.ts
```

Kiểm kê ngay sau import lúc `2026-10-14T20:22:27.159Z` cho kết quả ở bảng đầu báo cáo. Dry-run sau đó nhận đủ **59 skip, 0 insert, 0 conflict**; nhánh dry-run không ghi dữ liệu.

Xác minh sâu sau kiểm tra admin lúc `2026-10-14T20:25:31.952Z` (03:25 ngày 15/10): đối chiếu ID, topic, version, toàn bộ nội dung bất biến, aliases, bốn persona, source và review notes của **từng revision** với snapshot; kiểm tra batchId; xác nhận hoàn toàn không tồn tại trường published/reviewer; kiểm tra cả hai chiều logical↔revision và unique index. Mọi kiểm tra đạt.

Repository runtime trả về 0 câu, đúng yêu cầu chỉ đọc approved + published. Dữ liệu đã sẵn sàng để admin rà soát/demo quản trị, **chưa được dùng để trả lời lịch sử cho người chơi**.

## 5. Trang `/admin/knowledge` đọc MongoDB

Đã kiểm tra trên ứng dụng thật tại `http://localhost:3001`, sử dụng đăng nhập bình thường bằng tài khoản admin đang cấu hình. Không mock authentication, không tạo reviewer giả và không gửi mutation tới API knowledge.

| Request | HTTP | Kiểm tra |
| --- | ---: | --- |
| `GET /api/admin/knowledge` | 200 | `preview: false`, 59 items, tất cả draft/unpublished; phân bố version 19/22/18 |
| `GET /admin/knowledge` | 200 | HTML render 59 liên kết câu hỏi, không có banner “Đang xem trước” |
| `GET /api/admin/knowledge/cmtt45-q001` | 200 | v4, draft, preview false, 0 lỗi validation, 0 audit |
| `GET /api/admin/knowledge/cmtt45-q004` | 200 | v3, draft, preview false, 0 lỗi validation, 0 audit |
| `GET /api/admin/knowledge/cmtt45-q041` | 200 | v1, draft, preview false, 0 lỗi validation, 0 audit |

Phiên kiểm tra đã được logout thành công. Luồng đăng nhập hiện hữu có thể cập nhật tài khoản admin cấu hình, auth attempt, session và các index tài khoản; đây là tác động của đăng nhập/đăng xuất bình thường, không phải thao tác duyệt kiến thức. Không ghi mật khẩu, token hay response tài khoản vào báo cáo.

Không có browser khả dụng trong phiên công cụ, nên kết quả UI là kiểm chứng **HTTP có xác thực và HTML server-rendered**, không phải ảnh chụp/kiểm tra bố cục bằng browser. Không kiểm thử deployment public như một môi trường riêng.

Mở `http://localhost:3001/admin/knowledge` khi chạy local. URL cấu hình public là `https://vodanh.dpdns.org/admin/knowledge`; deployment đó phải dùng cùng DB để thấy kết quả. Nếu chưa đăng nhập, trang chuyển về `/?auth=login`.

Không thêm `?preview=1` khi xem dữ liệu đã import. Chế độ preview được yêu cầu tường minh vẫn dùng file v3 theo thiết kế hiện tại; Phase 3B không đổi tính năng preview.

## 6. Kiểm thử bổ sung

- 54/54 unit tests importer, admin và chatbot đạt; không có fixture được ghi vào MongoDB.
- `rtk proxy npx tsc --noEmit`: đạt.
- ESLint hai script kiểm tra cục bộ mới: đạt.
- Validator, apply, hai dry-run và post-import assertions: đạt.
- Không chạy lại toàn bộ suite ngoài phạm vi; 5 lỗi loader auth từ Phase 3A vẫn là vấn đề đã ghi nhận, không tuyên bố đã sửa chúng.
- Không chạy Mongo integration có mutation vì chưa có database test riêng. Đợt import thật và các kiểm tra đọc sau đó được mô tả rõ ở trên.
- Không build/deploy lại ứng dụng; không đổi mã runtime hoặc PWA assets.

Lệnh unit test đã chạy:

```powershell
rtk proxy node --test tests/knowledge-v4-import.test.mjs tests/knowledge.test.mjs tests/knowledge-admin.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-dialogue.test.mjs
```

## 7. Artifact của Phase 3B

- [`knowledge/import-report-phase-3b.json`](../knowledge/import-report-phase-3b.json): báo cáo apply, đủ 59 action và 23 cảnh báo.
- [`knowledge/phase-3b-mongo-after.json`](../knowledge/phase-3b-mongo-after.json): inventory Mongo sau import, indexes, counts và metadata tất cả revisions.
- [`knowledge/phase-3b-verification.json`](../knowledge/phase-3b-verification.json): kết quả đối chiếu từng record và các bất biến sau kiểm tra admin.
- [`knowledge/import-report-phase-3b-preflight.json`](../knowledge/import-report-phase-3b-preflight.json): dry-run trước ghi.
- [`knowledge/import-report-phase-3b-postflight.json`](../knowledge/import-report-phase-3b-postflight.json): 59 skip sau ghi.
- [`knowledge/phase-3b-admin-http.json`](../knowledge/phase-3b-admin-http.json): bằng chứng page/API đọc MongoDB.
- `knowledge/phase-3b-mongo-before.json`, `knowledge/phase-3b-environment.json`: trạng thái/môi trường trước import.
- `knowledge/review-report-phase-3b-validation.md`, `.json`: validator, giữ nguyên báo cáo và nội dung Phase 2.5/3A.
- `.local/phase3b-admin-http.mjs`, `.local/phase3b-verify.ts`: script kiểm tra cục bộ; không đưa vào runtime/deploy.
- `docs/chatbot-phase-3b.md`: báo cáo này.

Các artifact knowledge/draft vẫn ở đường dẫn private theo gitignore hiện có. Không sửa quiz, QR, TTS, PWA, thanh toán, API chatbot hoặc nội dung lịch sử. Không thay đổi revision có sẵn vì DB knowledge ban đầu rỗng; giữ nguyên các thay đổi mã nguồn ngoài phạm vi.

**Dừng sau Phase 3B. Việc xử lý cảnh báo, approve/publish và Phase 3C cần yêu cầu tiếp theo của chủ dự án.**

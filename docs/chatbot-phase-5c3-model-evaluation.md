# Phase 5C.3A — Gemini Model Evaluation

Ngày đánh giá: 16/10/2026. Phạm vi: development, đánh giá khả năng thay thế model trong kiến trúc Phase 5C hiện tại.

## Kết luận

Đã thực hiện đúng **6 generation calls mới, không retry**, chia đều hai ca cho ba model. `gemini-3.5-flash-lite` trả kết quả đúng và đúng JSON Schema 2/2; `gemini-3.1-flash-lite` 1/2; `gemini-3.8-flash` 0/2. Ba lần thất bại đều trả HTTP 504 với `DEADLINE_EXCEEDED`.

Đề xuất **giữ model 3.5 Flash-Lite cho demo hiện tại**, chưa đổi cấu hình. Đây là quyết định thận trọng từ mẫu nhỏ, **không phải chứng minh 3.5 ổn định nhất**. Sáu lỗi 504 trong chín lượt Phase 5C.2 vẫn là bằng chứng bất ổn cần tính đến. Chưa có đủ bằng chứng để chỉ định model dự phòng tự động; 3.1 Flash-Lite là ứng viên kiểm thử tiếp, chưa được coi là phương án dự phòng tin cậy.

Kết quả máy đọc: [chatbot-phase-5c3-model-results.json](chatbot-phase-5c3-model-results.json).

## 1. Hệ thống và phạm vi đã đọc

- `docs/chatbot-phase-5c.md`, `docs/chatbot-phase-5c1.md`, `docs/chatbot-phase-5c2-demo-report.md` và các báo cáo test/benchmark liên quan.
- Matcher `server/infrastructure/gemini-question-matcher.ts`, bộ phân loại lỗi `gemini-errors.ts`, cấu hình `server/services/chat-ai-config.ts`, orchestration `chat-ai-matching.ts`, retrieval `chat-ai-candidates.ts`, matcher truyền thống, schema/prompt `server/domain/chat-ai.ts`.
- Repository cache/quota, benchmark hiện có, quy tắc `.agents/rules/` và RTK.

Harness gọi trực tiếp **matcher hiện có**, chỉ truyền model khác trong cấu hình của từng phép thử; không sửa production matcher hoặc ghi biến môi trường. Đây là phép so sánh model độc lập với cache ứng dụng, không phải chạy lại E2E `/api/chat`. Cache hit không được tính thành generation thành công. Quota ứng dụng được đọc để kiểm tra giới hạn; mỗi lượt được ghi vào ledger local riêng, không cập nhật hay reset quota MongoDB.

## 2. Free Tier và quyền truy cập

Đã đối chiếu [pricing chính thức](https://ai.google.dev/gemini-api/docs/pricing) và [danh sách model](https://ai.google.dev/gemini-api/docs/models). Ba model được chọn có Standard Free Tier, không dùng Batch hoặc tính năng trả phí bổ sung. Chủ dự án xác nhận project đang Free Tier và chưa liên kết billing trước khi gọi generation. Không suy ra billing tier từ HTTP 200; không có phép xác minh billing bằng API trong đợt này.

| Model ID | Free Tier theo tài liệu | Release | Metadata `generateContent` với key hiện tại | Generation xác minh trong đợt này | Structured Outputs | Quota provider thực tế |
| --- | --- | --- | --- | --- | --- | --- |
| `gemini-3.5-flash-lite` | Có | Stable | Có, models.list HTTP 200 | Có, 2 HTTP 200 | Tài liệu hỗ trợ; live 2/2 hợp lệ | Chưa xác minh RPM/TPM/RPD |
| `gemini-3.1-flash-lite` | Có | Stable | Có, models.list HTTP 200 | Có, 1 HTTP 200 | Tài liệu hỗ trợ; live 1/2 hợp lệ, 1 lỗi API | Chưa xác minh RPM/TPM/RPD |
| `gemini-3.8-flash` | Có | Stable | Có, models.list HTTP 200 | Chưa có generation thành công; 2 HTTP 504 | Tài liệu hỗ trợ; chưa xác minh thành công live | Chưa xác minh RPM/TPM/RPD |

Thông tin release và khả năng Structured Outputs được kiểm tra tại datasheet [3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash).

`models.list` xác nhận metadata truy cập được, không chứng minh generation thành công hoặc quota còn lại. Không kiểm thử lại 2.5 sau lỗi 404 ở phase trước. Không dùng model Paid Tier-only, không thay đổi billing. Không có bằng chứng lỗi quota hoặc billing trong sáu lượt này.

Theo [rate limits chính thức](https://ai.google.dev/gemini-api/docs/rate-limits), quota áp dụng theo project; RPD reset theo giờ Pacific. Giới hạn thực tế cần xem trong AI Studio. Giới hạn ứng dụng hiện tại 5 lượt/phút và 100 lượt/ngày là cơ chế nội bộ, **không phải quota Google đã xác minh**; ngày quota nội bộ tính theo UTC. Không khẳng định rằng sáu lượt đã đo cho phép suy ra quota project.

## 3. Benchmark offline và tính công bằng

Đã chuẩn bị **24 câu** từ fixture benchmark hiện có, trước mọi generation của đợt này:

| Nhóm chính trong fixture | Số ca |
| --- | ---: |
| Cách diễn đạt tự nhiên / paraphrase | 3 |
| Ngày tháng | 4 |
| Sai chính tả | 3 |
| Không dấu | 4 |
| Phủ định | 4 |
| Địa danh Hà Nội, Huế, Sài Gòn | 3 |
| Đảo trật tự từ | 1 |
| Ngoài phạm vi | 2 |

Không có câu trùng canonical/alias sau normalization. Ba nhãn `5c-027`, `5c-028`, `5c-115` còn cần rà soát và bị loại khỏi điểm số; không tự duyệt dữ kiện lịch sử hoặc nhãn chưa chắc chắn. Còn 21 ca chấm điểm, gồm 19 ca có questionId kỳ vọng và hai ca ngoài phạm vi.

- Legacy top-1: **6/21 = 28,57%**. Công thức: số ID đứng đầu (hoặc null nếu không có gợi ý) bằng nhãn / số ca được chấm. Đây không phải tỷ lệ chatbot tự trả lời đúng; fuzzy vẫn chỉ là gợi ý.
- Candidate recall: **19/19 = 100%**. Công thức: số ca có ID kỳ vọng nằm trong tối đa tám candidates / số ca có ID kỳ vọng. Recall này chỉ đo retrieval, không đo Gemini hoặc toàn bộ 59 câu.
- Không chạy 24 câu live: ngân sách chỉ đủ hai ca/model. Các nhóm không dấu, typo, phủ định, Huế/Sài Gòn dạng câu lịch sử chỉ được chuẩn bị/đánh giá retrieval offline trong đợt này.

Đóng băng prompt, JSON Schema, snapshot Published index, danh sách candidates có thứ tự và payload SHA-256. Mỗi ca dùng **cùng candidates theo cùng thứ tự cho cả ba model**; hai câu khác nhau có candidate list khác nhau theo retrieval hiện tại. Candidate payload chỉ gồm ID, canonical và aliases; không gửi persona answer, cookie hay dữ liệu cá nhân. Báo cáo không lưu raw prompt hoặc API key.

Hai ca live cố định:

1. `5c-033`: “Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?” → `cmtt45-q017`. Candidate đầu là câu Huế (`q018`), có cả Sài Gòn (`q019`), giúp phát hiện chọn nhầm địa danh.
2. `5c-101`: “Ngày mai trời ở Huế có mưa không?” → `no_match`, questionId null. Không được chọn câu lịch sử chỉ vì có từ Huế.

Thứ tự round 1: 3.5 → 3.1 → 3.8; round 2 đảo lại: 3.8 → 3.1 → 3.5. Chạy tuần tự, không retry ca lỗi, không đổi timeout. Đảo thứ tự giúp giảm một phần ảnh hưởng thời điểm, không loại bỏ được nhiễu từ tải API.

## 4. Request và sáu kết quả live

- SDK `@google/genai@2.30.0`, API `v1beta`, timeout **5000 ms**, SDK attempts **1**.
- Giữ prompt Phase 5C, `responseMimeType: application/json`, `responseJsonSchema: CHAT_AI_SCHEMA`, temperature 0, maxOutputTokens 256.
- Schema gồm `decision` (`match`/`no_match`), `questionId` (string/null), `confidence` (0..1), `reason`; parser hiện có kiểm tra ID thuộc candidates.
- Không tinh chỉnh thinking riêng cho từng model. Khác biệt mặc định của model có thể ảnh hưởng thời gian và ngân sách output; đây là so sánh khả năng dùng ngay với request hiện tại, không phải hiệu năng tối ưu sau tuning.

| Lượt | Model | Ca | HTTP | Latency ms | JSON / schema | Kết quả | So với nhãn |
| ---: | --- | --- | ---: | ---: | --- | --- | --- |
| 1 | 3.5 Flash-Lite | 033 | 200 | 2946 | Hợp lệ / hợp lệ | `match`, `cmtt45-q017` | Đúng |
| 2 | 3.1 Flash-Lite | 033 | 504 | 4119 | Không có output hợp lệ | `DEADLINE_EXCEEDED` | Không chấm được nội dung |
| 3 | 3.8 Flash | 033 | 504 | 4930 | Không có output hợp lệ | `DEADLINE_EXCEEDED` | Không chấm được nội dung |
| 4 | 3.8 Flash | 101 | 504 | 3918 | Không có output hợp lệ | `DEADLINE_EXCEEDED` | Không chấm được nội dung |
| 5 | 3.1 Flash-Lite | 101 | 200 | 1426 | Hợp lệ / hợp lệ | `no_match`, null | Đúng |
| 6 | 3.5 Flash-Lite | 101 | 200 | 2897 | Hợp lệ / hợp lệ | `no_match`, null | Đúng |

Không ghi nhận HTTP 404/429/500/503, lỗi permission/key hoặc response schema bị từ chối. Không chuyển model lỗi sang Paid Tier. Ledger mới đã đủ 6/6; không chạy thêm generation.

## 5. Các chỉ số

Success = HTTP 200 và schema hợp lệ / tất cả lượt thử. Accuracy toàn lượt = decision/ID đúng / tất cả lượt thử; lỗi API vẫn nằm trong mẫu số, nhưng không bị mô tả là chọn sai lịch sử. Accuracy có điều kiện chỉ tính phản hồi hợp lệ. JSON validity được báo riêng cho toàn lượt và riêng HTTP 200.

| Model | Success | Đúng / toàn lượt | Đúng / phản hồi hợp lệ | JSON hợp lệ / toàn lượt | JSON hợp lệ / HTTP 200 | HTTP 504 |
| --- | --- | --- | --- | --- | --- | ---: |
| 3.5 Flash-Lite | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 | 2/2 | 0 |
| 3.1 Flash-Lite | 1/2 (50%) | 1/2 (50%) | 1/1 (100%) | 1/2 | 1/1 | 1 |
| 3.8 Flash | 0/2 (0%) | 0/2 (0%) | N/A | 0/2 | N/A | 2 |

| Model | P50/P95 tất cả lượt (ms) | P50/P95 lượt thành công (ms) |
| --- | --- | --- |
| 3.5 Flash-Lite | 2897 / 2946 | 2897 / 2946 |
| 3.1 Flash-Lite | 1426 / 4119 | 1426 / 1426 |
| 3.8 Flash | 3918 / 4930 | N/A |

Percentile dùng nearest rank `ceil(p × n)` trên dữ liệu đã sắp xếp. Với n=2, P50 là giá trị nhỏ hơn và P95 là giá trị lớn hơn, không phải ước lượng tail latency tin cậy. Không có mẫu thành công được biểu diễn null/N/A, không gán latency bằng 0. Lượt thành công duy nhất của 3.1 nhanh hơn hai lượt 3.5, nhưng chưa đủ để kết luận 3.1 nhanh hơn nói chung.

## 6. Lỗi 504: bằng chứng và giới hạn

**Đã xác minh:** ba response HTTP 504 thực sự từ đường gọi API, có provider status `DEADLINE_EXCEEDED`, được nhận sau 3918–4930 ms. Chúng xảy ra trước deadline local 5000 ms; không phải chỉ suy ra HTTP status từ một exception timeout không có response. Request cùng schema đã thành công với 3.5 và một lần với 3.1.

**Chưa xác minh root cause:** thiếu trace/provider request diagnostics để phân biệt quá tải, processing/gateway deadline hoặc ảnh hưởng ngân sách timeout mà SDK gửi. Không có bằng chứng để kết luận schema sai, hết Free quota, key sai hay cần billing. Mã phân loại `timeout` là phân loại hiện tượng, không giải thích căn nguyên.

Phase 5C.2 ghi nhận 6/9 HTTP 504 nhưng không lưu đủ provider body để xác định nguyên nhân cụ thể từng lượt. Kết quả hiện tại cho thấy đổi model không tự động loại bỏ 504. Không tăng timeout để làm đẹp tỷ lệ thành công; không suy rộng từ hai mẫu để kết luận 3.8 không dùng được hoặc không có quyền truy cập.

## 7. Cấu hình đề xuất và bước tiếp theo

Giữ cấu hình đang có, chưa ghi thay đổi vào `.env.local`:

```dotenv
GEMINI_MODEL=gemini-3.5-flash-lite
CHAT_AI_AUTO_ANSWER=false
```

Giữ API `v1beta`, timeout 5000 ms, prompt/schema/candidate limit hiện tại; không đổi feature flag. Luồng chính tiếp tục chỉ gợi ý Published questionId; stored persona answer vẫn do backend lấy sau khi người chơi chọn. Không thêm auto-answer hoặc auto-fallback model.

Sau khi chủ dự án duyệt một ngân sách riêng:

1. Xác minh RPM/TPM/RPD thực tế trong AI Studio; không dùng quota nội bộ thay cho quota provider.
2. So sánh tiếp 3.5 và 3.1 bằng các cặp câu đồng nhất, trải ra nhiều thời điểm, bổ sung typo/không dấu/phủ định và Huế/Sài Gòn. Không reset ledger cũ.
3. Rà soát ba nhãn chưa chắc chắn trước khi đưa vào accuracy. Lưu status/provider code đã loại thông tin nhạy cảm; nếu có request diagnostics an toàn, dùng để điều tra 504.
4. Chỉ cân nhắc model dự phòng khi đủ bằng chứng về tỷ lệ thành công, độ chính xác và quota; mọi thay đổi model/config cần chủ dự án duyệt. Luồng fallback hiện tại tiếp tục hoạt động khi AI thất bại.

## 8. File, kiểm thử và bảo toàn dữ liệu

File mới của phase này:

- `scripts/evaluate-chat-models-5c3.ts`: prepare/list/live có ledger riêng, khóa tránh chạy song song, tối đa sáu lượt, không gọi lại cùng cặp model/ca, chặn tiếp model nếu gặp 401/403/404/429; kiểm tra hash trước gọi.
- `scripts/support/chat-model-evaluation-metrics.mjs`: cách tính metric với mẫu số rõ ràng.
- `scripts/report-chat-models-5c3.mjs`: tổng hợp artifact thành JSON báo cáo, không gọi API.
- `tests/chat-model-evaluation.test.mjs`: ba kiểm thử metric.
- Hai báo cáo `docs/chatbot-phase-5c3-model-evaluation.md` và `docs/chatbot-phase-5c3-model-results.json`.

Artifact local tại `.local/chat-phase-5c3/`: benchmark đóng băng, model listing, xác nhận Free Tier, ledger, sáu kết quả, inventory knowledge trước/sau. Không chứa key/cookie. Ledger Phase 5C.1 và 5C.2 được so hash, giữ nguyên.

Kết quả kiểm tra:

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript `npx tsc --noEmit` | Pass |
| ESLint bốn file code/test mới | Pass |
| Unit tests metric | 3 pass, 0 fail |
| Generation mới | 6/6, không retry |
| Hash cấu hình, matcher/config/orchestration/schema/cache và ledger cũ | Không đổi |
| So count + content hash các collection knowledge trước/sau | Không đổi |

Node test runner lần chạy sandbox bị `spawn EPERM`; chạy lại với quyền tạo subprocess đã pass cả ba test, không gọi Gemini. Không chạy production build hoặc toàn bộ E2E trong phase đánh giá CLI này; không thay code ứng dụng. Không coi ba test metric là kiểm thử lại toàn bộ chatbot.

Inventory sau live, database `vo_danh`: **59 logical questions, 74 revisions (60 approved, 14 draft), 59 published/readable, 134 audit records**; không orphan, duplicate version hoặc broken published pointer. Số revision approved lớn hơn published là trạng thái đã có, không phải dữ liệu mới tạo trong đợt đánh giá.

Không ghi MongoDB, không tạo collection/index, không reset quota/cache, không sửa 59 Published, không sửa quiz/QR/TTS/PWA/payment hoặc kiến trúc. Không đổi billing, không deploy production, không thực hiện Phase 5D/5E.

Có thể tái tổng hợp báo cáo mà không phát sinh generation:

```powershell
rtk proxy node scripts/report-chat-models-5c3.mjs
rtk proxy node --test tests/chat-model-evaluation.test.mjs
```

Ngân sách live đã dùng hết. Dừng tại Phase 5C.3A, chờ chủ dự án duyệt trước khi thay model/cấu hình hoặc mở đợt gọi mới.

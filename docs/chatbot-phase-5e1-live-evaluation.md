# Phase 5E.1 — Gemini Live Smoke Test

Ngày thực hiện: **19/10/2026**, Asia/Bangkok. Trạng thái: **COMPLETED_PENDING_OWNER_REVIEW**.

## Kết luận

Đã chạy đúng **2 generation calls**, mỗi call tạo **1 proposal**, không retry, không đổi model. Cả hai HTTP 200 và được lưu `ready_for_review` trong **`vo_danh_phase5e1_test`**. Giữ nguyên output AI, không biên tập, không chuyển Draft, không approve/publish.

Đủ điều kiện kết thúc **kiểm thử kỹ thuật Phase 5E.1**, chờ chủ dự án nghiệm thu. Không coi hai mẫu là kiểm chứng độ ổn định production hoặc phê duyệt lịch sử. Có cảnh báo biên tập: trùng factual core với `q001`, alias lượt 1 rộng hơn nguồn, persona khác nhau chủ yếu ở lời dẫn.

## 1. Preflight và phạm vi

- Database chính xác `vo_danh_phase5e1_test`; ping và topology transaction đạt. Không kết nối `vo_danh`.
- API key tồn tại; metadata `GET models/gemini-3.5-flash-lite` trả **HTTP 200**, hỗ trợ `generateContent`. Đây không phải generation call.
- SDK **`@google/genai 2.30.0`**, API **`v1beta`**, model cấu hình và response thực tế đều **`gemini-3.5-flash-lite`**.
- [Pricing chính thức](https://ai.google.dev/gemini-api/docs/pricing) được kiểm tra 18/10: model có Standard Free Tier cho input/output. [Model datasheet](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) xác nhận Structured Outputs được hỗ trợ.
- Tier của project dựa trên **xác nhận trước đó của chủ dự án rằng đang Free Tier, chưa liên kết billing**. Không suy tier từ HTTP 200 hoặc `serviceTier=standard`. Không có API billing/remaining-quota verification độc lập; giới hạn thực tế cần xem AI Studio theo [tài liệu rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).
- Quota ứng dụng test ngày 19/10 trước gọi: **0/5**. Đây không phải quota Google. Sau gọi: **2/5**; ngày 18/10 vẫn 2, không reset.
- Timeout generation giữ **30.000 ms**, SDK `retryOptions.attempts=1`. Không đổi timeout 5.000 ms hoặc cấu hình matching của chatbot.
- `.env.local`, generator, service, grounding validator, matcher/config và ledger các phase trước được so hash trước/sau: **không đổi**.

Lượt preflight trước từng bị hệ thống duyệt quyền tự động chặn vì giới hạn sử dụng của công cụ; lệnh chưa chạy, không phát sinh API call. Ngày 19/10, sau yêu cầu tiếp tục của chủ dự án, cùng preflight được duyệt và chạy thành công. Không vượt qua cơ chế duyệt bằng đường khác.

## 2. Cách thực hiện

Harness mới `scripts/check-knowledge-generation-live.mjs` gọi **service, repository và Gemini generator hiện có**, không viết lại prompt/schema hoặc thay provider bằng mock. CLI inject connection test và actor lấy từ admin fixture đã tồn tại; không giả reviewer.

Đây là **live service integration qua CLI**, không phải Browser E2E mới với provider thật. Browser authorization, upload, edit và Draft conversion đã đạt ở baseline 18/10. Không tuyên bố đã test login UI trong lượt live.

Transport guard chỉ cho đúng endpoint/model và một request mỗi lượt. Ledger ghi trước khi gửi, chặn retry và lượt thứ ba. Lượt 2 chỉ được chạy sau lượt 1 HTTP 200, schema hợp lệ và không có lỗi persistence. Chạy lần lượt, không batch hoặc gọi song song.

Request dùng prompt/schema runtime: `responseMimeType=application/json`, `responseJsonSchema`, `temperature=0`, `maxOutputTokens=12000`, count=1. Schema runtime có trần 5 phần tử nhưng service kiểm tra kết quả không vượt count yêu cầu; **cả hai response thực tế chỉ có một proposal**.

Nguồn: DOCX fixture trích nguyên văn `Tong-hop-kien-thuc.docx`, đoạn `body/3` từ manifest; source đã được xác nhận trong test DB:

- sourceId: `4fb43dd5-a430-4119-843f-2cdcfbc95a3c`
- chunkId: `4fb43dd5-a430-4119-843f-2cdcfbc95a3c:0`
- Nội dung: tính chất, lãnh đạo, sự tham gia của nhân dân và kết quả khái quát Cách mạng tháng Tám 1945.

Lượt 2 chỉ gửi `groupId` tới service. Backend đọc lại câu hỏi fixture từ `chat_interactions`; harness kiểm tra nội dung thực gửi Google bằng đúng context server. Trường `originalQuestion` giả từ client bị từ chối trước reservation/generation, không tạo thêm call.

## 3. Kết quả từng lượt

| Thuộc tính | #1 Document | #2 Chat history |
|---|---|---|
| HTTP status | **200** | **200** |
| Latency provider | **2.627 ms** | **2.532 ms** |
| Model response | `gemini-3.5-flash-lite` | `gemini-3.5-flash-lite` |
| Prompt tokens | 662 | 714 |
| Output tokens | 793 | 784 |
| Total tokens | 1.455 | 1.498 |
| Finish reason | `STOP` | `STOP` |
| JSON / schema | Hợp lệ / hợp lệ | Hợp lệ / hợp lệ |
| Citation | Hợp lệ, source/chunk thật | Hợp lệ, source/chunk thật |
| Grounding gate | Đạt | Đạt |
| Proposal status | `ready_for_review` | `ready_for_review` |
| Retry | 0 | 0 |

Latency đo từ lúc gửi HTTP đến khi đọc response body; không gồm thời gian thao tác MongoDB của toàn bộ service. Token usage lấy từ provider, không ước lượng. Tổng cộng **2.953 tokens: 1.376 input + 1.577 output**. Không có lỗi 429/504, timeout, model hoặc schema ở hai lượt này; không suy rộng thành cam kết độ ổn định.

Proposal IDs:

1. `6095362cca24782b5e1fedb7c344b354e227ed1c8e73e12414fba5711b6d12db`
2. `172742680763e1f310cb99aa0a3de43649a216a140f99302d9496fd100c15be7`

Cả hai version **1**, chưa có draftId. Không tự sửa AI output rồi báo thành công.

## 4. Đánh giá nội dung

### Lượt 1

Canonical: **“Cách mạng tháng Tám năm 1945 là gì và do ai lãnh đạo?”**

Canonical phù hợp đoạn nguồn; neutral giữ **toàn bộ nguyên văn nguồn**, gồm tính chất giải phóng dân tộc, lãnh đạo, sự tham gia và kết quả. Không thấy thêm sự kiện, ngày tháng, địa danh hay vai trò lịch sử ngoài đoạn.

Alias **“Cuộc cách mạng tháng Tám 1945 diễn ra như thế nào”** rộng hơn nguồn: người chơi có thể mong diễn biến chi tiết, trong khi đoạn chỉ khái quát. Đây là cảnh báo cần admin xử lý; chưa sửa alias trong proposal.

### Lượt 2

Canonical: **“Cách mạng tháng Tám năm 1945 được mô tả như thế nào trong tư liệu?”**

Phù hợp câu hỏi fixture do server resolve. Neutral và evidence giữ nguyên toàn đoạn; aliases chủ yếu hỏi khái quát, không có dữ kiện mới. Không sao chép marker run ID vào canonical sinh ra.

### Citation và lịch sử

- Cả hai evidence dùng đúng sourceId/chunkId đang tồn tại; quote khớp nguyên văn. Offset do server tính.
- Neutral bằng toàn đoạn, bốn persona giữ nguyên core. Đối chiếu output raw với proposal lưu DB: canonical, aliases, neutral, characterAnswers không bị chỉnh sửa.
- Không có câu ngôi thứ nhất nhận đã tham gia/chỉ huy, không gán vai trò mới cho Trường Chinh, Lê Duẩn, Phạm Văn Đồng hoặc Võ Nguyên Giáp.
- Model trả `warnings=[]`; backend thêm cảnh báo cần admin kiểm tra lịch sử và lời thoại mô phỏng. Cảnh báo biên tập trong báo cáo là đánh giá bổ sung, không giả là warning do model trả.
- Đây là **độ trung thành với tài liệu**, không phải chứng thực độc lập toàn bộ sự kiện lịch sử. Mẫu không chứa các ca khó như đọc/ban bố Quân lệnh số 1, Nam Bộ hoặc mốc 19/8–23/8–25/8; chưa kiểm chứng generation cho các trường hợp đó.

## 5. Bốn persona

| Nhân vật | Lời dẫn ở cả hai lượt | Đánh giá |
|---|---|---|
| Trường Chinh | “Bạn hãy chú ý điểm cốt lõi này:” | Nhấn trọng tâm |
| Lê Duẩn | “Ta cùng nhìn vào nội dung tài liệu nhé:” | Gợi cùng tìm hiểu |
| Phạm Văn Đồng | “Để bạn dễ theo dõi, tài liệu nêu:” | Điềm đạm, dẫn nguồn |
| Võ Nguyên Giáp | “Cháu cùng xem đoạn tư liệu này nhé:” | Xưng hô gần gũi |

Đủ bốn giọng với lời dẫn khác nhau, không thay sự thật. **Khác biệt chỉ ở khung lời dẫn**, thân đáp án giống nhau; chưa đạt mức biến hóa hội thoại phong phú. Đây là hệ quả có chủ đích của grounding extractive hiện tại, không tự nới validator hoặc viết lại output để tăng điểm.

## 6. Trùng lặp và khả năng chuyển Draft

- #1: detector trong **test DB** chưa báo trùng với dữ liệu fixture tại lúc tạo.
- #2: detector báo `possible_duplicate` với Draft fixture `cmtt45-q003:v1` và proposal #1.
- Cả hai bị đánh dấu `possible_duplicate` với **`cmtt45-q001:v4`** khi đối chiếu snapshot local v4 (59 logical questions) và cached Published candidates ngày **16/10/2026** (50 candidates duy nhất). Factual core của hai proposal **giống đáp án q001**; không tăng coverage kiến thức.
- Không truy vấn production để kiểm tra 59 Published hiện tại. Kết quả Published comparison chỉ có giá trị đối với cache ngày 16/10, không giả là inventory production mới.
- Validation tạo Draft chạy **trong bộ nhớ**, với ID placeholder không ghi DB: cả hai **0 errors, 0 warnings** từ `validateKnowledge`. Điều này chỉ xác nhận cấu trúc/source locator hợp lệ.
- **Chưa chuyển Draft.** Admin phải rà soát lịch sử/aliases và quyết định duplicate. Với #2, workflow hiện tại yêu cầu xác nhận xử lý possible duplicates. Nên cân nhắc bỏ qua đề xuất trùng hoặc tạo revision của câu hiện hữu nếu có thay đổi biên tập đáng giữ, không tự thêm logical question trùng nội dung.

## 7. Artifact nguyên bản và an toàn

Tại `.local/chat-phase-5e1-live/`:

- `preflight.json`, `source-snapshot.json`
- `generation-ledger.json`: **calls=2, maximum=2**, hai attempt finished
- `call-1-provider-response.json`, `call-2-provider-response.json`: provider body nguyên bản
- `call-1-output.txt`, `call-2-output.txt`: nguyên text JSON AI trả về
- `call-1-proposal.json`, `call-2-proposal.json`: trạng thái proposal lưu DB
- `call-1.json`, `call-2.json`: metrics và kết quả kiểm chứng
- `quality-evaluation.json`, `postflight.json`, `tests.json`, `tests.tap`, `transport-test.json`

Các artifact không chứa key/cookie/raw prompt; output lịch sử dùng nguồn được phép kiểm thử. Không đưa artifact vào public website. SHA-256 output được lưu để đối chiếu, không chỉnh sửa raw file.

Postflight: knowledge vẫn **3 logical / 4 Draft revisions / 0 approved / 0 Published pointer** trong test DB; hash question/revision/audit giữ nguyên. Hai proposal mới chưa chuyển Draft. Không thay 59 Published, không reset ledger, không bật billing, không đổi `.env.local` hoặc matching, không deploy.

## 8. Regression và file

- **192/192 unit/regression tests** đạt, guard offline chặn database/provider.
- **3 transport mock tests** đạt: payload document, payload chat history, 429 chỉ một attempt. Không phát sinh call live.
- TypeScript và ESLint `scripts/check-knowledge-generation-live.mjs` đạt.
- Không sửa runtime nên không chạy lại production build; build bản runtime cuối của baseline đã đạt.
- File mới: `scripts/check-knowledge-generation-live.mjs`, báo cáo này. Cập nhật `docs/chatbot-phase-5e1.md` và `docs/chatbot-phase-5e1-test-report.json`. Không thay kiến trúc.

## 9. Quyết định và bước tiếp theo

**Có thể kết thúc Phase 5E.1 ở mức kiểm thử kỹ thuật**, với kết quả và giới hạn trên; chờ chủ dự án duyệt. Hai proposal vẫn cần biên tập/duyệt theo workflow bình thường và chưa sẵn sàng publish tự động.

Chủ dự án kiểm tra output nguyên bản, xử lý duplicate q001 và alias rộng; quyết định có giữ đề xuất hay không. Nếu cần kiểm chứng thêm nguồn phức tạp hoặc độ ổn định provider, lập ngân sách thử mới sau khi duyệt. Không chạy thêm trong đợt này.

Rollback của lượt live: không có runtime/env change để revert. Có thể giữ nguyên hai proposal chờ review; nếu muốn bỏ qua, dùng thao tác admin hiện có. Không tự xóa record hoặc reset quota. **Đã dừng sau 2/2 calls.**

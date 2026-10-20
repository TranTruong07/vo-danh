# Phase 5E.2 — Hướng dẫn vận hành generation

Ngày: 19/10/2026. Đây là hướng dẫn để chủ dự án duyệt và vận hành sau này. **Chưa deploy, chưa bật production generation, chưa gọi Gemini live trong Phase 5E.2.**

## Cấu hình server trên Vercel

| Biến | Giá trị/ý nghĩa |
|---|---|
| `KNOWLEDGE_GENERATION_ENABLED` | Giữ `false` trước khi chủ dự án cho phép thử. `true` chỉ mở generation cho admin đã xác thực. |
| `KNOWLEDGE_GENERATION_DAILY_CALLS` | Mặc định 5; số nguyên 1–20. Hạn mức ứng dụng dùng chung giữa các instance, theo ngày UTC. |
| `KNOWLEDGE_GENERATION_MAX_PER_REQUEST` | Mới: mặc định 1, tối đa 5. Nên dùng 1 khi thử có kiểm soát. |
| `GEMINI_MODEL` | Giữ `gemini-3.5-flash-lite`. Không tự chuyển model. |
| `GEMINI_API_KEY` | Secret server; không dùng `NEXT_PUBLIC_`, không chép vào tài liệu hoặc client. |
| `MONGODB_URI`, `MONGODB_DB_NAME` | Cấu hình đúng môi trường đã được duyệt; replica set/transaction cần hoạt động. Không dùng DB chính cho automated tests. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Dùng cơ chế admin hiện có; không tạo reviewer giả. |
| `NEXT_PUBLIC_APP_URL` | Origin HTTPS của deployment để kiểm tra mutation same-origin. |
| `KNOWLEDGE_UPLOAD_MAX_MB` | Có thể đặt 4 để hạn chế file thử trên Vercel. |
| `KNOWLEDGE_MAX_PAGES`, `KNOWLEDGE_MAX_CHARS` | Giữ giới hạn extractor hiện hữu; mặc định 100 trang và 200.000 ký tự. |

Không thay `CHAT_AI_MATCHING_ENABLED`, `CHAT_AI_AUTO_ANSWER` hay timeout matcher. Generator giữ API v1beta, deadline 30 giây, một SDK attempt, route generation có `maxDuration=60`.

Vercel Functions giới hạn payload request/response **4,5 MB**; mức 10 MB của ứng dụng không vượt được giới hạn hosting. Cần kiểm tra file nhỏ trước; tài liệu lớn phải chia file trong phạm vi hiện tại. [Vercel Functions Limits](https://vercel.com/docs/functions/limitations#request-body-size).

Quota hiển thị là **quota ứng dụng**, không phải quota Google hoặc xác nhận Free Tier. Kiểm tra tier/billing và giới hạn model trong AI Studio trước mỗi đợt live. Google tính giới hạn theo project; ngày quota provider khác ngày UTC của ứng dụng. [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

## Admin sử dụng

1. Đăng nhập admin bằng luồng hiện có. Vào `/admin/knowledge/sources`, upload DOCX/PDF có lớp text, đọc trích xuất và xác nhận nguồn.
2. Vào `/admin/chat-questions`, lọc ngày/nhân vật/trạng thái/số lượt. Mở một nhóm → **Tạo kiến thức từ câu hỏi này** → chọn **Nhập thủ công** hoặc **Gemini tạo từ tài liệu**. Câu hỏi gốc được backend đọc từ group ID. Nhóm tương đương được admin liên kết ở phần rà soát; không tự gộp bằng suy đoán.
3. Nhập độc lập tại `/admin/knowledge/manual`. Chọn nguồn đã xác nhận, chọn một đoạn làm evidence; nhập canonical, 2–5 aliases, neutral và bốn persona, ghi chú. Lưu đề xuất. Không tiêu hao quota Gemini.
4. Với Gemini: chọn tối đa 3 tài liệu, 12 đoạn, 24.000 ký tự; chọn số câu trong giới hạn. Kiểm tra model/quota, tick xác nhận mới được gửi. Một lượt có thể tạo nhiều proposal nhưng tiêu thụ một generation call. Chưa được chủ dự án cho phép live thì không thực hiện bước này trên production.
5. Mở đề xuất, đọc nguyên văn nguồn, lời đáp, warnings và lịch sử nguồn câu hỏi. Sửa aliases bằng thêm/sửa/xóa; lưu biên tập trước khi chuyển Draft.
6. Nếu trùng chính xác: chọn **Tạo revision cho câu này**, hoặc bỏ qua proposal. Nếu trùng proposal khác, mở để so sánh và giữ một đề xuất phù hợp. Nếu có thể trùng, admin phải xác nhận quyết định; detector chỉ là gợi ý biên tập.
7. Tick đã đối chiếu evidence và bốn lời đáp; **Lưu thành Draft**. Bản đang Published vẫn được phục vụ. Mở Draft để đi tiếp workflow Pending Review → Approved → Publish bằng thao tác riêng sau khi được duyệt.

Giới hạn grounding giữ từ Phase 5E: neutral là trích đoạn liên tục trong evidence, bốn persona giữ toàn bộ core và chỉ thêm khung lời dẫn hỗ trợ. Nhập thủ công không bỏ qua kiểm chứng này; diễn đạt ngoài khung được giữ `insufficient_evidence` để chỉnh lại. Chưa hỗ trợ tổng hợp/paraphrase đáp án tự do nhiều nguồn.

## Lỗi và khôi phục

- 429 quota ứng dụng: chưa reserve, chưa gọi provider. Quota provider 429: proposal `failed`, lượt đã reserve vẫn được tính.
- 503/504/timeout: không retry tự động, giữ proposal và mã lỗi để xem. Không sửa output cho đẹp rồi đánh dấu thành công.
- Nếu mất response, **Kiểm tra lại cùng lượt tạo** dùng cùng requestId; backend không gọi thêm. Payload khác cùng requestId bị conflict. Muốn gọi mới phải chủ động chuẩn bị lượt mới và xác nhận lại.
- RequestId được giữ trong component, không bền qua reload/tab mới. Sau reload phải kiểm tra danh sách proposal trước khi tạo lượt mới. Không cam kết chống hai thao tác độc lập có requestId khác nhau.
- Nếu process chết giữa chừng, proposal có thể ở `generating`. Kiểm tra trạng thái/log đã lọc; workflow hiện có cho bỏ qua sau 5 phút. Không reset quota hoặc tự hoàn lượt.
- Quota trên UI là snapshot, có thể thay đổi bởi admin khác; transaction ở backend quyết định giới hạn cuối cùng.

## Checklist trước production

- [ ] Chủ dự án duyệt code và báo cáo Phase 5E.2; cho phép deploy riêng.
- [ ] Kiểm tra origin, phiên admin, quyền server-side và các biến theo đúng scope Vercel.
- [ ] Xác nhận DB đích, transaction, dung lượng GridFS, backup và quyền tài khoản DB.
- [ ] Kiểm tra preview riêng trước, dùng database test riêng và fixture được đánh dấu.
- [ ] Kiểm tra plan hosting/body limit/duration và trích xuất file thực tế; không dùng PDF scan/OCR.
- [ ] Xác minh Free Tier/billing/quota project Gemini; không suy từ việc API gọi thành công.
- [ ] Chốt ngân sách live mới, giới hạn 1 proposal/call; bật flag chỉ khi được cho phép.
- [ ] Admin rà soát dữ kiện, alias, vai trò Lê Duẩn, ngày tháng/địa danh và duplicate trước Draft/review.
- [ ] Xem audit/Published pointer, bảo đảm không có publish ngoài thao tác đã được người có quyền phê duyệt.

## Rollback

Tắt `KNOWLEDGE_GENERATION_ENABLED` để dừng lượt Gemini mới; nhập thủ công vẫn dùng được. Nếu cần rollback code, quay về bản triển khai đã được duyệt hoặc revert riêng file Phase 5E.2, không reset toàn working tree. Không xóa nguồn, proposal, revision, audit hoặc quota. Giữ source resolver để các Draft đã tạo vẫn đối chiếu được. Không thay Published pointer để rollback UI.

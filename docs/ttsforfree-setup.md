# TTSForFree → Cloudflare R2 cho âm thanh câu hỏi

Ngày: 2026-10-26 (Asia/Bangkok).

**Cập nhật tiếp theo:** phần phát tại màn chơi và offline đã được nối trong [bản sửa phát audio](./ttsforfree-playback-fix.md). Các ghi chú “chưa nối màn chơi/PWA” bên dưới mô tả phạm vi đợt tích hợp ban đầu.

## Phạm vi

Thay provider đang hoạt động trong phần **Âm thanh câu hỏi** của admin bằng TTSForFree. Tạo riêng bảy MP3: câu hỏi, đáp án A–D, phản hồi đúng và phản hồi sai. Giọng đọc chọn cho từng câu hỏi từ tối đa bốn Voice ID do chủ dự án cấu hình.

Theo lựa chọn của chủ dự án, server tải MP3 hoàn thành từ TTSForFree sang R2 và lưu URL R2 trong MongoDB. Phát/nghe lại từ R2 không gọi API tổng hợp giọng đọc. Không sửa nội dung câu hỏi, chấm điểm, chatbot, QR, payment hoặc PWA; chưa nối bộ MP3 mới vào luồng tự đọc của màn chơi. Phạm vi hiện tại là tạo, lưu và nghe thử tại admin, chuẩn bị tài sản cho việc phát lại sau này.

## Cấu hình

1. Mở `.env.ttsforfree.example`, sao chép các biến cần thiết vào `.env.local` hiện có. Không ghi đè cả file.
2. Điền `TTSFORFREE_API_KEY` và `TTSFORFREE_VOICE_1_ID` đến `TTSFORFREE_VOICE_4_ID`. Dùng token **Voice** chính xác của nhà cung cấp, thường bắt đầu bằng `v1:`, không dùng tên hiển thị. Những giọng chưa dùng để trống.
3. Điền các biến `TTSFORFREE_VOICE_n_LABEL` để có tên dễ nhận biết trong dropdown. ID không được trùng nhau. Không dùng tiền tố `NEXT_PUBLIC_` cho API key.
4. Đặt `TTSFORFREE_ENABLED=true` khi muốn cho phép admin gửi yêu cầu. Pitch giữ ở 0 để tránh giả định giọng nào cũng hỗ trợ điều chỉnh pitch.
5. Giữ cấu hình R2 hiện có: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Bucket/custom domain phải cho phép phát file công khai; tài khoản cần quyền ghi object.
6. Khởi động lại Next.js. Các biến FPT cũ không điều khiển luồng TTSForFree; không có fallback tự động sang FPT.

Không có key, Voice ID thật hoặc cấu hình production nào được ghi vào repository trong đợt này. Không cần cài thêm dependency.

## Cách dùng

1. Đăng nhập admin → **Câu hỏi theo nhân vật** → chỉnh sửa câu hỏi đã lưu.
2. Tại **Âm thanh câu hỏi**, chọn giọng TTSForFree.
3. Bấm **Tạo MP3** ở một đoạn, hoặc **Tạo các MP3 còn thiếu** rồi xác nhận. Có thể tạo đáp án/phản hồi trước câu hỏi; không còn giới hạn pilot FPT.
4. Từng đoạn được xử lý tuần tự. Batch dừng khi một đoạn lỗi; đoạn thành công được giữ lại. Giữ trang mở để hoàn thành các đoạn tiếp theo.
5. Khi đoạn hiện **Sẵn sàng**, bấm nút phát để nghe URL R2. Đây không phải yêu cầu tổng hợp mới.
6. **Cập nhật trạng thái** chỉ đọc trạng thái đã lưu từ MongoDB. **Tạo lại / tiếp tục** mới tiếp tục kiểm tra job hoặc tải URL đã có. Nếu job đã kết thúc với `ERROR`, lần xác nhận tiếp theo tạo job mới và có thể tốn credits.

Thay đổi nội dung đã lưu, giọng hoặc nhân vật sẽ đánh dấu audio không còn khớp là **Cần cập nhật**. Chỉ các đoạn được chọn mới tạo lại. Khi nội dung form chưa lưu, nút tạo bị khóa.

## Luồng server và lưu trữ

`Admin → POST /api/admin/quiz-questions/:id/audio/generate → đọc câu hỏi từ DB → khóa theo câu hỏi → CreateBy một lần → lưu jobId → GET Status → kiểm tra MP3 → PutObject R2 → lưu ready + URL R2`.

- Giữ hai API admin hiện có: `GET /api/admin/quiz-questions/:id/audio?voiceId=...` và `POST /api/admin/quiz-questions/:id/audio/generate`.
- POST chỉ nhận `{ segments, voiceId, confirmed: true }`. Không nhận text, URL, host, API key từ client. Giọng phải thuộc cấu hình server; nội dung lấy từ câu hỏi đã lưu.
- `requireAdmin` tại service, kiểm tra phiên admin/origin ở HTTP, body giới hạn 2 KB. Phản hồi không cache. Không có generation khi mở form, chọn giọng hoặc bấm lưu câu hỏi.
- Collection tái sử dụng: `speech_assets`; `_id = quiz-audio:ttsforfree:<questionId>`. Các record FPT `quiz-audio:<questionId>` và audio cũ được giữ nguyên.
- Mỗi segment lưu provider, voiceId, pitch, textHash, trạng thái, jobId; khi sẵn sàng có r2Key, url, contentType, fileSize, generatedAt. URL provider chỉ là trạng thái chờ riêng trên server, không trả về UI và không cần giữ sau khi hoàn thành.
- R2 key: `quiz-audio/ttsforfree/<characterId>/<questionId>/<segment>/<sha256>.mp3`. Hash bao gồm nội dung nguyên bản, giọng, pitch và nhân vật. Không đưa Voice token thô vào đường dẫn object.
- Atomic lease theo câu hỏi dùng unique `_id` và owner fencing; hết hạn sau 10 phút nếu process chết. Không gọi đồng thời nhiều đoạn. UI gửi một đoạn mỗi request để tránh timeout của batch dài.
- Kiểm tra status tối đa 60 giây, cách nhau 5 giây, timeout mỗi HTTP tối đa 10 giây. Dừng khi 429/5xx, không tự POST retry. Giữ jobId để người quản trị tiếp tục sau.
- Sau SUCCESS, lưu URL provider trước khi tải; lỗi download/R2 tiếp tục từ URL đó, không phải tổng hợp lại. Tải CDN tối đa 15 giây/5 MB; kiểm tra MIME và ít nhất hai MPEG Layer III frames. Không chuyển tiếp API key tới CDN, không theo redirect.
- Chỉ chấp nhận HTTPS MP3 trên `cdn.ttsforfree.com`, theo ví dụ API chính thức. Host khác cần đối chiếu tài liệu/provider trước khi mở rộng allowlist.
- URL phát được lấy từ public base R2 hiện tại và key đã lưu. Chưa có tác vụ xóa file/manifest cũ hoặc migration database.

## Giới hạn thực tế

- TTSForFree thông báo file chỉ lưu tạm và có thể bị xóa; vì vậy chỉ lưu URL của họ không đáp ứng phát lâu dài. R2 giữ bản sao độc lập, miễn bucket/object vẫn được duy trì. [FAQ nhà cung cấp](https://ttsforfree.com/).
- Contract được đối chiếu với [tài liệu API](https://ttsforfree.com/en/docs/). Nhà cung cấp khuyến nghị tạo một lần, lưu Id, poll khoảng 5 giây và chỉ dùng file sau SUCCESS. Không dùng ExpectUrl để phát sớm.
- Tên dịch vụ không bảo đảm mọi giọng/API miễn phí. Credits, quota và quyền dùng Voice ID do tài khoản nhà cung cấp quyết định; không tự nâng gói hoặc retry khi hết hạn mức.
- Nếu process chết/mất mạng đúng lúc provider nhận POST nhưng trước khi Id được lưu, không thể bảo đảm exactly-once vì API chưa có idempotency key được xác minh. Cần đối chiếu lịch sử TTSForFree trước khi admin xác nhận gửi mới. Không có retry POST tự động.
- Giới hạn ứng dụng 5.000 ký tự/đoạn không thay thế giới hạn riêng của từng giọng/tài khoản. Provider có thể từ chối ngắn hơn.
- Chưa có kiểm thử live API, tải MP3 thật, MongoDB hoặc R2 thật trong đợt này. Các kiểm thử dùng mock; chưa xác nhận Voice ID/quota cụ thể hay chất lượng giọng.
- Browser kiểm tra player/source URL, không chứng minh file thật giải mã được trên iOS; cần nghe thử sau cấu hình. Chưa bổ sung audio vào offline pack/PWA.

## Kiểm thử và rollback

Kết quả chi tiết: `docs/ttsforfree-test-report.json`.

```powershell
node --test tests/quiz-audio.test.mjs tests/fpt-legacy-audio.test.mjs tests/tts-cleanup.test.mjs tests/history-game.test.mjs tests/pwa.test.mjs tests/character-questions.test.mjs tests/orders.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-dialogue.test.mjs
npx tsc --noEmit
node scripts/check-quiz-audio.mjs browser
node scripts/check-quiz-audio.mjs build
```

Script browser/build tạo bản sao trong `.local/ttsforfree/`, không sao chép `.env.local`, khóa kết nối provider/DB, không tác động `.next` của server đang dùng. Browser dùng API giả lập và đóng tiến trình do script tạo khi xong.

Để tạm ngừng tạo audio, đặt `TTSFORFREE_ENABLED=false` rồi restart. Các URL đã lưu vẫn đọc/nghe được; không xóa R2 hoặc DB. Muốn quay lại provider trước phải khôi phục đúng phiên bản service/UI tương ứng, không chỉ bật lại biến FPT. Không reset toàn bộ working tree vì có các thay đổi từ những giai đoạn trước.

## File thay đổi trong lần tích hợp này

- `.env.ttsforfree.example`, `.gitignore`.
- `server/infrastructure/ttsforfree.ts`, `server/infrastructure/audio-file.ts`; `fpt-tts.ts` chỉ chuyển bộ kiểm tra MP3 sang module dùng chung, giữ tương thích legacy.
- `server/domain/quiz-audio.ts`, `server/domain/quiz-audio-hash.ts`, `server/models/quiz-audio.ts`.
- `server/services/quiz-audio-config.ts`, `server/services/quiz-audio.ts`, `server/repositories/speech.ts`.
- `features/questions/question-audio.tsx`.
- `tests/quiz-audio.test.mjs`, `tests/fpt-legacy-audio.test.mjs`, `scripts/check-quiz-audio.mjs`.
- Tài liệu này và `docs/ttsforfree-test-report.json`.

Các API route, QuestionForm và CSS đã tồn tại từ công việc TTS trước được tái sử dụng. Những thay đổi khác đang có trong working tree được giữ nguyên.

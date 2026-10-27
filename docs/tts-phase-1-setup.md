# TTS-1 — Thiết lập pilot FPT.AI và R2

Ngày kiểm tra: 25/10/2026. Chỉ admin; một câu hỏi; chưa gọi FPT thật.

## Trạng thái đã kiểm tra

Chỉ đọc sự hiện diện của cấu hình, không in giá trị secret, không kết nối MongoDB/R2:

| Điều kiện | Kết quả |
| --- | --- |
| FPT API key | Chưa cấu hình |
| FPT feature flag | Tắt |
| Câu hỏi pilot | Chưa cấu hình |
| Cho phép các đoạn còn lại | Tắt |
| Các biến R2 cần thiết | Có đủ |
| Quyền bucket, public URL, quota FPT | Chưa kiểm chứng qua mạng |

Chưa chọn ID câu hỏi thật; chưa có số ký tự thực tế để báo trước. UI hiển thị số ký tự từ bản đã lưu trước khi xác nhận. Không gửi khóa vào chat.

## Cấu hình thủ công sau khi duyệt code

Tham khảo `.env.fpt-tts.example`. Không ghi đè `.env.local` bằng file mẫu.

```dotenv
FPT_TTS_API_KEY=<điền riêng trên server>
FPT_TTS_ENABLED=false
FPT_TTS_DEFAULT_VOICE=leminh
FPT_TTS_DEFAULT_SPEED=0
FPT_TTS_MAX_FILES_PER_REQUEST=7
FPT_TTS_PILOT_QUESTION_ID=<ObjectId của đúng một character_questions>
FPT_TTS_ALLOW_REMAINING_SEGMENTS=false
```

`FPT_TTS_PILOT_QUESTION_ID` là ID 24 ký tự hex của **câu hỏi quiz**, lấy từ `/admin/questions/{id}/edit`. Không dùng ID nhân vật hoặc logical question trong kho chatbot. Không có wildcard hoặc danh sách ID. Thiếu/sai cấu hình sẽ khóa generation. Giữ cùng ID trong suốt pilot.

Giọng mặc định `leminh` dùng cho pilot câu hỏi của Võ Nguyên Giáp. UI có bảy giọng được liệt kê trong tài liệu FPT v5; không gán tự động giọng riêng cho nhân vật khác. Tốc độ hợp lệ -3…3, mặc định 0. Không đặt prefix `NEXT_PUBLIC_` cho key.

Tái sử dụng các biến hiện có: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Public base URL cần trỏ tới bucket/custom domain có thể phát file. Credential cần quyền ghi object cho bucket đó. Chưa cấp thêm quyền hay đổi CORS trong đợt triển khai này. Preview dùng `<audio>` với URL public, không cần browser gọi S3 upload API.

## Thử đúng một MP3 sau khi chủ dự án đồng ý

1. Chọn một câu hỏi đã lưu của Võ Nguyên Giáp, điền ID pilot và API key trên server. Kiểm tra tài khoản/quota FPT trong Console trước khi bật.
2. Chỉ sau khi cho phép live smoke test, đặt `FPT_TTS_ENABLED=true`, giữ `FPT_TTS_ALLOW_REMAINING_SEGMENTS=false`. Khởi động lại tiến trình development để nạp env. Không deploy hoặc tự bật flag Vercel.
3. Đăng nhập admin bằng cơ chế tài khoản hiện có. Mở **Câu hỏi theo nhân vật → Chỉnh sửa** câu hỏi pilot. Xem mục **4. Âm thanh câu hỏi**.
4. Chọn `leminh`. Nếu có chỉnh sửa chưa lưu, lưu câu hỏi rồi mở lại. Dropdown chỉ đọc trạng thái, không gọi FPT.
5. Ở dòng **Câu hỏi**, bấm **Tạo MP3**. Kiểm tra số ký tự và xác nhận. Chỉ một POST synthesis cho đoạn này; server lấy text từ MongoDB, không nhận text tự do từ browser.
6. Chờ kết quả. Khi **Sẵn sàng**, bấm play trên thanh audio để nghe file từ R2. Không tự phát.
7. Ghi nhận phát âm, metadata, public URL và quota đã dùng. Dừng để duyệt; không tạo sáu đoạn còn lại trong smoke test đầu.

Chỉ khi chủ dự án cho phép thử thêm, bật `FPT_TTS_ALLOW_REMAINING_SEGMENTS=true` rồi khởi động lại server. Backend vẫn yêu cầu MP3 câu hỏi đã ready, đúng text/hash/giọng trước khi cho tạo đáp án hoặc phản hồi. Nút tạo các đoạn còn thiếu lấy tối đa số đoạn trong `FPT_TTS_MAX_FILES_PER_REQUEST`, tuyệt đối không duyệt nhiều câu hỏi.

## Ước tính ký tự và xử lý lỗi

- Đoạn câu hỏi: `Array.from(storedQuestion.question).length`, không thêm tên nhân vật hoặc đáp án đúng. Form hiện giới hạn câu hỏi 10–500 ký tự UTF-16; số hiển thị là ước tính theo Unicode code point, không phải xác nhận cách tính phí của nhà cung cấp.
- Đáp án: thêm đúng tiền tố `Đáp án A. ` (tương tự B/C/D), giữ nguyên nội dung. Phản hồi lấy nguyên văn. Tổng 7 đoạn là tổng số ký tự của bảy chuỗi thực gửi. Không thể công bố một số thực tế khi chưa chọn ID pilot.
- MP3 ready với cùng hash/giọng được bỏ qua, không gọi FPT lại. File đang chờ có URL đã lưu sẽ tiếp tục tải URL đó khi admin thử lại, không synthesis lại.
- Nếu chưa có URL do POST timeout/lỗi mạng, chưa thể biết provider đã tính quota hay chưa. Kiểm tra Console trước khi thử lại; không có tự retry POST.
- Nếu báo MP3 chưa sẵn sàng, chờ khoảng hai phút rồi **Cập nhật trạng thái / Tạo lại, tiếp tục**. Polling mỗi lượt tối đa 6 GET trong 25 giây. File không tự hoàn tất khi đã rời request; cần thao tác admin để tải lại.
- Host audio khác allowlist, sai MIME hoặc MP3 không hợp lệ sẽ bị từ chối. Hiện hỗ trợ bucket S3 v4 trong tài liệu và `file01.fpt.ai/text2speech-v5/{short|long}/YYYY-MM-DD/<filename>.mp3`. URL không được chấp nhận vẫn giữ riêng phía server để kiểm tra; retry không gửi synthesis lại nếu đã giữ được URL. Không tự mở rộng allowlist tới host tùy ý.
- Lỗi MongoDB sau upload có thể để lại object chưa được tham chiếu; không tự xóa, không tự chạy lại hàng loạt. Kiểm kê metadata/R2 trước khi xử lý.

## Tài liệu chính thức và giới hạn

API v5 sử dụng header `api_key`, trả JSON `error`/`async`; audio có thể chưa tồn tại ngay. Danh sách giọng và ví dụ bucket được đối chiếu tại [FPT.AI API v5](https://docs.fpt.ai/docs/en/speech/api/text-to-speech/) và [hướng dẫn gọi API](https://docs.fpt.ai/docs/en/speech/tutorials/text-to-speech/). Code dùng `api_key` theo tài liệu, thay cho cách viết `api-key` trong yêu cầu ban đầu.

Đã xác minh schema bằng tài liệu và mock; chưa kiểm chứng response thật, giọng khả dụng với key, MIME/host thực tế, chất lượng âm thanh hoặc quota. Phạm vi TTS-1 chỉ generation + preview admin; không gắn MP3 mới vào player hoặc PWA.

## Tắt / rollback

Đặt `FPT_TTS_ENABLED=false` và khởi động lại server để ngăn generation mới; lượt đã được chấp nhận có thể vẫn hoàn thành. Sau đó rollback riêng các file TTS-1 theo `docs/tts-phase-1.md` nếu cần. Không `git reset --hard` vì workspace còn thay đổi TTS-0 trước đó. Giữ nguyên metadata và object R2 để điều tra, không xóa collection hoặc chạy migration.

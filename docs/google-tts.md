# Giọng đọc nhân vật — Google Cloud Text-to-Speech

## Cấu hình lần đầu

1. Tạo Google Cloud project, bật billing và **Cloud Text-to-Speech API** (`texttospeech.googleapis.com`).
2. Cấu hình service account / Application Default Credentials được phép dùng dịch vụ và project quota. Xem [hướng dẫn xác thực của Google](https://docs.cloud.google.com/text-to-speech/docs/authentication).
3. Sao chép các biến trong `.env.tts.example` vào `.env.local`: `GOOGLE_TTS_PROJECT_ID`, `GOOGLE_TTS_CLIENT_EMAIL`, `GOOGLE_TTS_PRIVATE_KEY`. Có thể thay hai biến khóa bằng `GOOGLE_APPLICATION_CREDENTIALS` trỏ tới file JSON bên ngoài repo, hoặc `GOOGLE_TTS_USE_ADC=true` trên môi trường đã có ADC.
4. Dùng cấu hình R2 hiện có để lưu MP3. Khởi động lại máy chủ. Không đặt khóa trong biến `NEXT_PUBLIC_*`, không commit file khóa.

Không cần Gemini hoặc API chatbot. Chưa có thông tin xác thực thì vẫn lưu/chọn giọng được từ danh sách mẫu; nút nghe thử chưa hoạt động. Không tự thay bằng giọng trình duyệt.

## Sử dụng

- **Tạo / chỉnh sửa nhân vật → Giọng đọc tiếng Việt**: chọn riêng cho mỗi nhân vật. Danh sách có sẵn 40 giọng tiếng Việt, chia thành 30 Chirp 3 HD, 2 Neural2, 4 Standard và 4 WaveNet; mỗi nhân vật lưu lựa chọn riêng. Khi có cấu hình, danh sách được lấy từ Google `voices.list` với `languageCode=vi-VN`, gồm các giọng Việt hiện được cung cấp. Danh sách mẫu dựa trên [danh sách giọng chính thức](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types).
- **Nghe thử giọng** tạo một lời chào cố định; bấm phát trên trình phát mẫu để nghe.
- Lưu nhân vật và câu hỏi, sau đó vào **Chi tiết nhân vật → Tạo / cập nhật âm thanh**. Giữ trang mở đến khi tiến độ hoàn tất. Mỗi lượt xử lý một lời mở đầu hoặc một câu hỏi cùng các phản hồi để có thể dừng/tiếp tục. Tạo âm thanh sử dụng dịch vụ Google theo billing của project.
- Sau khi sửa câu hỏi, nhập Excel, đổi giọng hoặc lời mở đầu: bấm cập nhật âm thanh. Đoạn không đổi được tái sử dụng; đoạn đổi được tạo mới. Các tác vụ dựa trên nội dung cũ sẽ bị từ chối nếu nội dung đã thay đổi.
- Màn chơi tự thử phát **lời mở đầu → câu hỏi → đáp án A, B, C, D**. Sau khi chốt đáp án, ngắt lời đang đọc và phát đúng nội dung phản hồi đã cấu hình cho kết quả đó. Có nút nghe lại / dừng / tắt tiếng.
- Trình duyệt có thể chặn tự phát có tiếng; khi đó bấm **Nghe câu hỏi**. Mở màn quét, đổi nhân vật, rời trang hoặc ẩn tab sẽ dừng âm thanh. Khi âm thanh chưa sẵn sàng, câu hỏi và chấm đáp án vẫn hoạt động.

## Lưu và phát offline

Google chỉ được gọi bởi các thao tác admin. Người chơi tải âm thanh đã tạo sẵn, không làm phát sinh yêu cầu tổng hợp mới. MongoDB `speech_assets` lưu trạng thái; R2 lưu `audio/tts/<hash>.mp3`; URL công khai `/audio/<hash>` phục vụ dữ liệu MP3 và byte range. Hash bao gồm giọng, nội dung chuẩn hóa và phiên bản cấu hình audio. Lease trong MongoDB tránh tạo đồng thời cùng một đoạn.

Không gửi văn bản do người chơi nhập vào Google. Tác vụ tạo chỉ đọc câu hỏi thuộc đúng nhân vật từ DB; nghe thử chỉ dùng câu mẫu cố định. Mỗi yêu cầu gửi plain text và MP3 qua [text.synthesize](https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize); nội dung dài được chia theo giới hạn byte UTF-8.

PWA tải các đoạn âm thanh đã sẵn sàng cùng ảnh và câu hỏi. Chỉ bộ dữ liệu tải hoàn chỉnh mới được sử dụng; lỗi tải giữ bản hoàn chỉnh trước đó. Người chơi cần mở Home hoặc màn chơi khi có mạng sau khi admin cập nhật âm thanh. Google TTS không tạo được âm thanh mới khi thiết bị offline. Service worker hỗ trợ byte range để phát MP3 đã cache trên trình duyệt di động.

## Kiểm thử

`node --test tests/speech.test.mjs tests/pwa.test.mjs tests/history-game.test.mjs tests/character-questions.test.mjs`

Các kiểm thử tổng hợp dùng Google/R2 giả lập, không tiêu tiền từ project. Cần kiểm tra nghe thử và tạo âm thanh bằng tài khoản thật sau khi bổ sung credentials.

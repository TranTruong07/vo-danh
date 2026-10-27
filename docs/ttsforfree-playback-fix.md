# Sửa phát âm thanh sau khi quét QR

Ngày: 2026-10-26 (Asia/Bangkok).

## Nguyên nhân

- Admin lưu MP3 vào R2 và speech_assets nhưng startQuiz chưa trả narration, answerQuiz trả narration rỗng; offline pack chưa đọc manifest audio. GamePlayer ưu tiên pack có sẵn ngay cả khi có mạng nên cần nối cả hai luồng.
- Kiểm tra MongoDB thực tế: 2 câu hỏi, 1 manifest TTSForFree. Câu `6ac8e7300ddc4ea27b45f7d6` (trở về Tổ quốc sau nhiều năm hoạt động ở nước ngoài) có 7 segment ready, cả 7 textHash khớp. Câu trong ảnh `6ac8e66a0ddc4ea27b45f7d5` (đặt nhiệm vụ giải phóng dân tộc lên hàng đầu) chưa có audio. Không dùng file của câu khác để thay thế.
- Đọc thử R2 thành công: HTTP 206, audio/mpeg, range 4 byte. Chạy service offline pack và route sau sửa với dữ liệu thật (chỉ đọc) trả playlist 5 + 1 + 1 và HTTP 206.

Không tạo audio mới, không ghi MongoDB/R2, không sửa .env.local.

## Thay đổi

- `server/services/quiz-audio-playback.ts`: chỉ lấy segment ready đúng nhân vật/câu hỏi, giọng, hash nội dung và key R2. Prompt theo thứ tự câu hỏi → A → B → C → D; phản hồi đúng/sai riêng. Không gọi TTS hoặc phụ thuộc flag generation.
- `server/services/quizzes.ts`: lượt online mới/lặp lại nhận prompt; sau chốt đáp án chỉ trả phản hồi tương ứng. Giữ nguyên logic chọn câu, chấm điểm và quyền phiên chơi. Lỗi metadata audio không làm hỏng quiz.
- `server/repositories/speech.ts`: batch read manifest tránh N+1 và đọc R2 với Range.
- `server/services/offline-game.ts`: bổ sung audio vào pack trước khi tính version để thiết bị nhận biết file mới.
- `app/audio/quiz/[...asset]/route.ts`: phục vụ URL cùng origin `/audio/quiz/<characterId>/<questionId>/<segment>/<hash>` từ R2, validate đường dẫn và hỗ trợ byte ranges/cache immutable. Không tổng hợp file hoặc yêu cầu cấu hình R2 CORS.
- `server/infrastructure/audio-http.ts`, `app/audio/[id]/route.ts`: dùng chung xử lý MP3/Range, giữ tương thích audio legacy.
- `public/sw.js`: cache audio mới và trả byte ranges offline. Giữ nguyên quy tắc chỉ commit pack khi tải xong, không mất pack cũ nếu lỗi.
- `features/pwa/local-game.ts`, `features/game/game-player.tsx`: pack mới cập nhật riêng playlist của câu local đang chơi, không rút lại câu hỏi, không đổi lựa chọn hoặc snapshot chấm điểm. Pack cũ không ghi đè playlist vừa lấy từ server.
- Tests: `tests/quiz-audio-playback.test.mjs`, `tests/pwa.test.mjs`, `scripts/check-game-chat-access.mjs --audio`.

## Kiểm thử

- 79/79 unit/regression tests: generation, playback, quiz/session, PWA, chatbot, legacy audio.
- 12/12 browser checks trên 1440×900, 390×844, 375×667: autoplay bị chặn → bấm nghe; thứ tự playlist; đúng/sai; mute; quét tiếp rồi quay lại giữ quiz; pack mới không làm mất đáp án đã chọn.
- Browser dùng GamePlayer/NarrationPlayer thực và local grading; transport và HTMLMediaElement.play được mock. Chưa chứng minh giải mã MP3 hoặc phát loa trên iPhone thật.
- TypeScript, scoped ESLint và production build đạt. Build có cảnh báo suy luận workspace root do bản sao nằm trong thư mục dự án có nhiều lockfile; không có lỗi biên dịch.
- Artifact: `.local/quiz-audio-playback/browser-report.json`, `.local/quiz-audio-playback/build.json`, `.local/playback-inspection.json`, `.local/playback-live-read.json`. Build chạy bản sao không có .env.local, chặn DB/provider.

```powershell
node --test tests/quiz-audio-playback.test.mjs tests/quiz-audio.test.mjs tests/fpt-legacy-audio.test.mjs tests/tts-cleanup.test.mjs tests/history-game.test.mjs tests/pwa.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs
npx tsc --noEmit
node scripts/check-game-chat-access.mjs browser --audio
node scripts/check-game-chat-access.mjs build --audio
```

## Chạy thử

1. Tải lại trang sau khi server nhận bản sửa. Nếu dùng production build, build/restart theo quy trình dự án; đợt này chưa deploy.
2. Mở trang khi có mạng để PWA tải pack/audio mới. Audio offline chỉ dùng được sau khi cache hoàn chỉnh. Lượt local đang mở sẽ nhận playlist khi đồng bộ xong.
3. Quét lại đến câu có MP3. Nếu autoplay bị chặn, bấm **Nghe câu hỏi**. Chốt đúng/sai chuyển sang phản hồi tương ứng, không gọi TTS API.
4. Muốn câu trong ảnh có tiếng, vào `/admin/questions/6ac8e66a0ddc4ea27b45f7d5/edit` và tạo MP3 cho chính câu đó. Không cần tạo lại 7 file của câu còn lại.

Chỉ đoạn ready và khớp nội dung mới phát. Đoạn chưa tạo/stale bị bỏ qua. Không thêm audio lời mở đầu vì bộ hiện tại gồm bảy segment câu hỏi/đáp án/phản hồi.

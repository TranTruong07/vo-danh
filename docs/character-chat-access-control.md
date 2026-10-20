# Khóa chatbot đến khi hoàn thành câu hỏi hiện tại

Ngày kiểm thử: 20/10/2026. Đã sửa source; không deploy, không gọi Gemini, không kết nối hoặc thay đổi dữ liệu MongoDB.

## Nguyên nhân

`QuestionRound` luôn render `CharacterChat` mà không truyền kết quả chốt đáp án. Nút mở gọi `initialize()` ngay, nên chọn đáp án hay chưa đều có thể lấy gợi ý và gửi tin nhắn. Backend chỉ kiểm tra owner, nhân vật, trạng thái ready và hạn phiên, chưa đọc dấu hiệu chốt đáp án.

## Logic hiện tại

- `selected` vẫn chỉ là đáp án đang chọn; `submitting` là lúc chờ ghi nhận.
- Thay state `answer` bằng một bản ghi `submission` chứa `questionId`, kết quả và nguồn ghi nhận (`serverRecorded`). `answer` được suy ra từ bản ghi nếu khớp câu hỏi hiện tại, không tạo thêm state hoàn thành độc lập.
- Điều kiện mở: màn câu hỏi đang hoạt động, có kết quả của chính câu hỏi đó, không loading và không submitting. Không kiểm tra đúng/sai để cấp quyền.
- Khi chưa đủ điều kiện, chỉ render nút disabled có title/accessible label “Hãy trả lời câu hỏi trước khi trò chuyện với nhân vật.” Không mount hội thoại, input hoặc các handler gửi/lấy gợi ý.
- Khi đủ điều kiện, mount hội thoại ở trạng thái đóng. Người chơi tự mở. Đóng/mở lại bình thường giữ hội thoại và kết quả quiz.
- Đổi câu hỏi/round remount hội thoại theo định danh; đổi nhân vật remount `QuestionRound`. Request chat đang chờ bị abort khi unmount. Kết quả gửi đáp án đến sau khi round unmount bị bỏ qua. Ref chặn chốt hai lần đồng thời.
- Mở vùng quét mã cũng đóng/unmount chatbot; quay lại cùng câu hỏi đã hoàn thành có thể mở lại, nhưng lịch sử hội thoại trong component được khởi tạo lại. Kết quả quiz vẫn được giữ.

## Backend và giới hạn bảo vệ

`readChatGameSession` đọc thêm `quiz_attempts.selectedIndex`, chuyển thành `quizAnswered` rồi bỏ index khỏi kết quả trả về service. Chỉ index nguyên 0–3 được coi là đã ghi nhận. Không đọc đáp án đúng, không chấm lại, không ghi quiz.

`resolveChatSession` trả HTTP 403 / `QUESTION_NOT_ANSWERED` cho quiz chưa ghi nhận. Cả `/api/chat`, `/api/chat/suggestions`, `/api/chat/answer` đều đi qua bước này trước khi đọc Published Knowledge, history hoặc gọi AI. Client không được gửi `isAnswerSubmitted`/`canOpenChatbot` để tự mở khóa; các trường lạ vẫn bị từ chối.

**Giới hạn quan trọng:** dự án ưu tiên chấm câu hỏi từ bộ dữ liệu trên máy, kể cả khi có mạng. Luồng này không lưu kết quả vào `quiz_attempts`; `chat_game_sessions` hiện chỉ xác thực owner và nhân vật. Với lượt được chấm local, quyền hoàn thành chỉ được khóa ở UI. API của local binding vẫn chưa có bằng chứng server để thực thi điều kiện hoàn thành; người cố tình gọi trực tiếp Server Action tạo local binding có thể vượt khóa UI. Không tuyên bố đã bảo vệ toàn bộ API cho luồng offline.

`serverRecorded` chỉ giúp UI chọn đúng cơ chế phiên chat; nó không được gửi lên như bằng chứng. Lượt có kết quả `answerQuizAction` dùng ID quiz; lượt chấm local dùng binding riêng như trước. Điều này cũng xử lý trường hợp câu hỏi ban đầu tải từ server nhưng sau đó được chấm từ snapshot local, không giả định đáp án đã được lưu server.

Để bảo vệ hoàn toàn local-first cần một thiết kế riêng cho đồng bộ lượt/chốt đáp án được server xác minh. Không bổ sung cơ chế này trong task vì cần thay đổi luồng offline và không thể tin một boolean client tự khai.

## File thay đổi

| File | Thay đổi |
|---|---|
| `features/game/game-player.tsx` | Gắn kết quả với câu hỏi, điều kiện mở chat, chặn request cũ và phân biệt chấm server/local |
| `features/game/character-chat.tsx` | Wrapper khóa, chỉ mount hội thoại khi đủ điều kiện, chặn handler sau unmount |
| `features/game/chat-client.ts` | Thông báo riêng cho `QUESTION_NOT_ANSWERED` |
| `server/repositories/chat-session.ts` | Đọc completion từ đáp án được lưu, không fallback local nếu tìm thấy quiz chưa trả lời |
| `server/services/chat-session.ts` | Kiểm tra completion server |
| `tests/chat.test.mjs` | Session completion, ba endpoint và chống giả boolean |
| `tests/chat-repositories.test.mjs` | Projection, index hợp lệ/không hợp lệ, không fallback vòng qua quiz chưa trả lời |
| `tests/chat-demo.test.mjs` | Thông báo client khi bị khóa |
| `scripts/check-game-chat-access.mjs` | Browser fixture và production build trong bản sao cô lập |
| `docs/character-chat-access-control.md` | Báo cáo này |

## Kết quả kiểm thử

- TypeScript: `npx tsc --noEmit` pass.
- Unit/regression: **168/168 pass**. Bao gồm session/owner/persona, Published-only, matching/fallback/cache/quota bằng mock, chat history, quiz grading và completion gate. Kết quả: `.local/game-chat-access/tests.json`, log `tests.tap`.
- Browser: **18/18 nhóm kiểm thử pass** trên Chrome headless, 1440×900, 390×844, 375×667; sáu nhóm tại mỗi kích thước:
  1. Ban đầu khóa; chọn đáp án vẫn khóa; đang gửi vẫn khóa; trả lời sai thành công mở khóa nhưng không tự mở.
  2. Mở, chọn gợi ý, nhận phản hồi, đóng/mở lại giữ quiz và hội thoại.
  3. Gửi thất bại vẫn khóa; retry đúng thành công mở khóa.
  4. Chuyển round hủy hội thoại đang gửi; phản hồi cũ không hiện ở round mới; khôi phục body scroll trên mobile.
  5. Chuyển round trong khi đang chốt; phản hồi chốt cũ không mở khóa round mới.
  6. Cả bốn nhân vật đúng header, chỉ mở sau xác nhận; chấm local không gọi API chốt và vẫn mở chat sau hoàn thành.
- Browser dùng component thật và CSS thật trong bản sao; mock transport quiz/chat và context pack. Không ghi fixture vào MongoDB, không thử API/Gemini thật. Chuyển round được mô phỏng bằng remount cùng cơ chế key ở page; không quét camera thật. Không mô phỏng bàn phím iOS vật lý.
- Ảnh: `.local/game-chat-access/1440x900-unlocked.png`, `390x844-unlocked.png`, `375x667-unlocked.png`. Báo cáo máy đọc: `browser-report.json` cùng thư mục.
- ESLint các file thay đổi: pass. `npx eslint .` **không pass** vì quét thêm generated artifacts trong `.local` và lỗi có sẵn. Chạy lại bỏ `.local/**` xác nhận 5 lỗi `@next/next/no-assign-module-variable` trong `tests/character-images.test.mjs`, `tests/character-questions.test.mjs`, `tests/history-game.test.mjs`, `tests/orders.test.mjs`, `tests/support/load-typescript.mjs`; 1 warning `<img>` trong `app/author/page.tsx`. Không sửa các file ngoài phạm vi. Chi tiết `lint-source.json`.
- `npm run build`: pass trong bản sao không chứa `.env.local`, dùng đúng script gồm Next Turbopack + PWA assets; 44 trang static, 84 tài nguyên PWA. Có cảnh báo nhiều lockfile do workspace sao chép. Kết quả `build.json` / `build.log`.
- Hai lần thử browser ban đầu thất bại do route fixture bắt đầu bằng `_` bị Next coi là private và selector alert trùng route announcer. Đã sửa harness, lần chạy cuối đủ 18/18 pass; không thay runtime để né test.

## Chạy thử và rollback

1. Mở một QR nhân vật: chatbot đóng và nút có trạng thái khóa.
2. Chọn A/B/C/D: vẫn khóa. Chốt đáp án: chỉ khi có phản hồi đúng/sai thành công mới mở khóa.
3. Mở chatbot, gửi câu hỏi hoặc chọn gợi ý, đóng/mở lại.
4. Quét lại: chatbot trở về đóng/khóa; kết quả của câu trước không cấp quyền cho câu mới.
5. Kiểm thử fixture: `node scripts/check-game-chat-access.mjs browser`. Build cô lập: `node scripts/check-game-chat-access.mjs build`.

Không thay ảnh/nền/animation, nội dung quiz, thuật toán chấm, TTS, PWA, matching, Published Knowledge hoặc thanh toán. Browser kiểm tra chức năng bị ảnh hưởng; không phải chứng nhận lại toàn bộ các hệ thống này.

Rollback bằng cách hoàn tác đúng các hunks của task trong năm file runtime và các test tương ứng; không cần migration, xóa dữ liệu, sửa env hoặc reset ledger. Các file `.env.*.example` đã có trước task được giữ nguyên. Không commit/push/deploy.

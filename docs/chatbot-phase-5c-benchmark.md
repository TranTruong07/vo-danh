# Phase 5C — Benchmark matching

Ngày báo cáo: 16/10/2026 (Asia/Bangkok). Đây là đánh giá kỹ thuật, không phải phê duyệt nội dung lịch sử.

## Dữ liệu và cách chấm

- 120 câu trong `tests/fixtures/chat-ai-benchmark.ts`: 99 câu có ID mục tiêu, 21 câu kỳ vọng `no_match`.
- Không câu nào trùng canonical hoặc alias sau chuẩn hóa của 59 câu Published tại thời điểm đo.
- Nhãn được soạn độc lập với output Gemini, đối chiếu excerpt/locator từ snapshot v4. Script kiểm tra SHA-256 DOCX và nội dung excerpt bằng các block trong extraction manifest. Không đưa snapshot draft vào runtime hoặc gửi lên Gemini.
- 29 nhãn có chồng lấn nội dung hoặc nhiều cách hiểu mang `needsReview=true`, loại khỏi số liệu chính; không tự coi đây là nhãn đã được quản trị viên duyệt.
- Nhóm chấm chính: 91 câu, gồm 77 positive và 14 negative. Có câu tự nhiên, viết tắt, không dấu, đảo từ, lỗi chính tả nhẹ, ngày tháng, địa danh, phủ định, ngoài phạm vi, đa ý, Hà Nội/Huế/Sài Gòn và tổng khởi nghĩa/Tuyên ngôn Độc lập.
- Kết quả từng mẫu, locator, nhãn, các ID legacy và candidate: [JSON kết quả](chatbot-phase-5c-benchmark-results.json). Giữ cả 29 mẫu chưa chấm để quản trị viên rà soát.

## Công thức

- **Top-1 accuracy**: số mẫu có ID đầu tiên đúng ID kỳ vọng, hoặc không có ID khi kỳ vọng `no_match`, chia tổng mẫu được chấm.
- **Positive Top-1**: số positive có ID đầu tiên đúng / số positive.
- **Recall@3**: số positive có ID kỳ vọng trong tối đa 3 kết quả / số positive.
- **Candidate Recall@8**: số positive có ID kỳ vọng trong tập tối đa 8 ứng viên (hoặc đã exact) / số positive. Đây là khả năng lấy ứng viên, không phải độ chính xác Gemini.
- **No-match precision**: số negative không có kết quả / tổng mẫu không có kết quả.
- **No-match recall**: số negative không có kết quả / số negative.
- **False suggestion rate**: số negative bị trả ít nhất một ID / số negative. Không bao gồm mọi kiểu sai Top-1 trên positive.
- **Calls/request**: số lần gọi generation / số request; **cache hit rate**: cache hit / số request đi vào tra cache.
- P50/P95 dùng nearest-rank. Thời gian legacy chỉ đo hàm matcher trong process, không bao gồm MongoDB, HTTP hoặc trình duyệt. Mẫu số bằng 0 được ghi `null`, không giả thành 0%.

## Kết quả 120 mẫu offline

| Chỉ số, trên 91 mẫu được chấm | Legacy | Gemini tắt |
| --- | ---: | ---: |
| Top-1 accuracy | 48,35% (44/91) | Như legacy |
| Positive Top-1 | 40,26% (31/77) | Như legacy |
| Recall@3 | 41,56% (32/77) | Như legacy |
| No-match precision | 25,00% (13/52) | Như legacy |
| No-match recall | 92,86% (13/14) | Như legacy |
| False suggestion rate | 7,14% (1/14) | Như legacy |
| P50 / P95 matcher | 16,43 / 18,69 ms | Không đo pipeline riêng |
| Gemini calls/request | 0 | 0 |
| Lỗi thực thi | 0 | Không gọi provider |

Candidate Recall@8 là **100% (77/77)** trên nhóm positive được chấm của bộ này. Không suy rộng ra câu hỏi người dùng thật, và không coi đây là kết quả Gemini. Matcher Fuse và ngưỡng 0,25 không thay đổi. Bộ mẫu được soạn trong cùng đợt triển khai nên vẫn có selection bias; cần thêm đánh giá độc lập của người dùng.

## Live smoke có kiểm soát

Đã thử tổng cộng **3 lần generation** và 3 lần đọc metadata model. Không chạy 120 câu qua Gemini. Tất cả dùng câu thử nghiệm công khai về Hà Nội, không dùng nội dung chat thật của người chơi.

| Model / timeout | Generation | Kết quả | Độ trễ toàn helper |
| --- | ---: | --- | ---: |
| gemini-2.5-flash-lite / 5 giây | 1 | Metadata thành công; generation HTTP 404; fallback | 755 ms |
| gemini-3.5-flash-lite / 5 giây | 1 | Metadata thành công; generation không hoàn tất thành công; fallback | 4.484 ms |
| gemini-3.5-flash-lite / 10 giây | 1 | Metadata thành công; lỗi tại bước generation, phân loại `unavailable`; fallback | 9.698 ms |

Cả ba lần fallback đều đưa gợi ý Huế cho câu hỏi Hà Nội do legacy matcher hiện tại; đây là một lỗi gợi ý đã quan sát, không phải câu trả lời Gemini. Giữ nguyên thuật toán cũ theo phạm vi yêu cầu. Người chơi vẫn phải chọn một câu hỏi rõ ràng mới nhận lời đáp Published.

- Top-1 và Recall@3 của **ba request smoke này**: 0/3; chỉ có một cách hỏi độc lập, không phải thống kê chất lượng.
- Calls/request: 1; cache hit: 0/3; số lỗi/fallback: 3/3.
- P50/P95 gộp của ba request: 4.484 / 9.698 ms. Vì khác model/timeout và đều thất bại, không dùng để dự báo độ trễ production.
- No-match precision/recall và false suggestion rate của smoke: không tính được, không có mẫu negative.
- **Gemini-assisted Top-1/Recall@3 trên bộ 120 câu: chưa đo (`null`).** Không có bằng chứng Gemini tốt hơn baseline.
- Cache hit, no_match, ID giả, timeout, quota, output sai và revalidation được kiểm tra bằng mock, không thay thế live quality benchmark.

Google hiện ghi model 2.5 chỉ dành cho người dùng đã sử dụng trước đó; mới đọc được metadata không đảm bảo gọi generation được. Nguyên nhân cụ thể của hai lỗi 3.5 chưa xác định; không quy kết là hết quota hoặc key sai. Xem [model 2.5](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite), [model 3.5](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).

## Chạy lại

```powershell
# Chỉ đọc MongoDB + nguồn local, không gọi Gemini, không sửa knowledge.
rtk proxy node --conditions=react-server --import tsx scripts/benchmark-chat-ai.ts

# Chỉ chạy live khi người vận hành cho phép tiêu thụ quota; mặc định tối đa 3 generation.
rtk proxy node --conditions=react-server --import tsx scripts/check-chat-ai-live.ts --live --model=gemini-3.5-flash-lite --limit=1 --timeout=10000
```

Script live chỉ opt-in trong process riêng; không sửa `.env.local`. Dừng chuỗi kiểm tra khi gặp lỗi provider; không retry tự động. Cache probe, nếu có, đặt quota bằng 0 để không phát sinh generation thứ tư. Các lần chạy lại là lượt dùng API mới, cần theo dõi tổng quota, không dùng script này để chạy benchmark hàng loạt.

Trước khi đo đầy đủ: rà soát 29 nhãn, xác nhận model thực sự generate được và quota hiện có, thống nhất ngân sách gọi API. Không dùng kết quả model để sửa nhãn kỳ vọng, không giảm threshold để cải thiện báo cáo.

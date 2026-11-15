# BÁO CÁO CHẨN ĐOÁN CHỨC NĂNG TÌM KIẾM CÂU HỎI NÂNG CAO CỦA CHATBOT

> **Thời điểm kiểm tra:** 05/11/2026  
> **Phạm vi kiểm tra:** Chatbot người chơi (`/api/chat`, `CharacterChatWidget`), cơ chế matching đa tầng, trạng thái Gemini AI matching, cấu hình môi trường và liên kết với kho kiến thức mới.  
> **Nguyên tắc thực hiện:** Chỉ kiểm tra độc lập, không sửa code, không đổi biến môi trường, không gọi Gemini API, không ghi MongoDB, không approve/publish dữ liệu, không deploy.

---

## 1. NGUYÊN NHÂN THÔNG BÁO XUẤT HIỆN

### 1.1. Chuỗi thông báo gốc
Thông báo trên giao diện người chơi:
> *"Phần tìm câu hỏi nâng cao đang tạm gián đoạn. Bạn có muốn hỏi một trong những câu đã công bố dưới đây không?"*

### 1.2. Cơ chế kích hoạt chính xác
1. Khi người chơi gửi câu hỏi mà **không trùng khớp chính xác 100%** (exact match) với câu hỏi chuẩn (`canonicalQuestion`) hoặc các cách hỏi khác (`aliases`) của một câu hỏi đã công bố trong kho tri thức:
2. Hệ thống kiểm tra cấu hình: biến `CHAT_AI_MATCHING_ENABLED` đang được bật là `true` trong `.env.local` kèm theo `GEMINI_API_KEY`.
3. Hệ thống chuyển sang tầng **AI-assisted matching** (`assistChatMatch`) để gọi Google Gemini API nhằm suy luận ngữ nghĩa câu hỏi người chơi so với các ứng viên câu hỏi đã công bố.
4. **Lỗi xảy ra tại bước gọi Gemini:** Lượt gọi gặp lỗi và bị phân loại vào nhóm `providerFailure` (cụ thể nhật ký ghi nhận lỗi `sdk_configuration` / lỗi cấu hình SDK / HTTP 400).
5. Khi gặp lỗi từ nhà cung cấp AI, hàm `assistChatMatch` kích hoạt cờ an toàn: `unavailable = true`.
6. Hệ thống tự động kích hoạt **fallback an toàn** (`local_fallback`), sử dụng thuật toán xếp hạng từ khóa tiếng Việt nội bộ (`confidentVietnameseSuggestions`).
7. Vì thuật toán nội bộ vẫn tìm thấy câu hỏi gợi ý phù hợp (`match.type === 'suggest'`), nhưng cờ `unavailable === true`, hệ thống tại [`server/services/chat.ts`](file:///d:/UI_Web_Tinh/vo-danh/server/services/chat.ts#L74-L75) trả về:
   ```typescript
   return finish({
     status: 'suggest',
     suggestions: match.suggestions,
     reason: 'provider_unavailable',
     message: 'Phần tìm câu hỏi nâng cao đang tạm gián đoạn. Bạn có muốn hỏi một trong những câu đã công bố dưới đây không?'
   });
   ```
8. Phía Client nhận được `status: 'suggest'` kèm `message`, component hiển thị nội dung lời nhắn này từ nhân vật và render danh sách các nút gợi ý bên dưới.

---

## 2. KIỂM TRA FRONTEND & BACKEND

### 2.1. Frontend
- **Vị trí hiển thị:**
  - File: [`features/game/character-chat.tsx`](file:///d:/UI_Web_Tinh/vo-danh/features/game/character-chat.tsx#L157-L163) (Component `CharacterChatWidget`).
  - Helper định dạng: [`features/game/chat-client.ts`](file:///d:/UI_Web_Tinh/vo-danh/features/game/chat-client.ts#L6-L11) trong hàm `chatResponseText(response)`:
    ```typescript
    export function chatResponseText(response: ChatResponse): string {
      if (response.status !== 'suggest') return response.answer;
      return response.message || (response.suggestions.length
        ? 'Có phải bạn muốn hỏi một trong những câu này?'
        : 'Mình chưa tìm được câu phù hợp. Bạn thử diễn đạt rõ hơn nhé.');
    }
    ```
- **Điều kiện render:**
  - Khi `response.status === 'suggest'` và trường `response.message` có nội dung từ server, UI sẽ hiển thị chuỗi text đó thay vì câu chào mặc định.
  - Ngay bên dưới tin nhắn sẽ là danh sách các nút bấm câu hỏi gợi ý (`choices(message.response.suggestions)`).
- **Trạng thái chuyển sang Fallback:** Chatbot **đang chủ động chuyển sang fallback thành công**. Đây không phải lỗi crash ứng dụng; hệ thống fallback bảo đảm người chơi vẫn nhận được câu hỏi gợi ý mà không bị đứt quãng cuộc trò chuyện.
- **Trạng thái loading, error, disabled:**
  - Trong lúc gửi: `busy = true`, input và các nút bị khóa (`disabled`), hiển thị dấu ba chấm "Đang tìm trong tư liệu…".
  - Khi server phản hồi: `busy = false`, không bị đánh dấu `failed` (không có nhãn "Chưa nhận được phản hồi").
  - Các nút câu hỏi gợi ý được mở hoàn toàn bình thường để người chơi click chọn và nhận câu trả lời.

### 2.2. Backend & Luồng xử lý matching
- **API Endpoint:** [`app/api/chat/route.ts`](file:///d:/UI_Web_Tinh/vo-danh/app/api/chat/route.ts) tiếp nhận `POST`, ủy quyền cho `sendChatMessage` trong [`server/services/chat.ts`](file:///d:/UI_Web_Tinh/vo-danh/server/services/chat.ts).
- **Luồng so khớp 4 tầng:**
  ```text
  Người chơi gửi câu hỏi
         │
         ▼
  1. Canonical & Alias Exact Match (matchChatQuestion)
     ├── Khớp 100% -> Trả lời ngay lập tức từ DB (Không qua AI, không qua fallback)
     └── Không khớp chính xác
            │
            ▼
  2. Kiểm tra cờ AI Matching (chatAiConfig)
     ├── Nếu CHAT_AI_MATCHING_ENABLED === false:
     │     └── Chuyển sang Tầng 3 (Local heuristic), trả về gợi ý tự nhiên:
     │         "Có phải bạn muốn hỏi một trong những câu này?" (KHÔNG có thông báo gián đoạn)
     └── Nếu CHAT_AI_MATCHING_ENABLED === true:
            │
            ▼
  3. AI-Assisted Matching (assistChatMatch via Gemini API)
     ├── Kiểm tra Cache SHA-256 (readAiCache)
     ├── Kiểm tra Quota giới hạn gọi (reserveAiQuota)
     ├── Gọi Gemini SDK (generateQuestionMatch)
     └── GẶP LỖI (providerFailure)
            │
            ▼
  4. Local Fallback & Vietnamese Ranking (confidentVietnameseSuggestions)
     ├── Thuật toán nội bộ lọc ra tối đa 3 câu hỏi liên quan nhất
     └── Vì cờ unavailable = true -> Gắn thông báo xin lỗi tạm gián đoạn.
  ```

---

## 3. KIỂM TRA FEATURE FLAGS VÀ BIẾN MÔI TRƯỜNG

*(Lưu ý: Tuân thủ quy định bảo mật, giá trị nhạy cảm/khóa API đã được ẩn)*

| Tên biến môi trường | Giá trị hiện tại (.env.local) | Mặc định hệ thống | Nhận định trạng thái |
| :--- | :--- | :--- | :--- |
| `CHAT_AI_MATCHING_ENABLED` | `true` | `false` | **Đang bật**. Đây là nguyên nhân khiến hệ thống cố gắng gọi Gemini matching khi không exact match. |
| `CHAT_AI_AUTO_ANSWER` | `false` | `false` | **Đang tắt** (Thiết kế hệ thống: AI không bao giờ được tự động sinh câu trả lời trực tiếp). |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | `gemini-3.5-flash-lite` | Đang cấu hình model này. |
| `CHAT_AI_TIMEOUT_MS` | `5000` | `5000` | 5 giây. |
| `CHAT_AI_MAX_CANDIDATES` | Đã cấu hình | `8` | Giới hạn 8 ứng viên đưa vào prompt so khớp. |
| `CHAT_AI_CALLS_PER_MINUTE` | `5` | `5` | Hạn mức gọi Gemini ứng dụng / phút. |
| `CHAT_AI_CALLS_PER_DAY` | `100` | `100` | Hạn mức gọi Gemini ứng dụng / ngày. |
| `GEMINI_API_KEY` | Đã cấu hình (SET) | Rỗng | Khóa API hiện diện trên server. |

### Bằng chứng từ nhật ký tương tác (`chat_interactions`):
Kiểm tra bản ghi lịch sử tương tác người chơi gần nhất ghi nhận:
```json
{
  "question": "quân lệnh số 1 có nội dung gì",
  "matchingSource": "local_fallback",
  "outcome": "suggested",
  "providerFailure": "sdk_configuration",
  "suggestedQuestionIds": ["cmtt45-q090"],
  "latencyMs": 1811
}
```
- Lỗi được hệ thống phân loại là `sdk_configuration` (thường do yêu cầu gọi SDK trả về HTTP 400 hoặc cấu hình tham số/model/schema bị từ chối).
- Do gặp lỗi trên, hệ thống ghi nhận `providerFailure` và trả về `local_fallback` kèm thông báo gián đoạn.

---

## 4. LIÊN HỆ VỚI KHO KIẾN THỨC MỚI

### 4.1. Collection Chatbot đang đọc
- Tuyệt đối không đọc file nháp JSON.
- Đọc qua pipeline MongoDB Aggregate trong [`server/repositories/chat-knowledge.ts`](file:///d:/UI_Web_Tinh/vo-danh/server/repositories/chat-knowledge.ts):
  - Collection gốc: `knowledge_questions`
  - Collection liên kết: `knowledge_question_revisions` qua `$lookup`

### 4.2. Điều kiện một câu hỏi xuất hiện trong Chatbot (`publishedChatPipeline`)
Một câu hỏi **chỉ được phép xuất hiện** trong danh mục so khớp của Chatbot khi thỏa mãn đồng thời:
1. `topicId === "cach-mang-thang-tam-1945"`.
2. Trong `knowledge_questions`: Trường `publishedVersionId` phải có giá trị chuỗi khác rỗng (đã được công bố).
3. Trong `knowledge_question_revisions`:
   - `_id === publishedVersionId`.
   - `status === "approved"`.
   - `reviewedBy` và `reviewedAt` hợp lệ (đã có kiểm duyệt viên xác nhận).
   - Có đầy đủ `approvedAnswer`, `canonicalQuestion`, `aliases`, `source.document`, `source.sectionId`, `source.excerpt`.
   - **Đầy đủ lời đáp cho cả 4 nhân vật** (`characterAnswers.pham-van-dong`, `characterAnswers.hoang-quoc-viet`, `characterAnswers.truong-chinh`, `characterAnswers.vo-nguyen-giap`).

### 4.3. Hiện trạng thực tế trong Database (`vo_danh`)
- Tổng số câu hỏi trong DB: **64 câu** (`cmtt45-q061` đến `cmtt45-q124`).
- Số câu đã Approved: **1 câu** (`cmtt45-q090:v1`).
- Số câu đã Published: **1 câu** (`cmtt45-q090` — *"Quân lệnh số 1 ban bố đêm 13/8/1945 có những nội dung chủ yếu nào?"*).
- **63 câu còn lại:** Đều đang ở trạng thái `draft`, chưa duyệt, chưa công bố nên Chatbot người chơi **hoàn toàn chưa tải vào bộ nhớ so khớp**.

### 4.4. Ánh xạ nhân vật (Character Mapping)
- **Nhân vật Lê Duẩn (`le-duan`):**
  - **TUYỆT ĐỐI KHÔNG CÒN TỒN TẠI** trong danh sách nhân vật hoạt động (`KNOWLEDGE_CHARACTERS`).
  - Trong logic ánh xạ tại [`server/services/chat-characters.ts`](file:///d:/UI_Web_Tinh/vo-danh/server/services/chat-characters.ts#L44), nếu biến môi trường `CHAT_CHARACTER_HOANG_QUOC_VIET_ID` chưa đặt, hệ thống sẽ tái sử dụng `CHAT_CHARACTER_LE_DUAN_ID` của thẻ QR cũ để **tự động gán cho Hoàng Quốc Việt**.
  - Nhân vật phản hồi thực tế của người chơi luôn là **Hoàng Quốc Việt**, không bao giờ hiển thị Lê Duẩn.
- **Bốn nhân vật chính thức:**
  1. `pham-van-dong` -> Ánh xạ qua `CHAT_CHARACTER_PHAM_VAN_DONG_ID` (Đã cấu hình).
  2. `hoang-quoc-viet` -> Ánh xạ qua `CHAT_CHARACTER_HOANG_QUOC_VIET_ID` (hoặc fallback từ `CHAT_CHARACTER_LE_DUAN_ID`).
  3. `truong-chinh` -> Ánh xạ qua `CHAT_CHARACTER_TRUONG_CHINH_ID` (Đã cấu hình).
  4. `vo-nguyen-giap` -> Ánh xạ qua `CHAT_CHARACTER_VO_NGUYEN_GIAP_ID` (Đã cấu hình).

---

## 5. TỔNG KẾT VÀ HƯỚNG KHÔI PHỤC AN TOÀN

### 5.1. Bảng trạng thái chức năng

| Thành phần chức năng | Trạng thái hiện tại | Chi tiết |
| :--- | :---: | :--- |
| **Exact Match (Canonical)** |  HOẠT ĐỘNG | Người chơi hỏi đúng nguyên văn câu công bố -> Trả lời ngay tức thì. |
| **Exact Match (Aliases)** |  HOẠT ĐỘNG | Người chơi hỏi đúng một trong các alias đã công bố -> Trả lời ngay. |
| **Local Fuzzy Vietnamese Ranking** |  HOẠT ĐỘNG | Tìm được câu hỏi liên quan khi diễn đạt gần giống. |
| **Gemini AI Matching** | ❌ LỖI / GIÁN ĐOẠN | Gặp lỗi `sdk_configuration` khi gọi provider Gemini. |
| **Fallback Handling** |  HOẠT ĐỘNG | Không bị crash, tự động chuyển về câu hỏi gợi ý từ Local Fallback. |
| **Kho kiến thức khả dụng** | ⚠️ HẠN CHẾ | Mới chỉ có duy nhất **1 câu hỏi được Publish** (`cmtt45-q090`), 63 câu còn lại đang ở Draft. |

---

### 5.2. Cách khôi phục an toàn (Không cần can thiệp code)

Tùy theo định hướng vận hành của dự án, có 2 phương án khôi phục:

#### Phương án 1: Tắt Gemini Matching, sử dụng hoàn toàn bộ so khớp tiếng Việt nội bộ (Khuyên dùng theo đúng định hướng "KHÔNG AI")
Như bạn đã yêu cầu ở Phase A: *"KHÔNG sử dụng Gemini API hoặc bất kỳ dịch vụ AI bên thứ ba nào"*.
- **Hành động:** Trong file `.env.local` (và trên cấu hình Production), chuyển:
  ```env
  CHAT_AI_MATCHING_ENABLED=false
  ```
- **Kết quả:**
  1. Khi người chơi hỏi câu tương tự (không exact), hệ thống dùng ngay bộ thuật toán tiếng Việt nội bộ (`local_fallback`).
  2. Vì AI matching chủ động tắt (không phải lỗi gián đoạn), cờ `unavailable` sẽ là `false`.
  3. Thông báo xin lỗi *"Phần tìm câu hỏi nâng cao đang tạm gián đoạn..."* sẽ **biến mất hoàn toàn**.
  4. Chatbot sẽ hiển thị lời dẫn thân thiện, tự nhiên:
     > *"Có phải bạn muốn hỏi một trong những câu này?"*
     kèm theo các nút bấm gợi ý câu hỏi.
  5. Tuyệt đối không tiêu tốn quota, không phụ thuộc mạng ra ngoài tới Google.

#### Phương án 2: Khi muốn phục hồi Gemini AI Matching
Nếu sau này muốn bật lại tính năng AI matching:
1. Kiểm tra lại tính hợp lệ của `GEMINI_API_KEY` trong Google AI Studio.
2. Kiểm tra tính tương thích của `GEMINI_MODEL` (ví dụ đổi sang model được hỗ trợ chính thức cho tài khoản).
3. Sau khi gọi thành công tới Gemini, cờ `unavailable` sẽ là `false` và câu hỏi gợi ý từ Gemini sẽ xuất hiện mà không kèm thông báo gián đoạn.

#### Bước tiếp theo cho kho tri thức:
- Admin truy cập `/admin/knowledge` để tiến hành đối soát, **Phê duyệt (Approve)** và **Công bố (Publish)** các câu hỏi từ `cmtt45-q063` đến `cmtt45-q124` để mở rộng kho câu hỏi của Chatbot từ 1 câu lên tối đa 64 câu.


# Rà soát kiến thức mới — Phase 1

Ngày kiểm tra: 2026-11-02. **Chưa approve/publish.** Các nhận xét là checklist biên tập, không phải xác nhận lịch sử.

Cập nhật 2026-11-03: đã hoàn tất kế hoạch ý hỏi và kiểm thử riêng persona/grounding. Hai Draft và toàn bộ nội dung lịch sử dưới đây giữ nguyên; R01–R10 chưa được tự giải quyết. [Kế hoạch chi tiết và batch](chatbot-rebuild-generation-plan.md).

## Nguồn và phạm vi

Nguồn duy nhất cho generation: `docs/source/Tong-hop-kien-thuc-moi.docx`. SHA-256 `fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e`. Đọc toàn bộ 395 paragraph blocks (394 không rỗng), 0 bảng; locators zero-based giữ thứ tự DOCX. Manifest: `knowledge/new-source-manifest.json`.

| Mục | Nội dung |
|---|---|
| I | Bối cảnh thế giới, Nhật đầu hàng, đảo chính 9/3, nạn đói, thời cơ trước khi quân Đồng minh vào. |
| II | Chuẩn bị từ 1941, Hội nghị Trung ương 8, Việt Minh, lực lượng vũ trang, chỉ thị 12/3 và khu giải phóng. |
| III | Vai trò Trường Chinh, Võ Nguyên Giáp, Phạm Văn Đồng, Hoàng Quốc Việt. |
| IV | 15 tiểu mục từ 13/8 đến 2/9: ủy ban khởi nghĩa, Quân lệnh 1, hội nghị, địa phương, chính phủ, thoái vị và Tuyên ngôn. |
| V | Công việc sau thắng lợi của Phạm Văn Đồng, Võ Nguyên Giáp, Hoàng Quốc Việt, Trường Chinh. |
| VII | Nguyên nhân chủ quan và khách quan. |
| VIII | Ý nghĩa trong nước và quốc tế; tiếp theo là Kết luận chung. |

Mốc/địa danh cần phân biệt: 28/1/1941; 10–19/5/1941, Pác Bó; 22/12/1944; 9/3 và 12/3/1945; 4/6, Tân Trào; 13–15/8; 16/8 và 20/8, Thái Nguyên; 19/8 Hà Nội; 23/8 Huế; 25/8 Sài Gòn; 27/8; 30/8 Ngọ Môn; 2/9 Ba Đình. Đây là danh mục theo nguồn, không phải kết luận phê duyệt.

## Điểm cần rà soát

### R01 — NEEDS_REVIEW — số thứ tự mục

Có PHẦN I–V rồi VII–VIII; không có PHẦN VI. Không tự chèn phần lịch sử còn thiếu.

### R02 — NEEDS_REVIEW — trích nguồn

Chuỗi “Thành ủy Hồ Chí Minh+3” và “baochinhphu.vn+6” chưa đủ tên bài, URL, tác giả, ngày. Không coi chúng là citation đã được kiểm chứng.

### R03 — NEEDS_REVIEW — Hoàng Quốc Việt và Nam Bộ

Mục III.4 nêu đặc phái viên với phong trào giành chính quyền; V.3 nêu đến Sài Gòn ngày 27/8 và cuộc gặp ngày 7/9. Cần làm rõ trình tự; không suy diễn trực tiếp chỉ huy khởi nghĩa Sài Gòn 25/8.

### R04 — NEEDS_REVIEW — hội nghị và Quân lệnh số 1

Đối chiếu các mốc 13–15/8 trong nguồn mới. Phân biệt người soạn Trần Huy Liệu, người ký Võ Nguyên Giáp, việc ban bố ngày 13/8 và việc đọc; không đưa chi tiết ngày đọc từ nguồn cũ sang.

### R05 — NEEDS_REVIEW — diễn biến địa phương

Phân biệt Hà Nội 19/8, Huế 23/8, Sài Gòn 25/8, đoàn quân xuất phát 16/8 và tiến công Thái Nguyên 20/8. Không ghép thành một sự kiện.

### R06 — NEEDS_REVIEW — trích lời nhân vật

Các đoạn lời kêu gọi/lời trích trong nguồn cần đối chiếu ấn phẩm gốc. Không gán phát ngôn đó cho bốn persona hoặc coi lời dẫn mô phỏng là lời nói lịch sử.

### R07 — NEEDS_REVIEW — ngữ cảnh đoạn nguồn

Nhiều gạch đầu dòng và đại từ “ông” phụ thuộc đoạn trước. Extractor upload theo style có thể giữ heading cũ khi PHẦN IV không được đánh style. Manifest offline nhận PHẦN từ chữ, giữ paragraphIndex. Không chọn bullet rời cho generation nếu thiếu chủ ngữ.

### R08 — NEEDS_REVIEW — kết luận và nguồn kiểm chứng

KẾT LUẬN CHUNG không có số mục riêng, manifest hiện tiếp tục nhãn VIII.2; phải đọc heading/locator gốc. Toàn bộ dữ kiện được kiểm tra khớp tài liệu, chưa được xác nhận đúng lịch sử bởi người duyệt.

### R09 — NEEDS_REVIEW — q061

Giữ nguyên cụm “sau hơn 30 năm hoạt động ở nước ngoài” theo body/24. Người duyệt cần kiểm tra độ chính xác của lượng thời gian này; không tự sửa hay bổ sung mốc rời nước từ nguồn ngoài.

### R10 — NEEDS_REVIEW — nghĩa alias/persona

Hai câu chỉ qua kiểm tra schema/grounding và rà soát biên tập chưa phê duyệt. Các alias giữ cùng ngày, người, sự kiện/địa điểm hỏi; máy không chứng minh tương đương ngữ nghĩa. Bốn câu khác lời dẫn nhưng giữ nguyên toàn bộ lõi thông tin.

## Hai bản nháp AI thật

Không chỉnh sửa câu hỏi, alias, neutral hoặc persona do AI trả về để làm đẹp kết quả. Chỉ gắn ID/version/locators, thời gian, trạng thái draft và ghi chú quản trị. Mỗi câu có 2 aliases, 4 persona; không có Lê Duẩn trong đáp án mới.

### cmtt45-q061 — Ngày 28/1/1941 diễn ra sự kiện gì liên quan đến Nguyễn Ái Quốc?

Nguồn `II.1` / `body/24`. Trạng thái **draft v1**, không reviewer.

**Aliases:**

- Vào ngày 28/1/1941, Nguyễn Ái Quốc đã làm gì?
- Sự kiện ngày 28/1/1941 gắn liền với Nguyễn Ái Quốc là gì?

**Neutral / excerpt:**

Ngày 28/1/1941: Nguyễn Ái Quốc trở về nước sau hơn 30 năm hoạt động ở nước ngoài.

**pham-van-dong:** Để bạn dễ theo dõi, tài liệu nêu: Ngày 28/1/1941: Nguyễn Ái Quốc trở về nước sau hơn 30 năm hoạt động ở nước ngoài.

**hoang-quoc-viet:** Cháu cùng bác nắm rõ điều này nhé: Ngày 28/1/1941: Nguyễn Ái Quốc trở về nước sau hơn 30 năm hoạt động ở nước ngoài.

**truong-chinh:** Bạn hãy chú ý điểm cốt lõi này: Ngày 28/1/1941: Nguyễn Ái Quốc trở về nước sau hơn 30 năm hoạt động ở nước ngoài.

**vo-nguyen-giap:** Cháu cùng xem đoạn tư liệu này nhé: Ngày 28/1/1941: Nguyễn Ái Quốc trở về nước sau hơn 30 năm hoạt động ở nước ngoài.

- [ ] Kiểm tra sự thật lịch sử, ngày tháng, địa danh với nguồn gốc.
- [ ] Kiểm tra nghĩa hai aliases; chỉnh revision nếu cần.
- [ ] Kiểm tra bốn lời dẫn, không gán trải nghiệm hay vai trò trực tiếp.
- [ ] Admin quyết định duyệt/từ chối bằng tài khoản thật.

### cmtt45-q062 — Ngày 2/9/1945, tại đâu, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập?

Nguồn `IV.15` / `body/310`. Trạng thái **draft v1**, không reviewer.

**Aliases:**

- Ngày 2/9/1945, tại địa điểm nào, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập?
- Vào ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập thay mặt Chính phủ lâm thời ở đâu?

**Neutral / excerpt:**

Ngày 2/9/1945, tại Quảng trường Ba Đình, Hà Nội, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập.

**pham-van-dong:** Để bạn dễ theo dõi, tài liệu nêu: Ngày 2/9/1945, tại Quảng trường Ba Đình, Hà Nội, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập.

**hoang-quoc-viet:** Cháu cùng bác nắm rõ điều này nhé: Ngày 2/9/1945, tại Quảng trường Ba Đình, Hà Nội, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập.

**truong-chinh:** Bạn hãy chú ý điểm cốt lõi này: Ngày 2/9/1945, tại Quảng trường Ba Đình, Hà Nội, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập.

**vo-nguyen-giap:** Cháu cùng xem đoạn tư liệu này nhé: Ngày 2/9/1945, tại Quảng trường Ba Đình, Hà Nội, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập.

- [ ] Kiểm tra sự thật lịch sử, ngày tháng, địa danh với nguồn gốc.
- [ ] Kiểm tra nghĩa hai aliases; chỉnh revision nếu cần.
- [ ] Kiểm tra bốn lời dẫn, không gán trải nghiệm hay vai trò trực tiếp.
- [ ] Admin quyết định duyệt/từ chối bằng tài khoản thật.

## Khoảng trống và kế hoạch tiếp

2 câu thăm dò chỉ sử dụng body/24 và body/310. Kế hoạch ngày 03/11 xác định 68 ý hỏi có ý nghĩa; 2 ý có Draft tương ứng, tức 2/68 = 2,94% coverage theo ý hỏi dự kiến. Published coverage 0/68. Không phải số đo entailment độc lập cho mọi dữ kiện hoặc coverage các aliases; không tuyên bố bao phủ 395 blocks/toàn tài liệu. Phần lớn bối cảnh, chuẩn bị lực lượng, vai trò nhân vật, diễn biến, kết quả, nguyên nhân, ý nghĩa chưa có câu mới.

Sau khi chủ dự án xem 2 mẫu: rà soát nguồn R01–R10; xác định các cụm nguồn liên tục đủ ngữ cảnh; lập danh sách ý hỏi theo từng mục; kiểm tra trùng theo canonical/alias và lõi neutral; xin ngân sách lượt gọi mới trước khi mở rộng. Checkpoint 2 lượt hiện đã hết; không xóa ledger để chạy lại. Không tự chuyển Phase 2.

## Rà soát bổ sung ngày 2026-11-03

- Schema/locator của cả hai Draft hợp lệ; 8/8 characterAnswers giữ toàn bộ neutral. Bốn lời dẫn khác nhau trong mỗi câu nhưng từng persona lặp cùng frame trên cả hai câu (2/2). Không coi đây là bốn đơn vị kiến thức hay bốn cách giải thích độc lập.
- Hai frame hiện được cho phép của mỗi persona đều qua mock grounding. Đề xuất frame tự nhiên mới được kiểm thử riêng và vẫn bị đánh insufficientEvidence do chưa trong whitelist. Không sửa prompt/validator/answers. Thân đáp án vẫn phải nguyên văn factual core; không tự nới lỏng để tăng độ tự nhiên.
- Các test thay ngày, tên nhân vật, lược nội dung cốt lõi, thêm trải nghiệm ngôi thứ nhất hoặc dữ kiện địa danh ngoài nguồn đều bị chặn. Citation giả và evidence nhiều chunk cũng bị chặn. Đây là bảo vệ kỹ thuật, không phải người duyệt xác nhận lịch sử.
- 62 ý mới có nguồn để lập kế hoạch; 4 ý HOLD: III-VIET-SOUTH, V-VIET, IV-CALL, IV-DECLARATION-QUOTE. Không tự sinh khi timeline hoặc trích lời còn chưa rõ. Hai ý Hoàng Quốc Việt có thể được gộp sau khi làm rõ trước/sau thắng lợi, chưa tính là hai câu chắc chắn cần xuất bản.
- Dedupe với kho hiện tại (2 revisions và 1 proposal có nội dung) chỉ nhận exact ở 2 ý q061/q062 đã loại khỏi generation. Hai cặp nội bộ bị gắn possible_duplicate: III-VIET-1945 / IV-GIAP-ELECTION; VIII-VIETNAM / VIII-WORLD. Cần giữ rõ tên nhân vật/chức vụ và phạm vi trong nước/quốc tế, rồi kiểm tra lại output AI thực tế.
- Mọi nhóm đều cần R02/R08 về nguồn kiểm chứng, không chỉ những hàng có cảnh báo riêng trong kế hoạch. Không coi 62 ý đề xuất là đã approve hoặc không còn vấn đề lịch sử.

Các span và checklist đầy đủ nằm trong `knowledge/new-generation-plan.json`; đây là artifact kế hoạch private, không phải file import. Không đưa vào public/PWA và không thay `knowledge/new-questions-draft.json`.

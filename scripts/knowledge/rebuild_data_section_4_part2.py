# -*- coding: utf-8 -*-
"""
Rebuild Data for Section IV Part 2: Diễn biến cụ thể từ 17/8 đến 2/9/1945
Contains 14 proposed units:
- IV-HANOI-17
- IV-HANOI-MORNING
- IV-HANOI-TAKEOVER
- IV-HANOI-MEANING
- IV-THAI-NGUYEN-MEANING
- IV-HUE
- IV-SAIGON-FORCES
- IV-SAIGON-RESULT
- IV-MEETING-26
- IV-GOVERNMENT-27
- IV-NATIONWIDE-28
- IV-ABDICATION
- IV-DECLARATION-CONTENT
- IV-DECLARATION-MEANING
"""

SECTION_4_PART2_DATA = [
    # 39. IV-HANOI-17 (IV.7)
    {
        "key": "IV-HANOI-17",
        "sectionId": "IV.7",
        "canonicalQuestion": "Cuộc mít tinh ngày 17/8/1945 tại Nhà hát Lớn Hà Nội đã được lực lượng Việt Minh chuyển hướng như thế nào?",
        "aliases": [
            "Việt Minh đã biến cuộc mít tinh ngày 17/8/1945 tại Hà Nội thành sự kiện gì?",
            "Diễn biến cuộc mít tinh do chính quyền thân Nhật tổ chức ngày 17/8/1945 tại Nhà hát Lớn ra sao?",
            "Cuộc tuần hành ủng hộ cách mạng ngày 17/8/1945 ở Hà Nội bắt nguồn từ sự kiện nào?"
        ],
        "approvedAnswer": "Ngày 17/8/1945, tại Nhà hát Lớn Hà Nội, chính quyền thân Nhật tổ chức một cuộc mít tinh. Lực lượng Việt Minh đã vận động quần chúng tham gia, chuyển cuộc mít tinh thành hoạt động ủng hộ cách mạng và giành độc lập.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu ghi nhận một sự chuyển hướng tài tình: ngày 17/8/1945, chính quyền thân Nhật tổ chức mít tinh tại Nhà hát Lớn Hà Nội, song lực lượng Việt Minh đã khéo léo vận động quần chúng tham gia, biến cuộc mít tinh của đối phương thành cuộc tuần hành rầm rộ ủng hộ cách mạng và giành độc lập.",
            "hoang-quoc-viet": "Bà con chứng kiến khí thế ngút trời ngày hôm ấy: ngày 17/8/1945, chính quyền bù nhìn mở mít tinh ở Nhà hát Lớn, nhưng anh chị em Việt Minh cùng đông đảo nhân dân đã tràn vào, giương cờ đỏ sao vàng, biến thành cuộc tuần hành ủng hộ Việt Minh giành độc lập tự do.",
            "truong-chinh": "Về mặt nghệ thuật nắm bắt tâm lý quần chúng và làm chủ tình hình: ngày 17/8/1945, tại Nhà hát Lớn Hà Nội, chính quyền thân Nhật tổ chức một cuộc mít tinh; lực lượng Việt Minh đã kịp thời vận động quần chúng tham gia, chuyển hóa cuộc mít tinh thành hoạt động biểu dương lực lượng ủng hộ cách mạng và đòi quyền độc lập.",
            "vo-nguyen-giap": "Dưới góc độ thăm dò thực lực và tập dượt lực lượng trước giờ khởi nghĩa: ngày 17/8/1945, tại Nhà hát Lớn Hà Nội, cuộc mít tinh của chính quyền thân Nhật đã bị lực lượng Việt Minh dẫn dắt quần chúng chuyển hóa hoàn toàn thành cuộc tuần hành cách mạng giương cao cờ đỏ sao vàng, áp đảo tinh thần đối phương."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.7",
            "excerpt": "Ngày 17/8/1945:\nTại Nhà hát Lớn Hà Nội, chính quyền thân Nhật tổ chức một cuộc mít tinh.\nLực lượng Việt Minh đã vận động quần chúng tham gia, chuyển cuộc mít tinh thành hoạt động ủng hộ cách mạng và giành độc lập.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/205", "body/206", "body/207", "body/208", "body/209", "body/210", "body/211", "body/212"],
            "paragraphIndex": 205
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 40. IV-HANOI-MORNING (IV.7)
    {
        "key": "IV-HANOI-MORNING",
        "sectionId": "IV.7",
        "canonicalQuestion": "Sáng ngày 19/8/1945 tại Hà Nội, cuộc mít tinh lớn và các hoạt động của quần chúng diễn ra như thế nào?",
        "aliases": [
            "Các hoạt động của các tầng lớp nhân dân Hà Nội trong buổi sáng ngày 19/8/1945 là gì?",
            "Cuộc mít tinh tại Quảng trường Nhà hát Lớn Hà Nội sáng 19/8/1945 diễn ra lúc mấy giờ và gồm những ai?",
            "Diễn biến buổi sáng khởi nghĩa ngày 19/8/1945 ở Hà Nội được tài liệu mô tả ra sao?"
        ],
        "approvedAnswer": "Sáng 19/8/1945, hàng chục vạn nhân dân Hà Nội và ngoại thành gồm công nhân, nông dân, thanh niên, học sinh, sinh viên, tiểu thương, trí thức và lao động yêu nước mang cờ đỏ sao vàng, biểu ngữ tiến về trung tâm. Khoảng 10 giờ sáng, cuộc mít tinh lớn tổ chức tại Quảng trường Nhà hát Lớn; đại diện Việt Minh tuyên bố mục tiêu giành chính quyền và kêu gọi nhân dân đứng lên, sau đó mít tinh chuyển thành các đoàn biểu tình lớn.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu tái hiện buổi sáng lịch sử ngày 19/8/1945: hàng chục vạn đồng bào nội ngoại thành mang cờ đỏ sao vàng tiến về trung tâm. Khoảng 10 giờ sáng, mít tinh lớn diễn ra tại Quảng trường Nhà hát Lớn; đại diện Việt Minh tuyên bố mục tiêu giành chính quyền và kêu gọi toàn dân đứng dậy, biến cuộc tập hợp thành các đoàn biểu tình tuần hành khổng lồ.",
            "hoang-quoc-viet": "Bà con nhớ mãi sáng ngày 19/8/1945 rợp bóng cờ đỏ sao vàng: công nhân, nông dân, thanh niên, học sinh, sinh viên, tiểu thương, trí thức cùng toàn thể đồng bào đổ ra đường. Đến khoảng 10 giờ sáng, mít tinh vĩ đại tại Quảng trường Nhà hát Lớn nghe đại diện Việt Minh hiệu triệu giành chính quyền, rồi chia thành các đoàn biểu tình rầm rộ xốc tới.",
            "truong-chinh": "Về mặt quy mô huy động quần chúng sáng 19/8/1945 tại Hà Nội: hàng chục vạn nhân dân thuộc mọi tầng lớp mang cờ đỏ sao vàng tiến về trung tâm thành phố. Đúng khoảng 10 giờ sáng, cuộc mít tinh trọng thể diễn ra tại Quảng trường Nhà hát Lớn; đại diện Việt Minh tuyên bố mục tiêu giành chính quyền, chuyển hóa cuộc mít tinh thành các đoàn biểu tình vũ trang tuần hành.",
            "vo-nguyen-giap": "Dưới góc độ tổ chức lực lượng chính trị sáng 19/8: toàn thể các tầng lớp nhân dân Hà Nội và ngoại thành đã tập hợp lực lượng áp đảo tiến về trung tâm. Khoảng 10 giờ sáng, cuộc mít tinh tại Quảng trường Nhà hát Lớn tuyên bố quyết tâm giành chính quyền, phát lệnh cho các cánh quân quần chúng tuần hành thị uy uy dũng."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.7",
            "excerpt": "Sáng ngày 19/8/1945:\nHàng chục vạn nhân dân Hà Nội và các vùng ngoại thành tập trung tại nhiều địa điểm.\nCác tầng lớp tham gia gồm:\nCông nhân.\nNông dân.\nThanh niên.\nHọc sinh, sinh viên.\nTiểu thương.\nTrí thức.\nCác tầng lớp lao động và nhân dân yêu nước.\nĐoàn người mang cờ đỏ sao vàng, biểu ngữ cách mạng và tiến về khu vực trung tâm.\nKhoảng 10 giờ sáng:\nCuộc mít tinh lớn được tổ chức tại Quảng trường Nhà hát Lớn.\nĐại diện Việt Minh tuyên bố mục tiêu giành chính quyền và kêu gọi nhân dân đứng lên.\nSau đó, cuộc mít tinh chuyển thành các đoàn biểu tình lớn.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/205", "body/206", "body/207", "body/208", "body/209", "body/210", "body/211", "body/212", "body/213", "body/214", "body/215", "body/216", "body/217", "body/218", "body/219", "body/220", "body/221", "body/222", "body/223", "body/224", "body/225", "body/226", "body/227"],
            "paragraphIndex": 205
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 41. IV-HANOI-TAKEOVER (IV.7)
    {
        "key": "IV-HANOI-TAKEOVER",
        "sectionId": "IV.7",
        "canonicalQuestion": "Trong buổi trưa và chiều ngày 19/8/1945, các cơ quan trọng yếu nào ở Hà Nội đã được lực lượng cách mạng tiếp quản?",
        "aliases": [
            "Các địa điểm quan trọng được lực lượng cách mạng tiếp quản ngày 19/8/1945 tại Hà Nội gồm những nơi nào?",
            "Diễn biến tiếp quản chính quyền tại Hà Nội buổi trưa và chiều ngày 19/8/1945 ra sao?",
            "Lực lượng cách mạng đã chiếm những cơ quan đầu não nào ở Hà Nội ngày 19/8/1945?"
        ],
        "approvedAnswer": "Buổi trưa và chiều ngày 19/8/1945, các đoàn biểu tình chia thành nhiều mũi, tiếp quản các cơ quan quan trọng gồm: Phủ Khâm sai Bắc Kỳ, Sở Cảnh sát, Sở Bưu điện, Trại Bảo an binh và các cơ quan hành chính khác. Lực lượng cách mạng sử dụng sức mạnh chính trị quần chúng kết hợp lực lượng vũ trang hỗ trợ. Đến cuối ngày 19/8/1945, chính quyền ở Hà Nội hoàn toàn về tay nhân dân.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu ghi lại: trưa và chiều ngày 19/8/1945, các đoàn biểu tình chia mũi tiếp quản Phủ Khâm sai Bắc Kỳ, Sở Cảnh sát, Sở Bưu điện, Trại Bảo an binh và các cơ quan quan trọng khác. Lực lượng cách mạng dựa vào sức mạnh chính trị kết hợp vũ trang hỗ trợ; đến cuối ngày, chính quyền Hà Nội đã hoàn toàn về tay nhân dân.",
            "hoang-quoc-viet": "Khí thế áp đảo của bà con công nhân và quần chúng trưa chiều 19/8: các đoàn người chia nhau chiếm trọn Phủ Khâm sai, Trại Bảo an binh, Sở Cảnh sát, Sở Bưu điện cùng các công sở đầu não. Giặc Nhật và tay sai tê liệt, đến cuối ngày 19/8, thủ đô Hà Nội hoàn toàn thuộc về nhân dân cách mạng.",
            "truong-chinh": "Về phương thức giành chính quyền tại thủ đô: trưa và chiều 19/8/1945, các đoàn biểu tình chia thành nhiều cánh tiếp quản Phủ Khâm sai Bắc Kỳ, Sở Cảnh sát, Sở Bưu điện, Trại Bảo an binh cùng các cơ quan hành chính khác. Sức mạnh chính trị của quần chúng kết hợp lực lượng vũ trang đã làm tan rã quyền kiểm soát của địch; cuối ngày 19/8, chính quyền tại Hà Nội về tay nhân dân.",
            "vo-nguyen-giap": "Dưới góc độ tác chiến tiếp quản mục tiêu trọng yếu: các cánh quân khởi nghĩa đã chiếm lĩnh Phủ Khâm sai Bắc Kỳ, Trại Bảo an binh, Sở Cảnh sát, Sở Bưu điện một cách nhanh gọn và chuẩn xác. Bằng sức mạnh chính trị áp đảo có lực lượng tự vệ vũ trang yểm trợ, đến cuối ngày 19/8/1945 ta làm chủ hoàn toàn Hà Nội."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.7",
            "excerpt": "Buổi trưa và chiều ngày 19/8:\nCác đoàn biểu tình chia thành nhiều mũi, tiến đến những cơ quan quan trọng của chính quyền.\nNhững địa điểm được tiếp quản gồm:\nPhủ Khâm sai Bắc Kỳ.\nSở Cảnh sát.\nSở Bưu điện.\nTrại Bảo an binh.\nCác cơ quan hành chính quan trọng khác.\nLực lượng cách mạng chủ yếu sử dụng sức mạnh chính trị của quần chúng, kết hợp với lực lượng vũ trang để hỗ trợ.\nChính quyền Nhật và bộ máy thân Nhật không thể duy trì quyền kiểm soát.\nĐến cuối ngày 19/8/1945:\nChính quyền ở Hà Nội về tay nhân dân.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/205", "body/206", "body/207", "body/208", "body/209", "body/210", "body/211", "body/212", "body/213", "body/214", "body/215", "body/216", "body/217", "body/218", "body/219", "body/220", "body/221", "body/222", "body/223", "body/224", "body/225", "body/226", "body/227", "body/228", "body/229", "body/230", "body/231", "body/232", "body/233", "body/234", "body/235", "body/236", "body/237", "body/238", "body/239"],
            "paragraphIndex": 205
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 42. IV-HANOI-MEANING (IV.7)
    {
        "key": "IV-HANOI-MEANING",
        "sectionId": "IV.7",
        "canonicalQuestion": "Thắng lợi của cuộc khởi nghĩa giành chính quyền tại Hà Nội ngày 19/8/1945 có ý nghĩa lịch sử như thế nào?",
        "aliases": [
            "Ý nghĩa của thắng lợi khởi nghĩa ngày 19/8/1945 ở Hà Nội đối với cả nước là gì?",
            "Khởi nghĩa thắng lợi tại Hà Nội đã tác động như thế nào đến tiến trình Tổng khởi nghĩa?",
            "Vai trò quyết định của thắng lợi Cách mạng tháng Tám tại Hà Nội được tài liệu nêu ra sao?"
        ],
        "approvedAnswer": "Ý nghĩa thắng lợi ở Hà Nội ngày 19/8/1945: đánh dấu thắng lợi tại trung tâm chính trị lớn nhất miền Bắc; tạo tiếng vang lớn trên toàn quốc; thúc đẩy các địa phương khác nhanh chóng giành chính quyền; góp phần quyết định vào thắng lợi của Tổng khởi nghĩa.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu đúc kết ý nghĩa trọng đại của sự kiện ngày 19/8: đánh dấu thắng lợi tại trung tâm chính trị lớn nhất miền Bắc, tạo tiếng vang lớn trên toàn quốc, thúc đẩy các địa phương khác nhanh chóng giành chính quyền và góp phần mang tính quyết định vào thắng lợi chung của Tổng khởi nghĩa.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy rõ tầm vóc của chiến thắng thủ đô: thắng lợi tại Hà Nội làm nức lòng đồng bào cả nước, giáng đòn chí mạng vào đầu não địch, cổ vũ các tỉnh miền Trung và miền Nam vùng lên giành chính quyền, quyết định sự toàn thắng của Cách mạng tháng Tám.",
            "truong-chinh": "Về mặt tác động chiến lược của việc giải phóng thủ đô: thắng lợi ngày 19/8/1945 tại Hà Nội đánh dấu sự sụp đổ của bộ máy thống trị ở trung tâm chính trị đầu não miền Bắc, tạo hiệu ứng lan tỏa mạnh mẽ trên toàn quốc, thúc đẩy các địa phương hành động quyết liệt và góp phần quyết định vào thắng lợi của Tổng khởi nghĩa.",
            "vo-nguyen-giap": "Dưới góc độ chiến lược toàn cục: đánh chiếm thành công trung tâm chính trị Hà Nội ngày 19/8/1945 đã bẻ gãy ý chí kháng cự của chính quyền địch, tạo chấn động quân sự và chính trị khắp cả nước, tạo đà trực tiếp đẩy nhanh khởi nghĩa tại Huế, Sài Gòn và các tỉnh thành."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.7",
            "excerpt": "Ý nghĩa\nĐánh dấu thắng lợi của cuộc khởi nghĩa tại trung tâm chính trị lớn nhất miền Bắc.\nTạo tiếng vang lớn trên toàn quốc.\nThúc đẩy các địa phương khác nhanh chóng giành chính quyền.\nGóp phần quyết định vào thắng lợi của Tổng khởi nghĩa.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/205", "body/206", "body/207", "body/208", "body/209", "body/210", "body/211", "body/212", "body/213", "body/214", "body/215", "body/216", "body/217", "body/218", "body/219", "body/220", "body/221", "body/222", "body/223", "body/224", "body/225", "body/226", "body/227", "body/228", "body/229", "body/230", "body/231", "body/232", "body/233", "body/234", "body/235", "body/236", "body/237", "body/238", "body/239", "body/240", "body/241", "body/242", "body/243", "body/244"],
            "paragraphIndex": 205
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 43. IV-THAI-NGUYEN-MEANING (IV.8)
    {
        "key": "IV-THAI-NGUYEN-MEANING",
        "sectionId": "IV.8",
        "canonicalQuestion": "Thắng lợi của cuộc khởi nghĩa tại thị xã Thái Nguyên ngày 20/8/1945 có ý nghĩa gì và vai trò của Võ Nguyên Giáp ra sao?",
        "aliases": [
            "Ý nghĩa khởi nghĩa thắng lợi ở Thái Nguyên ngày 20/8/1945 là gì?",
            "Vai trò chỉ huy quân sự của Võ Nguyên Giáp tại thị xã Thái Nguyên được ghi nhận thế nào?",
            "Thắng lợi tại Thái Nguyên đóng góp gì cho Khu giải phóng Việt Bắc và Tổng khởi nghĩa?"
        ],
        "approvedAnswer": "Thắng lợi tại thị xã Thái Nguyên ngày 20/8 có ý nghĩa: mở rộng địa bàn kiểm soát của chính quyền cách mạng, củng cố vị trí chiến lược của Khu giải phóng Việt Bắc, tạo điều kiện thuận lợi cho phong trào cách mạng tại các tỉnh lân cận. Vai trò của Võ Nguyên Giáp là trực tiếp chỉ huy lực lượng quân sự xuất phát từ Tân Trào, tham gia hoạt động quân sự hỗ trợ Tổng khởi nghĩa.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại chiến công và ý nghĩa lớn tại Thái Nguyên: mở rộng địa bàn kiểm soát của cách mạng, củng cố vị trí chiến lược của Khu giải phóng Việt Bắc và tạo điều kiện thuận lợi cho phong trào ở các tỉnh lân cận. Đồng chí Võ Nguyên Giáp trực tiếp chỉ huy cánh quân xuất phát từ Tân Trào, hỗ trợ đắc lực cho Tổng khởi nghĩa.",
            "hoang-quoc-viet": "Bà con và đồng chí nhớ chiến công giải phóng thị xã Thái Nguyên ngày 20/8: việc làm chủ thị xã mở rộng vùng giải phóng, củng cố bức thành đồng Việt Bắc và tạo bàn đạp cho phong trào các tỉnh lân cận. Đồng chí Võ Nguyên Giáp trực tiếp chỉ huy lực lượng quân sự xuất kích từ Tân Trào lập công xuất sắc.",
            "truong-chinh": "Về mặt củng cố hậu phương chiến lược: thắng lợi tại thị xã Thái Nguyên rạng sáng 20/8 có ý nghĩa mở rộng vùng kiểm soát cách mạng, củng cố vị trí chiến lược của Khu giải phóng Việt Bắc và hỗ trợ phong trào các tỉnh lân cận. Đồng chí Võ Nguyên Giáp trực tiếp chỉ huy đơn vị Giải phóng quân hỗ trợ đắc lực cho Tổng khởi nghĩa.",
            "vo-nguyen-giap": "Theo kế hoạch tác chiến tôi trực tiếp chỉ huy: đơn vị xuất quân từ Tân Trào tiến công giải phóng thị xã Thái Nguyên ngày 20/8 nhằm mở rộng địa bàn kiểm soát, củng cố thế trận chiến lược cho Khu giải phóng Việt Bắc và chi viện cho các địa phương lân cận phát triển phong trào."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.8",
            "excerpt": "Thắng lợi này có ý nghĩa:\nMở rộng địa bàn kiểm soát của chính quyền cách mạng.\nCủng cố vị trí chiến lược của Khu giải phóng Việt Bắc.\nTạo điều kiện thuận lợi cho phong trào cách mạng tại các tỉnh lân cận.\nVai trò của Võ Nguyên Giáp: Trực tiếp chỉ huy lực lượng quân sự xuất phát từ Tân Trào, tham gia hoạt động quân sự hỗ trợ Tổng khởi nghĩa.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/245", "body/246", "body/247", "body/248", "body/249", "body/250", "body/251", "body/252"],
            "paragraphIndex": 245
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 44. IV-HUE (IV.9)
    {
        "key": "IV-HUE",
        "sectionId": "IV.9",
        "canonicalQuestion": "Cuộc khởi nghĩa giành chính quyền tại Huế ngày 23/8/1945 diễn ra như thế nào và có ý nghĩa gì đối với triều đình nhà Nguyễn?",
        "aliases": [
            "Khởi nghĩa thắng lợi ở Huế ngày 23/8/1945 tác động như thế nào đến triều đình phong kiến?",
            "Diễn biến và kết quả giành chính quyền tại Huế ngày 23/8/1945 là gì?",
            "Tại sao thắng lợi khởi nghĩa tại Huế ngày 23/8/1945 có ý nghĩa làm suy sụp triều Nguyễn?"
        ],
        "approvedAnswer": "Huế là kinh đô triều Nguyễn, nơi đặt bộ máy quân chủ cuối cùng. Sau thắng lợi ở Hà Nội, ngày 23/8/1945, hàng vạn nhân dân Thừa Thiên – Huế biểu tình mít tinh, các đoàn quần chúng từ nhiều huyện tiến về trung tâm thành phố, chiếm các cơ quan hành chính. Bộ máy cũ mất khả năng kiểm soát, chính quyền cách mạng được thành lập. Thắng lợi ở Huế có ý nghĩa rất lớn vì làm suy sụp cơ sở chính trị của triều đình nhà Nguyễn.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại dấu mốc sụp đổ của chế độ quân chủ: Huế là kinh đô của triều Nguyễn; ngày 23/8/1945 hàng vạn đồng bào tập trung biểu tình mít tinh, các đoàn quần chúng tiến vào trung tâm chiếm cơ quan hành chính, thành lập chính quyền cách mạng. Thắng lợi này có ý nghĩa rất lớn vì làm suy sụp hoàn toàn cơ sở chính trị của triều đình nhà Nguyễn.",
            "hoang-quoc-viet": "Bà con miền Trung đã vùng lên quật khởi: ngày 23/8/1945, hàng vạn quần chúng nhân dân Thừa Thiên – Huế từ các huyện đổ về rợp cờ hoa, chiếm giữ các cơ quan hành chính, giải tán bộ máy cai trị cũ và lập nên chính quyền cách mạng. Thành trì phong kiến ngàn năm ở cố đô Huế sụp đổ trước sức mạnh nhân dân.",
            "truong-chinh": "Về mặt đập tan sào huyệt phong kiến: Huế là kinh đô của triều Nguyễn, nơi đặt bộ máy chính quyền quân chủ cuối cùng. Ngày 23/8/1945, quần chúng nổi dậy chiếm các cơ quan hành chính, chính quyền cũ tê liệt hoàn toàn, chính quyền cách mạng thành lập. Thắng lợi ở Huế có ý nghĩa chính trị to lớn vì đánh sập cơ sở chính trị của triều đình phong kiến nhà Nguyễn.",
            "vo-nguyen-giap": "Dưới góc độ nghệ thuật giương cao áp lực chính trị quần chúng: ngày 23/8/1945, lực lượng cách mạng tại Huế đã huy động hàng vạn nhân dân biểu tình bao vây kinh đô, chiếm các công sở hành chính trọng yếu, làm tan rã bộ máy triều đình cũ và lập chính quyền nhân dân một cách nhanh gọn, hầu như không đổ máu."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.9",
            "excerpt": "9. Ngày 23/8/1945: Khởi nghĩa thắng lợi tại Huế\nHuế là kinh đô của triều Nguyễn, nơi đặt bộ máy chính quyền quân chủ cuối cùng của Việt Nam.\nSau thắng lợi tại Hà Nội, phong trào cách mạng ở Thừa Thiên – Huế phát triển nhanh chóng.\nCác tổ chức Việt Minh vận động nhân dân, chuẩn bị lực lượng và phương án giành chính quyền.\nNgày 23/8/1945:\nHàng vạn nhân dân tập trung biểu tình, mít tinh.\nCác đoàn quần chúng từ nhiều huyện tiến về trung tâm thành phố.\nLực lượng cách mạng tổ chức chiếm các cơ quan hành chính.\nBộ máy chính quyền cũ mất khả năng kiểm soát.\nChính quyền cách mạng được thành lập.\nThắng lợi ở Huế có ý nghĩa rất lớn vì làm suy sụp cơ sở chính trị của triều đình nhà Nguyễn.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/253", "body/254", "body/255", "body/256", "body/257", "body/258", "body/259", "body/260", "body/261", "body/262", "body/263"],
            "paragraphIndex": 253
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 45. IV-SAIGON-FORCES (IV.10)
    {
        "key": "IV-SAIGON-FORCES",
        "sectionId": "IV.10",
        "canonicalQuestion": "Những tổ chức và lực lượng quần chúng nào đã chuẩn bị và tham gia cuộc khởi nghĩa tại Sài Gòn ngày 25/8/1945?",
        "aliases": [
            "Lực lượng tham gia khởi nghĩa Sài Gòn ngày 25/8/1945 gồm những thành phần nào?",
            "Cơ quan nào lãnh đạo và các tầng lớp nhân dân nào tiến vào trung tâm Sài Gòn ngày 25/8/1945?",
            "Quy mô lực lượng tham gia giành chính quyền tại Sài Gòn được tài liệu nêu ra sao?"
        ],
        "approvedAnswer": "Xứ ủy Nam Kỳ, các tổ chức Việt Minh và lực lượng quần chúng tích cực chuẩn bị khởi nghĩa. Ngày 25/8/1945, đông đảo nhân dân từ Sài Gòn, Chợ Lớn và các tỉnh lân cận tiến về trung tâm thành phố. Các lực lượng tham gia gồm: công nhân, nông dân, thanh niên, học sinh, sinh viên, các tổ chức đoàn thể và các tầng lớp nhân dân yêu nước.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu ghi nhận sự chuẩn bị công phu của phong trào Nam Bộ: Xứ ủy Nam Kỳ, các tổ chức Việt Minh cùng lực lượng quần chúng đã tích cực chuẩn bị. Ngày 25/8/1945, đông đảo nhân dân từ Sài Gòn, Chợ Lớn và các tỉnh lân cận gồm công nhân, nông dân, thanh niên, học sinh, sinh viên, các đoàn thể tiến về trung tâm thành phố.",
            "hoang-quoc-viet": "Bà con Sài Gòn - Gia Định quật khởi hào hùng: dưới sự lãnh đạo của Xứ ủy Nam Kỳ và Việt Minh, ngày 25/8/1945 nhân dân từ Sài Gòn, Chợ Lớn và các tỉnh rầm rộ tiến vào. Lực lượng nòng cốt là công nhân, nông dân, thanh niên, học sinh, sinh viên cùng muôn người như một vùng lên làm chủ vận mệnh.",
            "truong-chinh": "Về mặt tổ chức lực lượng chính trị tại Nam Bộ: Xứ ủy Nam Kỳ và các tổ chức Việt Minh đã lãnh đạo chuẩn bị chu đáo. Ngày 25/8/1945, quần chúng từ Sài Gòn, Chợ Lớn và các tỉnh lân cận gồm công nhân, nông dân, thanh niên, học sinh, sinh viên và các đoàn thể yêu nước đã tập hợp quy mô lớn tiến về trung tâm thành phố.",
            "vo-nguyen-giap": "Dưới góc độ huy động tổng lực chính trị địa bàn đô thị lớn: ngày 25/8/1945, Xứ ủy Nam Kỳ và Mặt trận Việt Minh đã huy động khối quần chúng khổng lồ từ Sài Gòn, Chợ Lớn và các vùng phụ cận gồm công nhân, nông dân, thanh niên và tự vệ yêu nước tạo thế trận áp đảo hoàn toàn đối phương."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.10",
            "excerpt": "10. Ngày 25/8/1945: Khởi nghĩa thắng lợi tại Sài Gòn\nSau Hà Nội và Huế, phong trào cách mạng tại Nam Bộ phát triển mạnh.\nXứ ủy Nam Kỳ, các tổ chức Việt Minh và lực lượng quần chúng đã tích cực chuẩn bị cho cuộc khởi nghĩa.\nNgày 25/8/1945, đông đảo nhân dân từ Sài Gòn, Chợ Lớn và các tỉnh lân cận tiến về trung tâm thành phố.\nCác lực lượng tham gia gồm:\nCông nhân.\nNông dân.\nThanh niên.\nHọc sinh, sinh viên.\nCác tổ chức đoàn thể.\nCác tầng lớp nhân dân yêu nước.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/264", "body/265", "body/266", "body/267", "body/268", "body/269", "body/270", "body/271", "body/272", "body/273", "body/274"],
            "paragraphIndex": 264
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 46. IV-SAIGON-RESULT (IV.10)
    {
        "key": "IV-SAIGON-RESULT",
        "sectionId": "IV.10",
        "canonicalQuestion": "Cuộc khởi nghĩa ngày 25/8/1945 tại Sài Gòn đã diễn ra và đạt kết quả ra sao, có ý nghĩa gì đối với phong trào Nam Bộ và cả nước?",
        "aliases": [
            "Kết quả và ý nghĩa của cuộc khởi nghĩa giành chính quyền ở Sài Gòn ngày 25/8/1945 là gì?",
            "Các cơ quan nào được tiếp quản tại Sài Gòn ngày 25/8/1945 và chính quyền về tay ai?",
            "Thắng lợi của khởi nghĩa Sài Gòn đóng góp gì cho cuộc Tổng khởi nghĩa tháng Tám?"
        ],
        "approvedAnswer": "Tại Sài Gòn ngày 25/8/1945, nhân dân tổ chức biểu tình, chiếm các cơ quan quan trọng, tiếp quản bộ máy hành chính, cơ sở cảnh sát, mật thám và thành lập chính quyền cách mạng. Đến cuối ngày 25/8, chính quyền ở Sài Gòn về tay nhân dân. Thắng lợi này có ý nghĩa quyết định đối với phong trào cách mạng Nam Bộ và góp phần hoàn thành Tổng khởi nghĩa trong cả nước.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu ghi nhận thắng lợi quyết định ở phía Nam: ngày 25/8/1945, nhân dân biểu tình chiếm các cơ quan quan trọng, cơ sở cảnh sát, mật thám và lập chính quyền cách mạng. Cuối ngày 25/8, Sài Gòn hoàn toàn giải phóng; thắng lợi có ý nghĩa quyết định với Nam Bộ và góp phần hoàn thành Tổng khởi nghĩa cả nước.",
            "hoang-quoc-viet": "Bà con Nam Bộ đã lập nên kỳ tích tuyệt vời: ngày 25/8/1945, nhân dân ta đánh chiếm các đồn cảnh sát, bốt mật thám, công sở trọng yếu, xóa bỏ chính quyền tay sai. Đến chiều tối ngày 25/8, chính quyền Sài Gòn về tay nhân dân, tạo đà quyết định cho toàn miền Nam hoàn thành Tổng khởi nghĩa.",
            "truong-chinh": "Về mặt hoàn tất thế trận khởi nghĩa cả ba miền: ngày 25/8/1945, quần chúng biểu tình tiếp quản bộ máy hành chính, cơ sở an ninh mật thám của địch và thành lập chính quyền cách mạng tại Sài Gòn. Thắng lợi này có ý nghĩa quyết định đối với phong trào cách mạng Nam Bộ và góp phần hoàn thành thắng lợi trọn vẹn của Tổng khởi nghĩa trong cả nước.",
            "vo-nguyen-giap": "Dưới góc độ đòn kết liễu bộ máy địch tại trung tâm lớn thứ ba: ngày 25/8/1945, lực lượng cách mạng tại Sài Gòn đã tiếp quản nhanh chóng các mục tiêu hành chính, cảnh sát, mật thám, làm chủ thành phố trước đêm 25/8, đưa cuộc Tổng khởi nghĩa trên phạm vi toàn quốc bước vào giai đoạn toàn thắng."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.10",
            "excerpt": "Nhân dân tổ chức biểu tình, chiếm các cơ quan quan trọng, tiếp quản bộ máy hành chính và thành lập chính quyền cách mạng.\nNhững cơ quan được tiếp quản gồm các cơ sở cảnh sát, mật thám, hành chính và một số cơ sở hạ tầng quan trọng.\nĐến cuối ngày 25/8, chính quyền ở Sài Gòn về tay nhân dân.\nThắng lợi này có ý nghĩa quyết định đối với phong trào cách mạng Nam Bộ và góp phần hoàn thành Tổng khởi nghĩa trong cả nước.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/264", "body/265", "body/266", "body/267", "body/268", "body/269", "body/270", "body/271", "body/272", "body/273", "body/274", "body/275", "body/276", "body/277", "body/278"],
            "paragraphIndex": 264
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 47. IV-MEETING-26 (IV.11)
    {
        "key": "IV-MEETING-26",
        "sectionId": "IV.11",
        "canonicalQuestion": "Cuộc họp của Ban Thường vụ Trung ương Đảng do Hồ Chí Minh chủ trì tại Hà Nội ngày 26/8/1945 đã bàn những nhiệm vụ cấp bách gì?",
        "aliases": [
            "Hồ Chí Minh chủ trì cuộc họp Thường vụ Trung ương Đảng ngày 26/8/1945 giải quyết các vấn đề gì?",
            "Nội dung cuộc họp Trung ương Đảng tại Hà Nội ngày 26/8/1945 gồm những việc cấp bách nào?",
            "Bước chuyển từ lãnh đạo khởi nghĩa sang xây dựng nhà nước được thể hiện qua cuộc họp ngày 26/8/1945 ra sao?"
        ],
        "approvedAnswer": "Ngày 26/8/1945, Hồ Chí Minh về Hà Nội và chủ trì cuộc họp của Ban Thường vụ Trung ương Đảng. Cuộc họp bàn những nhiệm vụ cấp bách: củng cố chính quyền cách mạng, thành lập Chính phủ lâm thời, chuẩn bị Tuyên ngôn Độc lập, chuẩn bị lễ tuyên bố độc lập, giải quyết các vấn đề đối nội và đối ngoại, bảo vệ thành quả cách mạng trước nguy cơ can thiệp từ bên ngoài. Đây là bước chuyển quan trọng từ lãnh đạo khởi nghĩa sang xây dựng nhà nước độc lập.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại bước chuyển lịch sử: ngày 26/8/1945 Bác Hồ về tới Hà Nội và chủ trì cuộc họp Ban Thường vụ Trung ương Đảng bàn các nhiệm vụ cấp bách: củng cố chính quyền cách mạng, lập Chính phủ lâm thời, chuẩn bị Tuyên ngôn Độc lập và lễ tuyên bố, lo việc đối nội đối ngoại bảo vệ thành quả cách mạng.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy tầm nhìn của Trung ương: ngay sau khi về thủ đô, ngày 26/8/1945 Bác Hồ chủ trì họp Thường vụ Trung ương để bàn việc củng cố chính quyền, lập Chính phủ lâm thời, soạn thảo Tuyên ngôn Độc lập, chuẩn bị lễ mừng độc lập và bảo vệ non sông trước dã tâm ngoại bang.",
            "truong-chinh": "Về mặt hoạch định đường lối xây dựng chính quyền non trẻ: ngày 26/8/1945, đồng chí Hồ Chí Minh chủ trì cuộc họp Ban Thường vụ Trung ương Đảng tại Hà Nội bàn những nhiệm vụ cấp bách: củng cố chính quyền cách mạng, thành lập Chính phủ lâm thời, chuẩn bị Tuyên ngôn Độc lập và lễ tuyên bố độc lập, giải quyết các vấn đề đối nội và đối ngoại, bảo vệ thành quả cách mạng trước nguy cơ can thiệp từ bên ngoài. Đây là bước chuyển then chốt từ lãnh đạo khởi nghĩa sang xây dựng nhà nước độc lập.",
            "vo-nguyen-giap": "Dưới góc độ chuẩn bị thế trận giữ vững chính quyền mới: cuộc họp ngày 26/8/1945 do Bác Hồ chủ trì đã khẩn trương xác định nhiệm vụ củng cố chính quyền, thành lập Chính phủ lâm thời, chuẩn bị Tuyên ngôn Độc lập và bố phòng bảo vệ lễ tuyên bố độc lập trước nguy cơ can thiệp quân sự từ bên ngoài."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.11",
            "excerpt": "Cuộc họp bàn những nhiệm vụ cấp bách:\nCủng cố chính quyền cách mạng.\nThành lập Chính phủ lâm thời.\nChuẩn bị Tuyên ngôn Độc lập.\nChuẩn bị lễ tuyên bố độc lập.\nGiải quyết các vấn đề đối nội và đối ngoại.\nBảo vệ thành quả cách mạng trước nguy cơ can thiệp từ bên ngoài.\nĐây là bước chuyển quan trọng từ hoạt động lãnh đạo khởi nghĩa sang xây dựng nhà nước độc lập.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/279", "body/280", "body/281", "body/282", "body/283", "body/284", "body/285", "body/286", "body/287", "body/288"],
            "paragraphIndex": 279
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 48. IV-GOVERNMENT-27 (IV.12)
    {
        "key": "IV-GOVERNMENT-27",
        "sectionId": "IV.12",
        "canonicalQuestion": "Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa được thành lập vào ngày nào và cơ cấu nhân sự gồm những vị trí chủ chốt nào?",
        "aliases": [
            "Ngày thành lập Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa là khi nào?",
            "Ai giữ chức Chủ tịch, Bộ trưởng Tài chính và Bộ trưởng Nội vụ trong Chính phủ lâm thời ngày 27/8/1945?",
            "Ủy ban Dân tộc giải phóng được cải tổ thành Chính phủ lâm thời vào ngày nào?"
        ],
        "approvedAnswer": "Ngày 27/8/1945, Ủy ban Dân tộc giải phóng Việt Nam được cải tổ thành Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa. Hồ Chí Minh giữ chức Chủ tịch Chính phủ. Trong Chính phủ lâm thời, Phạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính, Võ Nguyên Giáp giữ chức Bộ trưởng Bộ Nội vụ. Chính phủ có nhiệm vụ điều hành đất nước, tổ chức bộ máy và chuẩn bị tuyên bố độc lập.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử: ngày 27/8/1945, Ủy ban Dân tộc giải phóng được cải tổ thành Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa do đồng chí Hồ Chí Minh làm Chủ tịch. Trong Chính phủ lâm thời, tôi được phân công giữ chức Bộ trưởng Bộ Tài chính, còn đồng chí Võ Nguyên Giáp giữ chức Bộ trưởng Bộ Nội vụ để cùng điều hành đất nước.",
            "hoang-quoc-viet": "Bà con và đồng chí nhớ mốc khai sinh chính phủ mới: ngày 27/8/1945, Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa thành lập dưới sự lãnh đạo của Chủ tịch Hồ Chí Minh; đồng chí Phạm Văn Đồng lo việc tài chính với cương vị Bộ trưởng Bộ Tài chính, đồng chí Võ Nguyên Giáp làm Bộ trưởng Bộ Nội vụ.",
            "truong-chinh": "Về việc hình thành thiết chế chính phủ quốc gia: ngày 27/8/1945, Ủy ban Dân tộc giải phóng được cải tổ thành Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa do đồng chí Hồ Chí Minh làm Chủ tịch Chính phủ. Trong bộ máy, đồng chí Phạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính, đồng chí Võ Nguyên Giáp giữ chức Bộ trưởng Bộ Nội vụ nhằm điều hành đất nước và chuẩn bị tuyên bố độc lập.",
            "vo-nguyen-giap": "Tài liệu ghi lại việc phân công trọng trách nhà nước: ngày 27/8/1945, Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa được thành lập do Chủ tịch Hồ Chí Minh đứng đầu; đồng chí Phạm Văn Đồng đảm nhiệm Bộ trưởng Bộ Tài chính, tôi được giao giữ chức Bộ trưởng Bộ Nội vụ lo việc nội chính và an ninh trật tự."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.12",
            "excerpt": "12. Ngày 27/8/1945: Thành lập Chính phủ lâm thời\nỦy ban Dân tộc giải phóng Việt Nam được cải tổ thành Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa.\nHồ Chí Minh giữ chức Chủ tịch Chính phủ.\nTrong Chính phủ lâm thời:\nPhạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính.\nVõ Nguyên Giáp giữ chức Bộ trưởng Bộ Nội vụ.\nChính phủ lâm thời có nhiệm vụ điều hành đất nước, tổ chức bộ máy chính quyền và chuẩn bị tuyên bố độc lập.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/289", "body/290", "body/291", "body/292", "body/293", "body/294", "body/295"],
            "paragraphIndex": 289
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 49. IV-NATIONWIDE-28 (IV.13)
    {
        "key": "IV-NATIONWIDE-28",
        "sectionId": "IV.13",
        "canonicalQuestion": "Đến ngày 28/8/1945, kết quả của cuộc Tổng khởi nghĩa trên phạm vi cả nước được ghi nhận như thế nào?",
        "aliases": [
            "Cuộc Tổng khởi nghĩa tháng Tám đã cơ bản hoàn thành vào ngày nào?",
            "Tình hình chính quyền trên cả nước đến ngày 28/8/1945 ra sao?",
            "Mốc thời gian 28/8/1945 đánh dấu thành tựu gì của Cách mạng tháng Tám?"
        ],
        "approvedAnswer": "Đến ngày 28/8/1945, chính quyền về cơ bản đã thuộc về nhân dân trên cả nước. Các cơ quan chính quyền cũ bị giải thể hoặc được tiếp quản; các Ủy ban nhân dân cách mạng được thành lập tại nhiều địa phương. Thắng lợi đánh dấu sự sụp đổ của chính quyền thuộc địa, phong kiến và bộ máy tay sai thân Nhật, là mốc hoàn thành cơ bản cuộc Tổng khởi nghĩa tháng Tám.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử đúc kết: đến ngày 28/8/1945, cuộc Tổng khởi nghĩa về cơ bản đã thắng lợi trên phạm vi cả nước, chính quyền thuộc về tay nhân dân. Các Ủy ban nhân dân cách mạng ra đời khắp nơi, đánh dấu sự sụp đổ hoàn toàn của bộ máy cai trị thuộc địa, phong kiến và tay sai.",
            "hoang-quoc-viet": "Bà con và đồng chí mừng vui khôn xiết: tính đến ngày 28/8/1945, toàn bộ giang sơn gấm vóc từ Bắc chí Nam về cơ bản đã sạch bóng quân thù, chính quyền về tay đồng bào lao khổ. Bộ máy tay sai sụp đổ hoàn toàn, đánh dấu cuộc Tổng khởi nghĩa căn bản thắng lợi trọn vẹn.",
            "truong-chinh": "Về mặt mốc thời gian kết thúc thắng lợi Tổng khởi nghĩa: đến ngày 28/8/1945, chính quyền về cơ bản đã thuộc về nhân dân trên cả nước. Toàn bộ cơ quan cai trị cũ bị giải thể hoặc tiếp quản, chính quyền cách mạng thiết lập khắp các địa phương; cuộc Tổng khởi nghĩa tháng Tám hoàn thành thắng lợi cơ bản trong vòng 15 ngày.",
            "vo-nguyen-giap": "Dưới góc độ hoàn tất chiến dịch tổng khởi nghĩa toàn quốc: đến ngày 28/8/1945, ta đã làm chủ trận địa hành chính và quân sự trên toàn quốc, thành lập các Ủy ban nhân dân cách mạng, đánh đổ chính quyền thuộc địa và tay sai, hoàn thành cơ bản sứ mệnh lịch sử của cuộc Tổng khởi nghĩa thần tốc."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.13",
            "excerpt": "13. Ngày 28/8/1945: Tổng khởi nghĩa thắng lợi trên phạm vi cả nước\nĐến ngày 28/8/1945, chính quyền về cơ bản đã thuộc về nhân dân trên cả nước.\nCác cơ quan chính quyền cũ bị giải thể hoặc được tiếp quản.\nCác Ủy ban nhân dân cách mạng được thành lập tại nhiều địa phương.\nThắng lợi của Tổng khởi nghĩa đánh dấu sự sụp đổ của chính quyền thuộc địa, phong kiến và bộ máy tay sai thân Nhật.\nĐây là mốc hoàn thành cơ bản cuộc Tổng khởi nghĩa tháng Tám.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/296", "body/297", "body/298", "body/299", "body/300", "body/301"],
            "paragraphIndex": 296
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 50. IV-ABDICATION (IV.14)
    {
        "key": "IV-ABDICATION",
        "sectionId": "IV.14",
        "canonicalQuestion": "Sự kiện vua Bảo Đại thoái vị ngày 30/8/1945 diễn ra tại đâu và có ý nghĩa lịch sử như thế nào?",
        "aliases": [
            "Lễ thoái vị của vua Bảo Đại ngày 30/8/1945 diễn ra ở địa điểm nào và đánh dấu điều gì?",
            "Sự kiện Bảo Đại trao ấn kiếm cho đại diện Chính phủ lâm thời mang ý nghĩa gì?",
            "Thời điểm chấm dứt hoàn toàn chế độ phong kiến quân chủ triều Nguyễn là khi nào?"
        ],
        "approvedAnswer": "Ngày 30/8/1945, tại Ngọ Môn, Huế, vua Bảo Đại tuyên bố thoái vị và trao ấn, kiếm cho đại diện Chính phủ lâm thời. Sự kiện này đánh dấu: chấm dứt chế độ quân chủ ở Việt Nam, kết thúc triều Nguyễn, hoàn thành sự sụp đổ của chế độ phong kiến, mở ra một thời kỳ mới trong lịch sử dân tộc.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại thời khắc lịch sử cáo chung của chế độ cũ: ngày 30/8/1945, tại Ngọ Môn, Huế, vua Bảo Đại tuyên bố thoái vị và trao ấn kiếm cho đại diện Chính phủ lâm thời. Sự kiện chấm dứt chế độ quân chủ ở Việt Nam, kết thúc triều Nguyễn, hoàn thành sự sụp đổ của chế độ phong kiến và mở ra thời kỳ mới cho dân tộc.",
            "hoang-quoc-viet": "Bà con ta chứng kiến ngày tàn của chế độ vua chúa: ngày 30/8/1945, trước cửa Ngọ Môn kinh thành Huế, vua Bảo Đại tuyên bố thoái vị, trao nộp ấn kiếm cho phái đoàn cách mạng. Từ đây chấm dứt hoàn toàn chế độ quân chủ, kết thúc triều Nguyễn, nhân dân ta chính thức làm chủ vận mệnh nước nhà.",
            "truong-chinh": "Về mặt chấm dứt thể chế phong kiến hàng nghìn năm: ngày 30/8/1945, tại Ngọ Môn, Huế, Bảo Đại tuyên bố thoái vị và trao ấn kiếm cho đại diện Chính phủ lâm thời. Sự kiện mang tính bước ngoặt lịch sử: chấm dứt chế độ quân chủ ở Việt Nam, kết thúc triều Nguyễn, hoàn thành sự sụp đổ của chế độ phong kiến, mở ra một thời kỳ mới cho dân tộc.",
            "vo-nguyen-giap": "Dưới góc độ hoàn tất thủ tục bàn giao quyền lực lịch sử: ngày 30/8/1945, tại Ngọ Môn, Huế, vua Bảo Đại thoái vị và trao ấn kiếm cho đại diện Chính phủ lâm thời, chính thức khép lại vĩnh viễn triều Nguyễn và chế độ quân chủ phong kiến, chuyển toàn bộ chủ quyền thiêng liêng về tay nhân dân Việt Nam."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.14",
            "excerpt": "14. Ngày 30/8/1945: Vua Bảo Đại thoái vị\nTại Ngọ Môn, Huế, vua Bảo Đại tuyên bố thoái vị và trao ấn, kiếm cho đại diện Chính phủ lâm thời.\nSự kiện này đánh dấu:\nChấm dứt chế độ quân chủ ở Việt Nam.\nKết thúc triều Nguyễn.\nHoàn thành sự sụp đổ của chế độ phong kiến.\nMở ra một thời kỳ mới trong lịch sử dân tộc.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/302", "body/303", "body/304", "body/305", "body/306", "body/307", "body/308"],
            "paragraphIndex": 302
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 51. IV-DECLARATION-CONTENT (IV.15)
    {
        "key": "IV-DECLARATION-CONTENT",
        "sectionId": "IV.15",
        "canonicalQuestion": "Bản Tuyên ngôn Độc lập ngày 2/9/1945 khẳng định những nội dung chủ yếu nào?",
        "aliases": [
            "Nội dung cốt lõi của bản Tuyên ngôn Độc lập do Chủ tịch Hồ Chí Minh công bố là gì?",
            "Các điểm chính trong bản Tuyên ngôn Độc lập đọc tại Ba Đình ngày 2/9/1945 gồm những gì?",
            "Tuyên ngôn Độc lập tuyên bố chấm dứt những chế độ nào và khẳng định quyền gì của dân tộc?"
        ],
        "approvedAnswer": "Nội dung chính của Tuyên ngôn Độc lập: khẳng định quyền bình đẳng, quyền sống, quyền tự do và mưu cầu hạnh phúc của con người; tố cáo tội ác của thực dân Pháp và phát xít Nhật; khẳng định nhân dân Việt Nam giành chính quyền từ tay phát xít Nhật và tay sai; tuyên bố chấm dứt chế độ thuộc địa và chế độ quân chủ; khẳng định quyền độc lập, tự do và thể hiện quyết tâm bảo vệ nền độc lập của toàn thể dân tộc.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu tóm lược các giá trị cốt lõi của áng thiên cổ hùng văn: Tuyên ngôn Độc lập khẳng định quyền sống, quyền tự do và mưu cầu hạnh phúc; tố cáo tội ác thực dân Pháp và phát xít Nhật; khẳng định ta giành chính quyền từ tay Nhật; tuyên bố chấm dứt chế độ thuộc địa và quân chủ; khẳng định quyền độc lập tự do và quyết tâm sắt đá bảo vệ nền độc lập đó.",
            "hoang-quoc-viet": "Lời Tuyên ngôn đã nói lên tiếng lòng của triệu triệu người dân lao khổ: khẳng định quyền con người, tố cáo tội ác bóc lột của thực dân - phát xít, tuyên bố nhân dân ta tự tay giành lại độc lập từ tay giặc Nhật, xóa bỏ ách thuộc địa và ngôi vua, khẳng định quyền tự do độc lập và thề quyết đem hết tinh thần, lực lượng để giữ vững nền độc lập.",
            "truong-chinh": "Về mặt giá trị pháp lý, chính trị và nhân văn sâu sắc: Tuyên ngôn Độc lập khẳng định quyền bình đẳng, quyền sống, quyền tự do và quyền mưu cầu hạnh phúc; đanh thép tố cáo tội ác cai trị của Pháp và Nhật; khẳng định nhân dân ta giành chính quyền từ tay phát xít Nhật và tay sai; tuyên bố chấm dứt hoàn toàn chế độ thuộc địa và quân chủ; khẳng định quyền độc lập tự do và quyết tâm bảo vệ nền độc lập của toàn dân tộc.",
            "vo-nguyen-giap": "Dưới góc độ tuyên ngôn lập quốc và lời thề giữ nước: Tuyên ngôn Độc lập khẳng định quyền con người, quyền tự do; khẳng định thành quả nhân dân ta tự lực giành chính quyền từ tay Nhật; tuyên bố xóa bỏ chế độ thuộc địa và phong kiến; khẳng định quyền tự do độc lập thiêng liêng và lời thề quyết tử giữ vững nền độc lập của non sông."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.15",
            "excerpt": "Nội dung chính của Tuyên ngôn:\nKhẳng định quyền bình đẳng, quyền sống, quyền tự do và quyền mưu cầu hạnh phúc của con người.\nTố cáo tội ác của thực dân Pháp trong quá trình cai trị Việt Nam.\nTố cáo những hậu quả do phát xít Nhật gây ra.\nKhẳng định nhân dân Việt Nam đã giành chính quyền từ tay phát xít Nhật và tay sai.\nTuyên bố chấm dứt chế độ thuộc địa và chế độ quân chủ.\nKhẳng định quyền độc lập, tự do của nước Việt Nam.\nThể hiện quyết tâm bảo vệ nền độc lập của toàn thể dân tộc.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/309", "body/310", "body/311", "body/312", "body/313", "body/314", "body/315", "body/316", "body/317", "body/318"],
            "paragraphIndex": 309
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 52. IV-DECLARATION-MEANING (IV.15)
    {
        "key": "IV-DECLARATION-MEANING",
        "sectionId": "IV.15",
        "canonicalQuestion": "Sự kiện ngày 2/9/1945 tại Quảng trường Ba Đình có ý nghĩa lịch sử như thế nào đối với sự ra đời của nhà nước mới?",
        "aliases": [
            "Ý nghĩa lịch sử của ngày 2/9/1945 đối với nước Việt Nam là gì?",
            "Sự kiện đọc Tuyên ngôn Độc lập ngày 2/9/1945 khai sinh nhà nước nào?",
            "Thành quả cao nhất của Cách mạng tháng Tám năm 1945 được đánh dấu bằng sự kiện gì?"
        ],
        "approvedAnswer": "Sự kiện ngày 2/9/1945 chính thức khai sinh nước Việt Nam Dân chủ Cộng hòa. Đây là thành quả cao nhất của Cách mạng tháng Tám năm 1945.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử đúc kết: sự kiện ngày 2/9/1945 có ý nghĩa vô cùng trọng đại, chính thức khai sinh nước Việt Nam Dân chủ Cộng hòa. Đây là đỉnh cao và là thành quả cao nhất của Cách mạng tháng Tám năm 1945.",
            "hoang-quoc-viet": "Bà con và đồng chí đời đời khắc ghi ngày Tết Độc lập: ngày 2/9/1945 đã chính thức khai sinh ra nước Việt Nam Dân chủ Cộng hòa của nhân dân ta. Đó là kết tinh máu xương và là thành quả cao nhất của toàn thể dân tộc trong Cách mạng tháng Tám 1945.",
            "truong-chinh": "Về mặt ý nghĩa thể chế và lịch sử dân tộc: sự kiện ngày 2/9/1945 có ý nghĩa bước ngoặt lịch sử, chính thức khai sinh nước Việt Nam Dân chủ Cộng hòa. Đây là mốc hoàn tất thắng lợi trọn vẹn và là thành quả cao nhất của Cách mạng tháng Tám năm 1945.",
            "vo-nguyen-giap": "Dưới góc độ đỉnh cao thắng lợi cách mạng: sự kiện ngày 2/9/1945 tại Quảng trường Ba Đình chính thức khai sinh nước Việt Nam Dân chủ Cộng hòa, ghi dấu thành quả cao nhất của toàn thể quân và dân ta trong cuộc Cách mạng tháng Tám năm 1945."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.15",
            "excerpt": "Sự kiện ngày 2/9/1945 chính thức khai sinh nước Việt Nam Dân chủ Cộng hòa.\nĐây là thành quả cao nhất của Cách mạng tháng Tám năm 1945.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/309", "body/310", "body/311", "body/312", "body/313", "body/314", "body/315", "body/316", "body/317", "body/318", "body/319", "body/320", "body/321", "body/322"],
            "paragraphIndex": 309
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    }
]


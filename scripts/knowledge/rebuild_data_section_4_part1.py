# -*- coding: utf-8 -*-
"""
Rebuild Data for Section IV Part 1: Diễn biến cụ thể từ 13/8 đến 18/8/1945
Contains 13 proposed units:
- IV-COMMITTEE
- IV-ORDER-ISSUE
- IV-ORDER-CONTENT
- IV-ORDER-AUTHORS
- IV-PARTY-CONFERENCE
- IV-PRINCIPLES
- IV-GIAP-ELECTION
- IV-LOCAL-INITIATIVE
- IV-CONGRESS
- IV-CONGRESS-DECISIONS
- IV-THAI-NGUYEN-DATES
- IV-LIBERATION-COMMITTEE
- IV-FOUR-PROVINCES
"""

SECTION_4_PART1_DATA = [
    # 26. IV-COMMITTEE (IV.1)
    {
        "key": "IV-COMMITTEE",
        "sectionId": "IV.1",
        "canonicalQuestion": "Ủy ban Khởi nghĩa toàn quốc được thành lập vào ngày nào, gồm những ai và do ai trực tiếp phụ trách?",
        "aliases": [
            "Thành phần và người phụ trách Ủy ban Khởi nghĩa toàn quốc ngày 13/8/1945 là ai?",
            "Ủy ban Khởi nghĩa toàn quốc ra đời khi nào và gồm các thành viên nào?",
            "Ai trực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc thành lập ngày 13/8/1945?"
        ],
        "approvedAnswer": "Ngày 13/8/1945, Ủy ban Khởi nghĩa toàn quốc được thành lập. Các thành viên gồm: Trường Chinh, Võ Nguyên Giáp, Trần Đăng Ninh, Lê Thanh Nghị, Chu Văn Tấn. Trường Chinh trực tiếp phụ trách Ủy ban.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại cơ quan chỉ huy tối cao của cuộc khởi nghĩa: ngày 13/8/1945, Ủy ban Khởi nghĩa toàn quốc được thành lập. Các thành viên gồm Trường Chinh, Võ Nguyên Giáp, Trần Đăng Ninh, Lê Thanh Nghị, Chu Văn Tấn, và đồng chí Trường Chinh trực tiếp phụ trách Ủy ban.",
            "hoang-quoc-viet": "Bà con và đồng chí ghi nhớ bộ chỉ huy của phong trào: ngày 13/8/1945, Ủy ban Khởi nghĩa toàn quốc được thành lập gồm các đồng chí Trường Chinh, Võ Nguyên Giáp, Trần Đăng Ninh, Lê Thanh Nghị, Chu Văn Tấn, do đồng chí Trường Chinh trực tiếp phụ trách.",
            "truong-chinh": "Về mặt tổ chức cơ quan lãnh đạo Tổng khởi nghĩa: ngày 13/8/1945, Ủy ban Khởi nghĩa toàn quốc được thành lập nhằm kịp thời chớp thời cơ. Thành viên gồm Trường Chinh, Võ Nguyên Giáp, Trần Đăng Ninh, Lê Thanh Nghị và Chu Văn Tấn; tôi được Đảng phân công trực tiếp phụ trách Ủy ban.",
            "vo-nguyen-giap": "Dưới góc độ tổ chức bộ chỉ huy quân sự - chính trị toàn quốc: ngày 13/8/1945, Ủy ban Khởi nghĩa toàn quốc được thành lập gồm các đồng chí Trường Chinh, Võ Nguyên Giáp, Trần Đăng Ninh, Lê Thanh Nghị và Chu Văn Tấn, do đồng chí Trường Chinh trực tiếp phụ trách chỉ đạo."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.1",
            "excerpt": "Ngày 13/8/1945, Ủy ban Khởi nghĩa toàn quốc được thành lập.\nCác thành viên gồm:\nTrường Chinh.\nVõ Nguyên Giáp.\nTrần Đăng Ninh.\nLê Thanh Nghị.\nChu Văn Tấn.\nTrường Chinh trực tiếp phụ trách Ủy ban.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/125", "body/126", "body/127", "body/128", "body/129", "body/130", "body/131", "body/132", "body/133", "body/134"],
            "paragraphIndex": 125
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 27. IV-ORDER-ISSUE (IV.1)
    {
        "key": "IV-ORDER-ISSUE",
        "sectionId": "IV.1",
        "canonicalQuestion": "Quân lệnh số 1 được cơ quan nào ban bố và vào thời điểm nào?",
        "aliases": [
            "Thời điểm ban bố Quân lệnh số 1 phát động Tổng khởi nghĩa là khi nào?",
            "Quân lệnh số 1 do cơ quan nào ban bố đêm 13/8/1945?",
            "Văn kiện chính thức phát lệnh Tổng khởi nghĩa được ban bố vào ngày giờ nào?"
        ],
        "approvedAnswer": "Đêm 13/8/1945, Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1. Đây là văn kiện chính thức phát lệnh Tổng khởi nghĩa, kêu gọi toàn dân đứng lên giành chính quyền.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử, thời khắc quyết định của non sông diễn ra vào đêm 13/8/1945, khi Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1. Đây là văn kiện chính thức phát lệnh Tổng khởi nghĩa, kêu gọi toàn dân đứng lên giành chính quyền.",
            "hoang-quoc-viet": "Bà con hãy nhớ hiệu lệnh thiêng liêng này: đêm 13/8/1945, Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1, chính thức phát lệnh Tổng khởi nghĩa, kêu gọi đồng bào cả nước đứng lên giành chính quyền về tay nhân dân.",
            "truong-chinh": "Về mặt văn kiện phát động Tổng khởi nghĩa: đêm 13/8/1945, Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1. Đây là văn kiện chính thức phát lệnh Tổng khởi nghĩa, kêu gọi toàn dân đứng lên giành chính quyền kịp thời nắm bắt thời cơ ngàn năm có một.",
            "vo-nguyen-giap": "Dưới góc độ mệnh lệnh tác chiến của cách mạng: đêm 13/8/1945, Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1, chính thức phát lệnh Tổng khởi nghĩa trên toàn quốc, kêu gọi quân và dân đồng loạt tiến công giành chính quyền."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.1",
            "excerpt": "Đêm 13/8/1945, Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1.\nĐây là văn kiện chính thức phát lệnh Tổng khởi nghĩa, kêu gọi toàn dân đứng lên giành chính quyền.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/135", "body/136"],
            "paragraphIndex": 135
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố.",
            "QUAN_LENH: Đối chiếu riêng người soạn, người ký, thời điểm ban bố và việc đọc Quân lệnh số 1; không suy diễn vai trò hoặc mốc thời gian ngoài nguồn mới."
        ]
    },
    # 28. IV-ORDER-CONTENT (IV.1)
    {
        "key": "IV-ORDER-CONTENT",
        "sectionId": "IV.1",
        "canonicalQuestion": "Quân lệnh số 1 ban bố đêm 13/8/1945 có những nội dung chủ yếu nào?",
        "aliases": [
            "Nội dung cốt lõi của Quân lệnh số 1 là gì?",
            "Ủy ban Khởi nghĩa toàn quốc yêu cầu quân và dân làm gì trong Quân lệnh số 1?",
            "Các điểm chính được nêu trong bản Quân lệnh số 1 gồm những gì?"
        ],
        "approvedAnswer": "Nội dung chủ yếu của Quân lệnh số 1: khẳng định thời cơ giành độc lập đã đến; kêu gọi quân và dân cả nước đứng lên khởi nghĩa; yêu cầu các địa phương nhanh chóng tổ chức lực lượng; kết hợp đấu tranh chính trị với đấu tranh vũ trang; hành động khẩn trương, kiên quyết để giành chính quyền trước khi quân Đồng minh vào Đông Dương.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu tóm lược các nội dung cốt lõi của bản quân lệnh: khẳng định thời cơ giành độc lập đã đến, kêu gọi toàn dân đứng lên, yêu cầu địa phương tổ chức lực lượng, kết hợp đấu tranh chính trị với vũ trang, hành động khẩn trương và kiên quyết giành chính quyền trước khi quân Đồng minh vào Đông Dương.",
            "hoang-quoc-viet": "Bản Quân lệnh số 1 truyền đi lời hiệu triệu đanh thép: báo rõ thời cơ độc lập đã điểm, kêu gọi đồng bào cả nước khởi nghĩa, thúc giục các địa phương gấp rút gom góp lực lượng, kết hợp đấu tranh chính trị với vũ trang, kiên quyết giành chính quyền trước lúc quân Đồng minh kéo vào.",
            "truong-chinh": "Về mặt tinh thần chỉ đạo chiến lược của Quân lệnh số 1: văn kiện khẳng định thời cơ giành độc lập đã đến; kêu gọi quân và dân cả nước đứng lên khởi nghĩa; yêu cầu các địa phương nhanh chóng tổ chức lực lượng; kết hợp đấu tranh chính trị với đấu tranh vũ trang; hành động khẩn trương, kiên quyết để giành chính quyền trước khi quân Đồng minh vào Đông Dương.",
            "vo-nguyen-giap": "Dưới góc độ mệnh lệnh quân sự và tổng động viên: Quân lệnh số 1 khẳng định thời cơ giành độc lập đã đến; kêu gọi toàn dân toàn quân khởi nghĩa; yêu cầu các địa phương tổ chức lực lượng; kết hợp chặt chẽ chính trị với quân sự; hành động khẩn trương, kiên quyết làm chủ đất nước trước khi quân Đồng minh kịp tiến vào."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.1",
            "excerpt": "Nội dung chủ yếu:\nKhẳng định thời cơ giành độc lập đã đến.\nKêu gọi quân và dân cả nước đứng lên khởi nghĩa.\nYêu cầu các địa phương nhanh chóng tổ chức lực lượng.\nKết hợp đấu tranh chính trị với đấu tranh vũ trang.\nHành động khẩn trương, kiên quyết để giành chính quyền trước khi quân Đồng minh vào Đông Dương.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/135", "body/136", "body/137", "body/138", "body/139", "body/140", "body/141", "body/142"],
            "paragraphIndex": 135
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố.",
            "QUAN_LENH: Đối chiếu riêng người soạn, người ký, thời điểm ban bố và việc đọc Quân lệnh số 1; không suy diễn vai trò hoặc mốc thời gian ngoài nguồn mới."
        ]
    },
    # 29. IV-ORDER-AUTHORS (IV.1)
    {
        "key": "IV-ORDER-AUTHORS",
        "sectionId": "IV.1",
        "canonicalQuestion": "Ai là người soạn thảo và ai là người thay mặt Ủy ban Khởi nghĩa toàn quốc ký Quân lệnh số 1?",
        "aliases": [
            "Người soạn thảo và người ký văn bản Quân lệnh số 1 là ai?",
            "Võ Nguyên Giáp và Trần Huy Liệu có vai trò gì đối với bản Quân lệnh số 1?",
            "Văn kiện Quân lệnh số 1 do ai viết và ai đứng tên ký?"
        ],
        "approvedAnswer": "Võ Nguyên Giáp thay mặt Ủy ban Khởi nghĩa toàn quốc ký Quân lệnh số 1. Văn bản do Trần Huy Liệu soạn thảo. Đây là chi tiết quan trọng cần ghi đúng, bởi người soạn thảo và người ký văn kiện không phải cùng một người.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu lưu ý một chi tiết lịch sử rất chuẩn xác: văn bản Quân lệnh số 1 do đồng chí Trần Huy Liệu soạn thảo, và đồng chí Võ Nguyên Giáp thay mặt Ủy ban Khởi nghĩa toàn quốc ký tên. Người soạn thảo và người ký văn kiện không phải là một người.",
            "hoang-quoc-viet": "Bà con và đồng chí cần phân biệt rành rọt điểm này: bản Quân lệnh số 1 do đồng chí Trần Huy Liệu chắp bút soạn thảo, còn đồng chí Võ Nguyên Giáp thay mặt Ủy ban Khởi nghĩa toàn quốc đứng ra ký tên phát lệnh.",
            "truong-chinh": "Về mặt thủ tục ban hành văn kiện lịch sử của Ủy ban Khởi nghĩa: văn bản Quân lệnh số 1 do đồng chí Trần Huy Liệu trực tiếp soạn thảo; đồng chí Võ Nguyên Giáp thay mặt Ủy ban Khởi nghĩa toàn quốc ký văn kiện. Đây là chi tiết cần ghi nhận chính xác theo tư liệu.",
            "vo-nguyen-giap": "Tài liệu ghi lại rất chuẩn xác vai trò của từng người: bản Quân lệnh số 1 do đồng chí Trần Huy Liệu soạn thảo, và tôi thay mặt Ủy ban Khởi nghĩa toàn quốc ký văn kiện lịch sử này. Cần phân biệt rõ người soạn thảo và người ký tên."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.1",
            "excerpt": "Vai trò của Võ Nguyên Giáp: Ông thay mặt Ủy ban Khởi nghĩa toàn quốc ký Quân lệnh số 1. Văn bản do Trần Huy Liệu soạn thảo.\nĐây là một chi tiết quan trọng cần ghi đúng, bởi người soạn thảo và người ký văn kiện không phải cùng một người.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/135", "body/136", "body/137", "body/138", "body/139", "body/140", "body/141", "body/142", "body/143", "body/144"],
            "paragraphIndex": 135
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố.",
            "QUAN_LENH: Đối chiếu riêng người soạn, người ký, thời điểm ban bố và việc đọc Quân lệnh số 1; không suy diễn vai trò hoặc mốc thời gian ngoài nguồn mới."
        ]
    },
    # 30. IV-PARTY-CONFERENCE (IV.2)
    {
        "key": "IV-PARTY-CONFERENCE",
        "sectionId": "IV.2",
        "canonicalQuestion": "Hội nghị toàn quốc của Đảng họp tại Tân Trào từ ngày 13 đến 15/8/1945 đã quyết định nội dung cơ bản nào?",
        "aliases": [
            "Hội nghị toàn quốc của Đảng ngày 13–15/8/1945 đưa ra quyết sách gì?",
            "Thời gian, địa điểm và quyết định của Hội nghị toàn quốc của Đảng tháng 8/1945 là gì?",
            "Đảng Cộng sản Đông Dương quyết định phát động Tổng khởi nghĩa tại hội nghị nào ở Tân Trào?"
        ],
        "approvedAnswer": "Hội nghị toàn quốc của Đảng được tổ chức từ ngày 13 đến 15/8/1945 tại Tân Trào, Tuyên Quang. Hội nghị đánh giá Nhật Bản đứng trước thất bại hoàn toàn, bộ máy cai trị ở Đông Dương suy yếu; trên cơ sở đó quyết định phát động Tổng khởi nghĩa, nhanh chóng huy động lực lượng toàn dân giành chính quyền trước khi quân Đồng minh tiến vào.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử: Hội nghị toàn quốc của Đảng họp từ ngày 13 đến 15/8/1945 tại Tân Trào, Tuyên Quang. Hội nghị nhận định Nhật Bản suy sụp và quyết định phát động Tổng khởi nghĩa, huy động toàn dân giành chính quyền trước khi quân Đồng minh tiến vào.",
            "hoang-quoc-viet": "Bà con và đồng chí nhớ rõ hội nghị lịch sử này: từ ngày 13 đến 15/8/1945, Hội nghị toàn quốc của Đảng họp tại Tân Trào, Tuyên Quang, quyết định phát động Tổng khởi nghĩa, kêu gọi toàn thể đồng bào vùng lên giành chính quyền trước khi quân Đồng minh kéo vào.",
            "truong-chinh": "Về quyết sách chiến lược của Đảng: từ ngày 13 đến 15/8/1945, Hội nghị toàn quốc của Đảng họp tại Tân Trào, Tuyên Quang. Hội nghị đánh giá sâu sắc tình hình, nhận định thời cơ chín muồi và hạ quyết tâm phát động Tổng khởi nghĩa, huy động lực lượng toàn dân giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương.",
            "vo-nguyen-giap": "Dưới góc độ quyết tâm quân sự - chính trị: Hội nghị toàn quốc của Đảng từ ngày 13 đến 15/8/1945 tại Tân Trào đã đánh giá đúng thời điểm kẻ thù suy sụp, quyết định phát động Tổng khởi nghĩa toàn dân, thần tốc giành quyền làm chủ trước khi các thế lực Đồng minh vào nước ta."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.2",
            "excerpt": "2. Ngày 13–15/8/1945: Hội nghị toàn quốc của Đảng tại Tân Trào\nHội nghị được tổ chức tại Tân Trào, Tuyên Quang.\nThành phần tham dự là đại biểu các tổ chức Đảng trong cả nước.\nNhững nội dung được thảo luận và quyết định:\nThứ nhất, đánh giá tình hình thế giới và trong nước.\nNhật Bản đang đứng trước thất bại hoàn toàn. Bộ máy cai trị ở Đông Dương suy yếu, tạo điều kiện thuận lợi cho cách mạng.\nThứ hai, quyết định phát động Tổng khởi nghĩa.\nHội nghị xác định phải nhanh chóng huy động lực lượng toàn dân, giành chính quyền trước khi quân Đồng minh tiến vào.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/145", "body/146", "body/147", "body/148", "body/149", "body/150", "body/151", "body/152"],
            "paragraphIndex": 145
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 31. IV-PRINCIPLES (IV.2)
    {
        "key": "IV-PRINCIPLES",
        "sectionId": "IV.2",
        "canonicalQuestion": "Ba nguyên tắc hành động được đề ra tại Hội nghị toàn quốc của Đảng tháng 8/1945 là gì?",
        "aliases": [
            "Ba nguyên tắc chỉ đạo khởi nghĩa tại Hội nghị Tân Trào tháng 8/1945 là gì?",
            "Nội dung ba nguyên tắc Tập trung, Thống nhất và Kịp thời trong Cách mạng tháng Tám là gì?",
            "Hội nghị toàn quốc của Đảng ngày 13–15/8/1945 xác định các nguyên tắc hành động nào?"
        ],
        "approvedAnswer": "Ba nguyên tắc hành động được đề ra tại Hội nghị toàn quốc của Đảng là: Tập trung (tập trung lực lượng vào những nhiệm vụ chính); Thống nhất (thống nhất về chính trị, quân sự, hành động và chỉ huy); Kịp thời (hành động nhanh chóng, không bỏ lỡ thời cơ).",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi nhận ba nguyên tắc chỉ đạo rất sáng suốt của Đảng: Tập trung lực lượng vào những nhiệm vụ chính; Thống nhất về chính trị, quân sự, hành động và chỉ huy; Kịp thời hành động nhanh chóng, tuyệt đối không bỏ lỡ thời cơ.",
            "hoang-quoc-viet": "Bà con và đồng chí nắm chắc ba phương châm hành động sống còn: một là Tập trung lực lượng vào việc then chốt; hai là Thống nhất muôn người như một từ chính trị, quân sự đến chỉ huy; ba là Kịp thời chớp lấy thời cơ, hành động nhanh không chậm trễ một khắc.",
            "truong-chinh": "Về mặt nguyên tắc tổ chức chỉ đạo khởi nghĩa: Hội nghị toàn quốc của Đảng đề ra ba nguyên tắc nền tảng: Tập trung (tập trung lực lượng vào những nhiệm vụ chính); Thống nhất (thống nhất về chính trị, quân sự, hành động và chỉ huy); Kịp thời (hành động nhanh chóng, không bỏ lỡ thời cơ). Đây là bảo đảm cốt tử cho thắng lợi của Tổng khởi nghĩa.",
            "vo-nguyen-giap": "Dưới góc độ nghệ thuật chỉ huy quân sự và tác chiến: ba nguyên tắc Hội nghị Tân Trào đề ra có giá trị định đoạt chiến trường: Tập trung lực lượng vào mục tiêu trọng yếu; Thống nhất chỉ huy, chính trị và phối hợp hành động; Kịp thời ra đòn chớp nhoáng, không được để lỡ thời cơ nghìn năm có một."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.2",
            "excerpt": "Ba nguyên tắc được đề ra là:\nTập trung: tập trung lực lượng vào những nhiệm vụ chính.\nThống nhất: thống nhất về chính trị, quân sự, hành động và chỉ huy.\nKịp thời: hành động nhanh chóng, không bỏ lỡ thời cơ.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/145", "body/146", "body/147", "body/148", "body/149", "body/150", "body/151", "body/152", "body/153", "body/154", "body/155", "body/156", "body/157", "body/158", "body/159"],
            "paragraphIndex": 145
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 32. IV-GIAP-ELECTION (IV.2)
    {
        "key": "IV-GIAP-ELECTION",
        "sectionId": "IV.2",
        "canonicalQuestion": "Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Võ Nguyên Giáp được bầu bổ sung vào cơ quan nào?",
        "aliases": [
            "Võ Nguyên Giáp được bầu vào cơ quan nào tại Hội nghị Tân Trào tháng 8/1945?",
            "Chức vụ mới của Võ Nguyên Giáp sau Hội nghị toàn quốc của Đảng năm 1945 là gì?",
            "Hội nghị toàn quốc tháng 8/1945 đã bầu bổ sung Võ Nguyên Giáp vào đâu?"
        ],
        "approvedAnswer": "Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Trường Chinh thể hiện vai trò nổi bật trong việc lãnh đạo về đường lối và tổ chức Tổng khởi nghĩa. Hoàng Quốc Việt được bầu vào Thường vụ Trung ương. Võ Nguyên Giáp được bầu bổ sung vào Ban Chấp hành Trung ương.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại việc kiện toàn cơ quan Trung ương tại Hội nghị: đồng chí Trường Chinh nổi bật vai trò lãnh đạo đường lối và tổ chức Tổng khởi nghĩa; đồng chí Hoàng Quốc Việt được bầu vào Thường vụ Trung ương; và đồng chí Võ Nguyên Giáp được bầu bổ sung vào Ban Chấp hành Trung ương Đảng.",
            "hoang-quoc-viet": "Tại Hội nghị toàn quốc tháng 8/1945 ở Tân Trào, tổ chức Đảng được kiện toàn vững mạnh: đồng chí Trường Chinh chỉ đạo đường lối sắc bén, tôi được bầu vào Thường vụ Trung ương, và đồng chí Võ Nguyên Giáp được bầu bổ sung vào Ban Chấp hành Trung ương để cùng gánh vác việc nước.",
            "truong-chinh": "Về mặt công tác nhân sự tại Hội nghị toàn quốc Tân Trào: đồng chí Hoàng Quốc Việt được bầu vào Thường vụ Trung ương, còn đồng chí Võ Nguyên Giáp được bầu bổ sung vào Ban Chấp hành Trung ương Đảng nhằm tăng cường cán bộ lãnh đạo quân sự cho Trung ương.",
            "vo-nguyen-giap": "Tư liệu lịch sử ghi nhận sự phân công của Đảng lúc đó: tại Hội nghị toàn quốc tháng 8/1945, đồng chí Trường Chinh lãnh đạo đường lối và tổ chức, đồng chí Hoàng Quốc Việt được bầu vào Thường vụ Trung ương, và tôi được tín nhiệm bầu bổ sung vào Ban Chấp hành Trung ương Đảng."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.2",
            "excerpt": "Tại Hội nghị, Trường Chinh thể hiện vai trò nổi bật trong việc lãnh đạo về đường lối và tổ chức Tổng khởi nghĩa. Hoàng Quốc Việt được bầu vào Thường vụ Trung ương. Võ Nguyên Giáp được bầu bổ sung vào Ban Chấp hành Trung ương.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/145", "body/146", "body/147", "body/148", "body/149", "body/150", "body/151", "body/152", "body/153", "body/154", "body/155", "body/156", "body/157", "body/158", "body/159", "body/160"],
            "paragraphIndex": 145
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 33. IV-LOCAL-INITIATIVE (IV.3)
    {
        "key": "IV-LOCAL-INITIATIVE",
        "sectionId": "IV.3",
        "canonicalQuestion": "Sau khi có tin Nhật đầu hàng Đồng minh, các tổ chức Việt Minh ở địa phương đã chủ động phát động nhân dân tiến hành những hoạt động nào?",
        "aliases": [
            "Phong trào khởi nghĩa ở các địa phương diễn ra như thế nào sau tin Nhật đầu hàng ngày 14–15/8/1945?",
            "Các hoạt động nổi dậy giành chính quyền tại các địa phương giữa tháng 8/1945 gồm những gì?",
            "Tính chủ động chớp thời cơ của các tổ chức Việt Minh địa phương được thể hiện qua các hành động nào?"
        ],
        "approvedAnswer": "Sau tin Nhật đầu hàng (14–15/8/1945), chính quyền thân Nhật rơi vào hoang mang. Ở nhiều địa phương, các tổ chức Việt Minh chủ động phát động nhân dân nổi dậy mà không chờ đợi mệnh lệnh trực tiếp từ Trung ương nếu điều kiện đã chín muồi. Các hoạt động bao gồm: tổ chức biểu tình và mít tinh; vận động binh lính Nhật và lực lượng bảo an không chống lại nhân dân; chiếm các cơ quan chính quyền địa phương; giải tán bộ máy tay sai; thành lập chính quyền cách mạng. Đây là thời kỳ khởi nghĩa từng phần phát triển thành cao trào cả nước.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi nhận tinh thần chủ động rất cao: khi tin Nhật đầu hàng lan rộng, các tổ chức Việt Minh địa phương đã linh hoạt phát động quần chúng nổi dậy khi thời cơ chín muồi mà không thụ động chờ lệnh. Nhân dân mít tinh biểu tình, vận động lính Nhật và bảo an không chống cự, chiếm cơ quan, giải tán tay sai và lập nên chính quyền cách mạng.",
            "hoang-quoc-viet": "Khí thế quần chúng lúc ấy dâng cao như nước vỡ bờ: nhiều địa phương Việt Minh đã chủ động dẫn dắt đồng bào đứng lên chớp lấy thời cơ. Bà con tổ chức biểu tình mít tinh rầm rộ, kêu gọi binh lính không theo giặc, nhanh chóng chiếm các công sở, xóa sổ bộ máy tay sai và lập ra chính quyền cách mạng của nhân dân.",
            "truong-chinh": "Về tính năng động và sáng tạo trong khởi nghĩa: trước khủng hoảng của chính quyền địch, nhiều tổ chức Việt Minh địa phương đã chủ động vận dụng đường lối, không chờ đợi mệnh lệnh từ Trung ương khi điều kiện đã chín muồi. Quần chúng tổ chức biểu tình, binh vận lực lượng bảo an, chiếm công sở đầu não, đập tan chính quyền tay sai và thiết lập chính quyền cách mạng.",
            "vo-nguyen-giap": "Dưới góc độ phát triển từ khởi nghĩa từng phần lên Tổng khởi nghĩa: các tổ chức Việt Minh cơ sở đã chủ động phối hợp chính trị và lực lượng tự vệ, vận động quân Nhật và bảo an án binh bất động, đánh chiếm công sở, xóa bỏ bộ máy bù nhìn và thành lập chính quyền cách mạng một cách thần tốc."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.3",
            "excerpt": "Các hoạt động bao gồm:\nTổ chức biểu tình và mít tinh.\nVận động binh lính Nhật và lực lượng bảo an không chống lại nhân dân.\nChiếm các cơ quan chính quyền địa phương.\nGiải tán bộ máy tay sai.\nThành lập chính quyền cách mạng.\nĐây là thời kỳ các cuộc khởi nghĩa từng phần phát triển thành cao trào trên phạm vi cả nước.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/161", "body/162", "body/163", "body/164", "body/165", "body/166", "body/167", "body/168", "body/169", "body/170", "body/171"],
            "paragraphIndex": 161
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 34. IV-CONGRESS (IV.4)
    {
        "key": "IV-CONGRESS",
        "sectionId": "IV.4",
        "canonicalQuestion": "Quốc dân Đại hội Tân Trào khai mạc vào ngày nào, tại địa điểm nào và có thành phần đại biểu tham dự ra sao?",
        "aliases": [
            "Thời gian, địa điểm và thành phần đại biểu tham dự Quốc dân Đại hội Tân Trào là gì?",
            "Quốc dân Đại hội ngày 16/8/1945 được tổ chức ở đâu với bao nhiêu đại biểu?",
            "Đại hội đại biểu họp ở đình Tân Trào tháng 8/1945 có quy mô như thế nào?"
        ],
        "approvedAnswer": "Ngày 16/8/1945, Quốc dân Đại hội được tổ chức tại đình Tân Trào, Tuyên Quang. Tham dự Đại hội có hơn 60 đại biểu đại diện cho các giới, các đoàn thể, các dân tộc, tôn giáo và ba miền đất nước.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử: ngày 16/8/1945, Quốc dân Đại hội đã họp tại đình Tân Trào, Tuyên Quang. Đại hội quy tụ hơn 60 đại biểu đại diện cho các giới, đoàn thể, dân tộc, tôn giáo và cả ba miền đất nước, thể hiện khối đại đoàn kết toàn dân tộc.",
            "hoang-quoc-viet": "Bà con và đồng chí nhớ mãi sự kiện trọng đại này: ngày 16/8/1945, Quốc dân Đại hội nhóm họp tại đình Tân Trào, tỉnh Tuyên Quang. Hơn 60 đại biểu từ Bắc, Trung, Nam, đại diện cho mọi tầng lớp nhân dân, dân tộc và tôn giáo đã tề tựu về chung một ý chí.",
            "truong-chinh": "Về mặt tính chất đại diện quốc gia của Quốc dân Đại hội: ngày 16/8/1945, Quốc dân Đại hội khai mạc tại đình Tân Trào, Tuyên Quang. Với hơn 60 đại biểu đại diện cho các giới, các đoàn thể, các dân tộc, tôn giáo từ khắp ba miền Bắc - Trung - Nam, Đại hội mang tầm vóc một hội nghị Diên Hồng thời hiện đại.",
            "vo-nguyen-giap": "Tư liệu lịch sử ghi nhận: ngày 16/8/1945, Quốc dân Đại hội được long trọng tổ chức tại đình Tân Trào, Tuyên Quang. Đại hội có hơn 60 đại biểu ưu tú đại diện cho đồng bào ba miền, các tổ chức đoàn thể, tôn giáo và dân tộc về dự để thống nhất ý chí Tổng khởi nghĩa."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.4",
            "excerpt": "4. Ngày 16/8/1945: Quốc dân Đại hội tại Tân Trào và xuất quân tiến về Thái Nguyên\nQuốc dân Đại hội được tổ chức tại đình Tân Trào, Tuyên Quang.\nCó hơn 60 đại biểu đại diện cho các giới, các đoàn thể, các dân tộc, tôn giáo và ba miền đất nước tham dự.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/172", "body/173", "body/174"],
            "paragraphIndex": 172
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 35. IV-CONGRESS-DECISIONS (IV.4)
    {
        "key": "IV-CONGRESS-DECISIONS",
        "sectionId": "IV.4",
        "canonicalQuestion": "Quốc dân Đại hội Tân Trào đã thông qua những quyết định quan trọng nào đối với vận mệnh đất nước?",
        "aliases": [
            "Những quyết định lịch sử của Quốc dân Đại hội Tân Trào ngày 16/8/1945 là gì?",
            "Quốc kỳ, Quốc ca và cơ quan lãnh đạo lâm thời được Quốc dân Đại hội quyết định thế nào?",
            "Nội dung các nghị quyết chính của Quốc dân Đại hội tại Tân Trào gồm những gì?"
        ],
        "approvedAnswer": "Những quyết định quan trọng của Quốc dân Đại hội Tân Trào gồm: tán thành chủ trương Tổng khởi nghĩa của Đảng; thông qua 10 chính sách lớn của Việt Minh; quyết định thành lập Ủy ban Dân tộc giải phóng Việt Nam do Hồ Chí Minh làm Chủ tịch; quy định Quốc kỳ là cờ đỏ sao vàng năm cánh; chọn bài Tiến quân ca của Văn Cao làm Quốc ca. Đại hội thể hiện sự thống nhất ý chí của toàn dân tộc.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại những quyết định mang tính lập quốc của Đại hội: tán thành chủ trương Tổng khởi nghĩa, thông qua 10 chính sách lớn của Việt Minh, lập Ủy ban Dân tộc giải phóng Việt Nam do Bác Hồ làm Chủ tịch, quy định cờ đỏ sao vàng năm cánh làm Quốc kỳ và chọn bài Tiến quân ca làm Quốc ca. Đại hội thể hiện sự thống nhất ý chí cao độ của non sông.",
            "hoang-quoc-viet": "Bà con ta hân hoan đón nhận các quyết định lịch sử: Quốc dân Đại hội đồng lòng tán thành Tổng khởi nghĩa, thông qua 10 chính sách lớn của Việt Minh vì dân vì nước, cử ra Ủy ban Dân tộc giải phóng do Bác Hồ đứng đầu, chọn lá cờ đỏ sao vàng thiêng liêng làm Quốc kỳ và lấy bài Tiến quân ca làm Quốc ca của toàn dân tộc.",
            "truong-chinh": "Về mặt pháp lý và thể chế cách mạng: Quốc dân Đại hội Tân Trào đã thông qua những quyết sách có ý nghĩa lịch sử to lớn: tán thành chủ trương Tổng khởi nghĩa của Đảng; thông qua 10 chính sách lớn của Việt Minh; quyết định thành lập Ủy ban Dân tộc giải phóng Việt Nam do đồng chí Hồ Chí Minh làm Chủ tịch; quy định Quốc kỳ là cờ đỏ sao vàng năm cánh; chọn bài Tiến quân ca của nhạc sĩ Văn Cao làm Quốc ca.",
            "vo-nguyen-giap": "Dưới góc độ động viên toàn dân trước giờ xuất trận: Quốc dân Đại hội Tân Trào đã chính thức thông qua quyết định Tổng khởi nghĩa, chuẩn y 10 chính sách lớn của Việt Minh, thành lập Ủy ban Dân tộc giải phóng do Hồ Chí Minh làm Chủ tịch, chọn cờ đỏ sao vàng làm Quốc kỳ và bài Tiến quân ca làm Quốc ca, hiệu triệu toàn thể quân dân một lòng quyết chiến."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.4",
            "excerpt": "Những quyết định quan trọng:\nTán thành chủ trương Tổng khởi nghĩa của Đảng.\nThông qua 10 chính sách lớn của Việt Minh.\nQuyết định thành lập Ủy ban Dân tộc giải phóng Việt Nam.\nBầu Hồ Chí Minh làm Chủ tịch Ủy ban.\nQuy định Quốc kỳ là cờ đỏ sao vàng năm cánh.\nChọn bài Tiến quân ca của Văn Cao làm Quốc ca.\nĐại hội thể hiện sự thống nhất ý chí của toàn dân tộc trong cuộc đấu tranh giành độc lập.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/172", "body/173", "body/174", "body/175", "body/176", "body/177", "body/178", "body/179", "body/180", "body/181", "body/182"],
            "paragraphIndex": 172
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 36. IV-THAI-NGUYEN-DATES (IV.4)
    {
        "key": "IV-THAI-NGUYEN-DATES",
        "sectionId": "IV.4",
        "canonicalQuestion": "Ngày 16/8 và ngày 20/8/1945 đánh dấu hai mốc hoạt động nào của lực lượng Giải phóng quân tiến về Thái Nguyên?",
        "aliases": [
            "Lực lượng Giải phóng quân do Võ Nguyên Giáp chỉ huy xuất phát từ Tân Trào và giành thắng lợi tại Thái Nguyên vào những ngày nào?",
            "Hai mốc thời gian ngày 16/8 và rạng sáng 20/8/1945 gắn với sự kiện quân sự gì?",
            "Cuộc xuất quân tiến công giải phóng thị xã Thái Nguyên diễn ra vào các ngày nào?"
        ],
        "approvedAnswer": "Cần phân biệt hai mốc: ngày 16/8/1945, Võ Nguyên Giáp chỉ huy một đơn vị Giải phóng quân xuất phát từ Tân Trào tiến về Thái Nguyên; rạng sáng 20/8/1945, lực lượng cách mạng tiến công và giành thắng lợi tại thị xã Thái Nguyên.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu phân định rất rành rọt hai thời điểm: ngày 16/8/1945 đơn vị Giải phóng quân do đồng chí Võ Nguyên Giáp chỉ huy xuất quân từ Tân Trào; đến rạng sáng 20/8/1945, lực lượng ta tiến công và giành thắng lợi giải phóng thị xã Thái Nguyên.",
            "hoang-quoc-viet": "Bà con và đồng chí cần nhớ rõ hai ngày này để tránh nhầm lẫn: ngày 16/8/1945 anh em Giải phóng quân làm lễ xuất quân từ Tân Trào, và đến rạng sáng ngày 20/8/1945 thì quân ta nổ súng tiến công giành thắng lợi vẻ vang tại thị xã Thái Nguyên.",
            "truong-chinh": "Về mặt diễn biến quân sự, cần phân biệt chính xác hai mốc thời gian: ngày 16/8/1945, một đơn vị Giải phóng quân do đồng chí Võ Nguyên Giáp chỉ huy xuất phát từ Tân Trào tiến về Thái Nguyên; rạng sáng ngày 20/8/1945, lực lượng cách mạng phối hợp nổ súng tiến công và giành thắng lợi tại thị xã Thái Nguyên.",
            "vo-nguyen-giap": "Theo diễn biến thực tế chiến trường: ngày 16/8/1945, tôi trực tiếp chỉ huy đơn vị Giải phóng quân xuất phát từ Tân Trào tiến về Thái Nguyên; sau quá trình cơ động và chuẩn bị, đến rạng sáng 20/8/1945 lực lượng cách mạng đã tiến công và giành thắng lợi tại thị xã Thái Nguyên."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.4",
            "excerpt": "Cần phân biệt hai mốc:\nNgày 16/8: đơn vị xuất quân từ Tân Trào.\nRạng sáng 20/8: lực lượng cách mạng tiến công và giành thắng lợi tại thị xã Thái Nguyên.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/183", "body/184", "body/185", "body/186", "body/187"],
            "paragraphIndex": 183
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 37. IV-LIBERATION-COMMITTEE (IV.5)
    {
        "key": "IV-LIBERATION-COMMITTEE",
        "sectionId": "IV.5",
        "canonicalQuestion": "Ủy ban Dân tộc giải phóng Việt Nam ra mắt vào ngày nào, do ai làm Chủ tịch và có vai trò tổ chức như thế nào?",
        "aliases": [
            "Ngày ra mắt, số lượng thành viên và người đứng đầu Ủy ban Dân tộc giải phóng Việt Nam là gì?",
            "Ủy ban Dân tộc giải phóng Việt Nam chính thức ra mắt tại đâu vào ngày 17/8/1945?",
            "Vai trò của Ủy ban Dân tộc giải phóng và sự tham gia của Phạm Văn Đồng ra sao?"
        ],
        "approvedAnswer": "Ngày 17/8/1945, Ủy ban Dân tộc giải phóng Việt Nam chính thức ra mắt tại Tân Trào. Hồ Chí Minh giữ chức Chủ tịch. Ủy ban có 15 thành viên, đóng vai trò như một chính phủ lâm thời của cách mạng. Phạm Văn Đồng tham gia cơ quan này và được bầu vào Ban Thường trực.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi nhận ngày ra mắt cơ quan đại diện quốc gia: ngày 17/8/1945, Ủy ban Dân tộc giải phóng Việt Nam chính thức ra mắt tại Tân Trào, do đồng chí Hồ Chí Minh làm Chủ tịch. Ủy ban gồm 15 thành viên đóng vai trò như một chính phủ lâm thời, và tôi vinh dự tham gia cơ quan này, được bầu vào Ban Thường trực.",
            "hoang-quoc-viet": "Bà con hãy nhớ ngày vui non sông: ngày 17/8/1945, Ủy ban Dân tộc giải phóng Việt Nam ra mắt trước quốc dân tại Tân Trào, do Bác Hồ làm Chủ tịch. Cơ quan gồm 15 thành viên như một chính phủ lâm thời, trong đó đồng chí Phạm Văn Đồng được bầu vào Ban Thường trực để cùng gánh vác việc nước.",
            "truong-chinh": "Về mặt tổ chức chính quyền tiền thân: ngày 17/8/1945, Ủy ban Dân tộc giải phóng Việt Nam chính thức ra mắt tại Tân Trào dưới sự lãnh đạo của Chủ tịch Hồ Chí Minh. Cơ quan gồm 15 thành viên, thực hiện chức năng như một chính phủ lâm thời; đồng chí Phạm Văn Đồng tham gia và được bầu vào Ban Thường trực của Ủy ban.",
            "vo-nguyen-giap": "Dưới góc độ thiết lập cơ quan quyền lực cách mạng: ngày 17/8/1945, Ủy ban Dân tộc giải phóng Việt Nam ra mắt tại Tân Trào với 15 thành viên do Hồ Chí Minh làm Chủ tịch, đóng vai trò như chính phủ lâm thời chỉ đạo cách mạng; đồng chí Phạm Văn Đồng tham gia và giữ cương vị ủy viên Ban Thường trực."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.5",
            "excerpt": "5. Ngày 17/8/1945: Ủy ban Dân tộc giải phóng ra mắt\nỦy ban Dân tộc giải phóng Việt Nam chính thức ra mắt tại Tân Trào.\nHồ Chí Minh giữ chức Chủ tịch.\nỦy ban có 15 thành viên, đóng vai trò như một chính phủ lâm thời của cách mạng.\nPhạm Văn Đồng tham gia cơ quan này và được bầu vào Ban Thường trực.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/188", "body/189", "body/190", "body/191", "body/192"],
            "paragraphIndex": 188
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 38. IV-FOUR-PROVINCES (IV.6)
    {
        "key": "IV-FOUR-PROVINCES",
        "sectionId": "IV.6",
        "canonicalQuestion": "Bốn tỉnh nào đã giành chính quyền ở tỉnh lỵ sớm nhất cả nước vào ngày 18/8/1945?",
        "aliases": [
            "Bốn tỉnh giành chính quyền sớm nhất vào ngày 18/8/1945 là những tỉnh nào?",
            "Ngày 18/8/1945, những tỉnh lỵ nào đã về tay chính quyền cách mạng?",
            "Thắng lợi khởi nghĩa sớm nhất tại 4 tỉnh lỵ ngày 18/8/1945 diễn ra ở đâu?"
        ],
        "approvedAnswer": "Bốn tỉnh giành chính quyền ở tỉnh lỵ sớm nhất vào ngày 18/8/1945 gồm: Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam. Tại các địa phương này, lực lượng Việt Minh và quần chúng nổi dậy chiếm cơ quan chính quyền, làm tan rã bộ máy cai trị cũ và lập chính quyền cách mạng, tạo thắng lợi sớm cổ vũ phong trào cả nước.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu ghi nhận những phát pháo hiệu đầu tiên của Tổng khởi nghĩa: ngày 18/8/1945, bốn tỉnh giành chính quyền ở tỉnh lỵ sớm nhất gồm Bắc Giang, Hải Dương, Hà Tĩnh và Quảng Nam. Thắng lợi mau lẹ tại các nơi này đã cổ vũ mạnh mẽ phong trào nổi dậy trên cả nước.",
            "hoang-quoc-viet": "Bà con và đồng chí tự hào ghi nhớ bốn ngọn cờ đầu: ngày 18/8/1945, bốn tỉnh giành chính quyền ở tỉnh lỵ sớm nhất gồm Bắc Giang, Hải Dương, Hà Tĩnh, Quảng Nam. Quần chúng ta nhất tề xông lên chiếm công sở, giải tán bộ máy tay sai, lập nên chính quyền cách mạng làm nức lòng đồng bào muôn nơi.",
            "truong-chinh": "Về mặt đột phá cục diện địa phương: ngày 18/8/1945, bốn tỉnh giành chính quyền ở tỉnh lỵ sớm nhất gồm Bắc Giang, Hải Dương, Hà Tĩnh và Quảng Nam. Việc chớp thời cơ kịp thời ở bốn tỉnh này đã làm tan rã mắt xích cai trị cũ, có tác dụng cổ vũ trực tiếp cho cuộc khởi nghĩa tại Hà Nội và toàn quốc.",
            "vo-nguyen-giap": "Dưới góc độ tiến công khởi nghĩa nhanh gọn: ngày 18/8/1945, bốn tỉnh giành chính quyền ở tỉnh lỵ sớm nhất gồm Bắc Giang, Hải Dương, Hà Tĩnh và Quảng Nam. Lực lượng tự vệ và quần chúng chính trị đã hiệp đồng làm chủ tỉnh lỵ, giáng đòn bất ngờ làm sụp đổ chính quyền tay sai địa phương."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "IV.6",
            "excerpt": "6. Ngày 18/8/1945: Bốn tỉnh giành chính quyền ở tỉnh lỵ sớm nhất\nBốn tỉnh gồm:\nBắc Giang.\nHải Dương.\nHà Tĩnh.\nQuảng Nam.\nTại các địa phương này, lực lượng Việt Minh và quần chúng nhân dân tổ chức nổi dậy, chiếm các cơ quan chính quyền, làm tan rã bộ máy cai trị cũ và thành lập chính quyền cách mạng.\nĐây là những thắng lợi sớm, có tác dụng cổ vũ mạnh mẽ phong trào khởi nghĩa trên cả nước.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/197", "body/198", "body/199", "body/200", "body/201", "body/202", "body/203", "body/204"],
            "paragraphIndex": 197
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    }
]


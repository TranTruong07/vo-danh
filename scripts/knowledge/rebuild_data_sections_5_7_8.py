# -*- coding: utf-8 -*-
"""
Rebuild Data for Section V, Section VII, and Section VIII
Contains 10 proposed units:
- Section V (3 units): V-DONG, V-GIAP, V-CHINH (V-VIET is held for review)
- Section VII (5 units): VII-LEADERSHIP, VII-PREPARATION, VII-UNITY, VII-FORCES, VII-OBJECTIVE
- Section VIII (2 units): VIII-VIETNAM, VIII-WORLD
"""

SECTIONS_5_7_8_DATA = [
    # 53. V-DONG (V.1)
    {
        "key": "V-DONG",
        "sectionId": "V.1",
        "canonicalQuestion": "Sau ngày 2/9/1945, Phạm Văn Đồng đảm nhiệm chức vụ gì và tập trung vào những nhiệm vụ cấp bách nào?",
        "aliases": [
            "Công việc của Phạm Văn Đồng sau Cách mạng tháng Tám tập trung vào lĩnh vực nào?",
            "Phạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính sau ngày 2/9/1945 và giải quyết những việc gì?",
            "Vai trò xây dựng nền kinh tế tài chính của Phạm Văn Đồng sau khi giành độc lập ra sao?"
        ],
        "approvedAnswer": "Sau ngày 2/9/1945, Phạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính trong Chính phủ lâm thời. Ông tham gia giải quyết những khó khăn tài chính của chính quyền mới, góp phần xây dựng nền tài chính độc lập, tham gia các hoạt động củng cố chính quyền cách mạng. Nhiệm vụ của ông gắn với việc xây dựng nền tảng kinh tế, tài chính cho nhà nước mới thành lập.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử: sau ngày 2/9/1945, tôi được Chính phủ lâm thời giao giữ chức Bộ trưởng Bộ Tài chính, trực tiếp cùng các đồng chí giải quyết những khó khăn tài chính chồng chất của chính quyền non trẻ, góp phần xây dựng nền tài chính độc lập và củng cố nền tảng kinh tế cho nhà nước mới thành lập.",
            "hoang-quoc-viet": "Bà con và đồng chí nhớ rõ những ngày đầu dựng nước muôn vàn khó khăn: đồng chí Phạm Văn Đồng đảm nhiệm chức Bộ trưởng Bộ Tài chính trong Chính phủ lâm thời, lo toan từng đồng ngân khố, xây dựng nền tài chính độc lập và củng cố chính quyền cách mạng của nhân dân.",
            "truong-chinh": "Về mặt xây dựng nền tảng kinh tế nhà nước cách mạng: sau ngày 2/9/1945, đồng chí Phạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính trong Chính phủ lâm thời, tham gia giải quyết những khó khăn tài chính gay gắt, góp phần xây dựng nền tài chính độc lập và củng cố chính quyền non trẻ trước thù trong giặc ngoài.",
            "vo-nguyen-giap": "Dưới góc độ hậu cần và tiềm lực quốc phòng buổi đầu lập quốc: sau Cách mạng tháng Tám, đồng chí Phạm Văn Đồng giữ chức Bộ trưởng Bộ Tài chính, gánh vác trọng trách giải quyết ách tắc kinh tế, xây dựng nền tài chính độc lập bảo đảm cho bộ máy chính quyền và lực lượng vũ trang hoạt động."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "V.1",
            "excerpt": "1. Phạm Văn Đồng\nSau ngày 2/9/1945:\nGiữ chức Bộ trưởng Bộ Tài chính trong Chính phủ lâm thời.\nTham gia giải quyết những khó khăn tài chính của chính quyền mới.\nGóp phần xây dựng nền tài chính độc lập.\nTham gia các hoạt động củng cố chính quyền cách mạng.\nNhiệm vụ của ông gắn với việc xây dựng nền tảng kinh tế, tài chính cho nhà nước mới thành lập.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/326", "body/327", "body/328", "body/329", "body/330", "body/331", "body/332"],
            "paragraphIndex": 326
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 54. V-GIAP (V.2)
    {
        "key": "V-GIAP",
        "sectionId": "V.2",
        "canonicalQuestion": "Sau Cách mạng tháng Tám, Võ Nguyên Giáp đảm nhiệm trọng trách gì và tham gia bảo vệ chính quyền qua những công việc nào?",
        "aliases": [
            "Vai trò và nhiệm vụ của Võ Nguyên Giáp trên cương vị Bộ trưởng Bộ Nội vụ sau năm 1945 là gì?",
            "Võ Nguyên Giáp thực hiện những công việc gì để củng cố chính quyền và bảo vệ lễ tuyên bố độc lập?",
            "Sau ngày 2/9/1945, Võ Nguyên Giáp phụ trách các vấn đề gì trong Chính phủ lâm thời?"
        ],
        "approvedAnswer": "Sau Cách mạng tháng Tám, Võ Nguyên Giáp giữ chức Bộ trưởng Bộ Nội vụ, tham gia tổ chức bộ máy chính quyền, phụ trách các vấn đề an ninh, trật tự và nội chính, tham gia bảo vệ an toàn cho lễ tuyên bố độc lập ngày 2/9/1945, góp phần củng cố chính quyền cách mạng trong tình hình đất nước có nhiều khó khăn.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi nhận những đóng góp to lớn của đồng chí Võ Nguyên Giáp trong buổi đầu độc lập: trên cương vị Bộ trưởng Bộ Nội vụ, đồng chí tham gia tổ chức bộ máy chính quyền, phụ trách an ninh, trật tự và nội chính, trực tiếp chỉ huy bảo vệ an toàn tuyệt đối cho lễ tuyên bố độc lập ngày 2/9/1945 và củng cố chính quyền cách mạng.",
            "hoang-quoc-viet": "Bà con đều biết trọng trách nặng nề của anh Văn: sau Cách mạng tháng Tám, đồng chí Võ Nguyên Giáp làm Bộ trưởng Bộ Nội vụ, lo việc củng cố bộ máy chính quyền, giữ vững trật tự trị an, bảo vệ tuyệt đối an toàn cho ngày Tết Độc lập 2/9/1945 và giữ vững chính quyền nhân dân giữa muôn vàn khó khăn.",
            "truong-chinh": "Về mặt bảo vệ thể chế và tổ chức an ninh nội chính: sau Cách mạng tháng Tám, đồng chí Võ Nguyên Giáp giữ chức Bộ trưởng Bộ Nội vụ, gánh vác việc xây dựng bộ máy nhà nước, phụ trách công tác nội chính an ninh, bảo vệ an toàn lễ tuyên bố độc lập ngày 2/9/1945, góp phần quyết định bảo vệ thành quả cách mạng.",
            "vo-nguyen-giap": "Tư liệu lịch sử ghi nhận trọng trách của tôi trong Chính phủ lâm thời: sau Cách mạng tháng Tám, tôi được giao giữ chức Bộ trưởng Bộ Nội vụ, trực tiếp tham gia tổ chức bộ máy chính quyền non trẻ, phụ trách an ninh trật tự nội chính, tổ chức bảo vệ an toàn tuyệt đối cho lễ tuyên bố độc lập ngày 2/9/1945 và củng cố chính quyền trước hiểm họa thù trong giặc ngoài."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "V.2",
            "excerpt": "2. Võ Nguyên Giáp\nSau Cách mạng tháng Tám:\nGiữ chức Bộ trưởng Bộ Nội vụ.\nTham gia tổ chức bộ máy chính quyền.\nPhụ trách các vấn đề an ninh, trật tự và nội chính.\nTham gia bảo vệ an toàn cho lễ tuyên bố độc lập ngày 2/9/1945.\nGóp phần củng cố chính quyền cách mạng trong tình hình đất nước có nhiều khó khăn.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/333", "body/334", "body/335", "body/336", "body/337", "body/338", "body/339"],
            "paragraphIndex": 333
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 55. V-CHINH (V.4)
    {
        "key": "V-CHINH",
        "sectionId": "V.4",
        "canonicalQuestion": "Sau Cách mạng tháng Tám, Trường Chinh tiếp tục đóng góp vào sự nghiệp củng cố chính quyền cách mạng qua những công việc gì?",
        "aliases": [
            "Vai trò lãnh đạo của Tổng Bí thư Trường Chinh sau Cách mạng tháng Tám là gì?",
            "Trường Chinh thực hiện những nhiệm vụ chính trị nào sau khi giành được chính quyền?",
            "Công tác hoạch định đường lối và củng cố tổ chức của Trường Chinh sau năm 1945 ra sao?"
        ],
        "approvedAnswer": "Sau Cách mạng tháng Tám, Trường Chinh tiếp tục giữ vai trò lãnh đạo trong Đảng, tham gia hoạch định đường lối chính trị, góp phần củng cố tổ chức Đảng và chính quyền cách mạng, tham gia giải quyết những nhiệm vụ chính trị cấp bách của đất nước. Vai trò của ông tiếp tục gắn với công tác lãnh đạo chính trị và xây dựng đường lối cách mạng.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu khẳng định vị trí trung tâm của đồng chí Trường Chinh: sau Cách mạng tháng Tám, đồng chí tiếp tục giữ vai trò lãnh đạo trong Đảng, hoạch định đường lối chính trị, củng cố tổ chức Đảng và chính quyền cách mạng, giải quyết những nhiệm vụ chính trị cấp bách bảo vệ vận mệnh non sông.",
            "hoang-quoc-viet": "Bà con và anh em trong Đảng luôn hướng về sự chỉ đạo sáng suốt của đồng chí Tổng Bí thư Trường Chinh: sau thắng lợi, đồng chí tiếp tục chèo lái con thuyền cách mạng, vạch ra đường lối chính trị đúng đắn, xây dựng tổ chức Đảng vững mạnh, giải quyết các khó khăn chính trị để giữ vững chính quyền nhân dân.",
            "truong-chinh": "Tư liệu lịch sử phản ánh công tác lãnh đạo của tôi giai đoạn sau thắng lợi: sau Cách mạng tháng Tám, tôi tiếp tục giữ vai trò lãnh đạo trong Đảng, tham gia hoạch định đường lối chính trị cách mạng, củng cố tổ chức Đảng và bộ máy chính quyền, đồng thời giải quyết các nhiệm vụ chính trị cấp bách của đất nước nhằm chuẩn bị cho cuộc kháng chiến kiến quốc lâu dài.",
            "vo-nguyen-giap": "Dưới góc độ hạt nhân lãnh đạo chính trị của Đảng: sau Cách mạng tháng Tám, đồng chí Tổng Bí thư Trường Chinh tiếp tục giữ vai trò lãnh đạo then chốt, hoạch định đường lối chính trị, củng cố sự đoàn kết thống nhất trong Đảng và chính quyền, định hướng chiến lược cho toàn Đảng, toàn quân trước tình thế mới."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "V.4",
            "excerpt": "4. Trường Chinh\nSau Cách mạng tháng Tám:\nTiếp tục giữ vai trò lãnh đạo trong Đảng.\nTham gia hoạch định đường lối chính trị.\nGóp phần củng cố tổ chức Đảng và chính quyền cách mạng.\nTham gia giải quyết những nhiệm vụ chính trị cấp bách của đất nước.\nVai trò của Trường Chinh tiếp tục gắn với công tác lãnh đạo chính trị và xây dựng đường lối cách mạng.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/350", "body/351", "body/352", "body/353", "body/354", "body/355", "body/356"],
            "paragraphIndex": 350
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 56. VII-LEADERSHIP (VII.1)
    {
        "key": "VII-LEADERSHIP",
        "sectionId": "VII.1",
        "canonicalQuestion": "Sự lãnh đạo của Đảng và Chủ tịch Hồ Chí Minh đã góp phần quyết định vào thắng lợi của Cách mạng tháng Tám như thế nào?",
        "aliases": [
            "Vai trò lãnh đạo của Đảng và Bác Hồ là nguyên nhân thắng lợi của Cách mạng tháng Tám ra sao?",
            "Đảng và Hồ Chí Minh đã có những quyết định sáng suốt nào đem lại thắng lợi tháng Tám năm 1945?",
            "Nguyên nhân chủ quan hàng đầu dẫn tới thắng lợi Cách mạng tháng Tám 1945 là gì?"
        ],
        "approvedAnswer": "Nguyên nhân chủ quan hàng đầu là sự lãnh đạo đúng đắn của Đảng và Chủ tịch Hồ Chí Minh: Đảng đã xác định đúng nhiệm vụ giải phóng dân tộc, xây dựng lực lượng và lựa chọn thời điểm phát động Tổng khởi nghĩa.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu khẳng định nguyên nhân chủ quan bao trùm: đó là sự lãnh đạo đúng đắn của Đảng và Chủ tịch Hồ Chí Minh. Đảng đã xác định đúng nhiệm vụ giải phóng dân tộc lên trên hết, bền bỉ xây dựng lực lượng và lựa chọn chính xác thời điểm phát động Tổng khởi nghĩa.",
            "hoang-quoc-viet": "Bà con ta đều thấu hiểu: nhân tố quyết định nhất là nhờ có Đảng quang vinh và Bác Hồ muôn vàn kính yêu lãnh đạo. Đảng ta đã chỉ rõ đường giải phóng dân tộc, gây dựng lực lượng trong quần chúng và chọn đúng thời cơ ngàn năm có một để lãnh đạo toàn dân đứng lên thắng lợi.",
            "truong-chinh": "Về mặt nguyên nhân chủ quan cốt lõi: sự lãnh đạo đúng đắn của Đảng và Chủ tịch Hồ Chí Minh là nhân tố quyết định hàng đầu. Đảng đã vận dụng sáng tạo chủ nghĩa Mác - Lênin, xác định đúng nhiệm vụ giải phóng dân tộc, chuẩn bị chu đáo về lực lượng và chớp đúng thời điểm lịch sử để phát động Tổng khởi nghĩa thắng lợi.",
            "vo-nguyen-giap": "Dưới góc độ nghệ thuật chỉ đạo chiến lược cách mạng: thắng lợi bắt nguồn từ sự lãnh đạo thiên tài, đúng đắn của Đảng và Chủ tịch Hồ Chí Minh. Đảng đã giải quyết triệt để nhiệm vụ giải phóng dân tộc, dày công xây dựng lực lượng vũ trang và chính trị, đồng thời quyết đoán hạ lệnh Tổng khởi nghĩa đúng thời khắc quyết định."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VII.1",
            "excerpt": "1. Nguyên nhân chủ quan\nSự lãnh đạo đúng đắn của Đảng và Chủ tịch Hồ Chí Minh\nĐảng đã xác định đúng nhiệm vụ giải phóng dân tộc, xây dựng lực lượng và lựa chọn thời điểm phát động Tổng khởi nghĩa.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/358", "body/359", "body/360"],
            "paragraphIndex": 358
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 57. VII-PREPARATION (VII.1)
    {
        "key": "VII-PREPARATION",
        "sectionId": "VII.1",
        "canonicalQuestion": "Quá trình chuẩn bị lâu dài, chu đáo qua các thời kỳ đã tạo nên những nền tảng thực lực nào cho thắng lợi của Cách mạng tháng Tám?",
        "aliases": [
            "Cách mạng tháng Tám đã xây dựng được những nền tảng gì qua quá trình chuẩn bị lâu dài?",
            "Các yếu tố thực lực cách mạng được tích lũy trong nhiều năm gồm những gì?",
            "Tại sao sự chuẩn bị lâu dài, chu đáo là nguyên nhân dẫn đến thắng lợi năm 1945?"
        ],
        "approvedAnswer": "Quá trình chuẩn bị lâu dài, chu đáo là nguyên nhân chủ quan quan trọng. Trong nhiều năm, cách mạng đã xây dựng được: lực lượng chính trị, lực lượng vũ trang, căn cứ địa cách mạng, Mặt trận đoàn kết dân tộc, và hệ thống tổ chức Đảng cùng Việt Minh.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu đúc kết: thắng lợi rực rỡ tháng Tám bắt nguồn từ quá trình chuẩn bị lâu dài và chu đáo. Trong nhiều năm kiên trì, cách mạng ta đã gây dựng được đầy đủ: lực lượng chính trị, lực lượng vũ trang, căn cứ địa cách mạng, Mặt trận đoàn kết dân tộc cùng hệ thống tổ chức Đảng và Việt Minh rộng khắp.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy rõ: thắng lợi không tự nhiên mà có, mà là kết quả chuẩn bị bền bỉ nhiều năm trời. Nhân dân ta dưới sự lãnh đạo của Đảng đã xây dựng nên lực lượng chính trị hùng hậu, các đội quân vũ trang kiên cường, các căn cứ kháng chiến và Mặt trận Việt Minh đại đoàn kết khắp xóm làng.",
            "truong-chinh": "Về mặt quy luật tích lũy thực lực cách mạng: chuẩn bị lâu dài, chu đáo là nguyên nhân chủ quan căn bản. Qua các thời kỳ đấu tranh cam go, Đảng và nhân dân ta đã dày công xây dựng được lực lượng chính trị quần chúng, lực lượng vũ trang nhân dân, hệ thống căn cứ địa cách mạng, Mặt trận đại đoàn kết dân tộc và bộ máy tổ chức Đảng cùng Việt Minh chặt chẽ.",
            "vo-nguyen-giap": "Dưới góc độ nghệ thuật chuẩn bị chiến tranh giải phóng: thắng lợi Cách mạng tháng Tám là kết tinh của quá trình chuẩn bị lực lượng chu đáo qua nhiều năm tháng, bao gồm việc xây dựng lực lượng chính trị làm nền tảng, lực lượng vũ trang làm nòng cốt, lập căn cứ địa Việt Bắc vững chắc và hoàn thiện hệ thống Mặt trận Việt Minh."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VII.1",
            "excerpt": "Quá trình chuẩn bị lâu dài, chu đáo\nTrong nhiều năm, cách mạng đã xây dựng được:\nLực lượng chính trị.\nLực lượng vũ trang.\nCăn cứ địa cách mạng.\nMặt trận đoàn kết dân tộc.\nHệ thống tổ chức Đảng và Việt Minh.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/361", "body/362", "body/363", "body/364", "body/365", "body/366", "body/367"],
            "paragraphIndex": 361
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 58. VII-UNITY (VII.1)
    {
        "key": "VII-UNITY",
        "sectionId": "VII.1",
        "canonicalQuestion": "Tinh thần đoàn kết toàn dân tộc – một nguyên nhân thắng lợi của Cách mạng tháng Tám – được thể hiện qua các lực lượng xã hội nào?",
        "aliases": [
            "Khối đại đoàn kết toàn dân trong Cách mạng tháng Tám bao gồm những thành phần nào?",
            "Lực lượng xã hội nào đã tham gia cuộc đấu tranh giải phóng dân tộc năm 1945?",
            "Tinh thần đoàn kết dân tộc đóng vai trò gì trong nguyên nhân thắng lợi Cách mạng tháng Tám?"
        ],
        "approvedAnswer": "Tinh thần đoàn kết toàn dân tộc là nguyên nhân chủ quan quan trọng: nhân dân thuộc nhiều tầng lớp, ngành nghề, dân tộc và tôn giáo đã tham gia đấu tranh.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu lịch sử nhấn mạnh sức mạnh vĩ đại của sự hòa hợp dân tộc: tinh thần đoàn kết toàn dân tộc thể hiện ở việc nhân dân thuộc mọi tầng lớp xã hội, ngành nghề, các dân tộc anh em và các tôn giáo khác nhau đều chung sức đồng lòng tham gia đấu tranh giành độc lập.",
            "hoang-quoc-viet": "Bà con lao động nhớ mãi sức mạnh của khối đại đoàn kết: già trẻ gái trai, công nhân, nông dân, trí thức, tiểu thương, đồng bào các dân tộc thiểu số và các tôn giáo đều kết thành một khối vững chắc trong Mặt trận Việt Minh để đấu tranh giải phóng quê hương.",
            "truong-chinh": "Về mặt bài học đại đoàn kết dân tộc: tinh thần đoàn kết toàn dân tộc là cội nguồn sức mạnh vô địch. Đường lối của Đảng đã quy tụ đông đảo nhân dân thuộc nhiều tầng lớp, ngành nghề, không phân biệt dân tộc và tôn giáo, tạo thành làn sóng cách mạng đập tan ách thống trị phát xít - thực dân.",
            "vo-nguyen-giap": "Dưới góc độ sức mạnh toàn dân đánh giặc: tinh thần đoàn kết toàn dân tộc đã động viên toàn thể nhân dân thuộc nhiều tầng lớp, ngành nghề, dân tộc và tôn giáo cùng tham gia mặt trận giải phóng, tạo nên bức tường thành chính trị vững chắc hỗ trợ cho cuộc Tổng khởi nghĩa thắng lợi."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VII.1",
            "excerpt": "Tinh thần đoàn kết toàn dân tộc\nNhân dân thuộc nhiều tầng lớp, ngành nghề, dân tộc và tôn giáo đã tham gia đấu tranh.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/368", "body/369"],
            "paragraphIndex": 368
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 59. VII-FORCES (VII.1)
    {
        "key": "VII-FORCES",
        "sectionId": "VII.1",
        "canonicalQuestion": "Sự kết hợp giữa đấu tranh chính trị và đấu tranh vũ trang trong Cách mạng tháng Tám có vai trò phân công cụ thể như thế nào?",
        "aliases": [
            "Vai trò của lực lượng chính trị và lực lượng vũ trang trong Cách mạng tháng Tám là gì?",
            "Đấu tranh chính trị và đấu tranh vũ trang phối hợp với nhau ra sao để giành thắng lợi?",
            "Lực lượng nào giữ vai trò chủ yếu và lực lượng nào giữ vai trò nòng cốt hỗ trợ năm 1945?"
        ],
        "approvedAnswer": "Sự kết hợp giữa đấu tranh chính trị và đấu tranh vũ trang: quần chúng chính trị giữ vai trò chủ yếu, lực lượng vũ trang giữ vai trò hỗ trợ, nòng cốt và bảo vệ phong trào.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu phân định rất khoa học nghệ thuật kết hợp lực lượng: trong Cách mạng tháng Tám, lực lượng quần chúng chính trị giữ vai trò chủ yếu quyết định, còn lực lượng vũ trang giữ vai trò hỗ trợ, làm nòng cốt và bảo vệ cho phong trào tiến công.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy rõ sự phối hợp tuyệt vời: sức mạnh triệu người biểu tình của quần chúng chính trị là lực lượng chủ yếu áp đảo quân thù, còn các đội tự vệ và lực lượng vũ trang làm nòng cốt bảo vệ, hỗ trợ đắc lực để khởi nghĩa giành toàn thắng.",
            "truong-chinh": "Về mặt nghệ thuật khởi nghĩa bạo lực cách mạng: sự kết hợp nhuần nhuyễn giữa đấu tranh chính trị và đấu tranh vũ trang thể hiện ở nguyên lý: lực lượng chính trị của quần chúng giữ vai trò chủ yếu, quyết định trong việc tiếp quản chính quyền; lực lượng vũ trang giữ vai trò hỗ trợ, xung kích làm nòng cốt và bảo vệ phong trào nổi dậy.",
            "vo-nguyen-giap": "Dưới góc độ hiệp đồng phương thức tác chiến khởi nghĩa: Cách mạng tháng Tám là đỉnh cao của sự phối hợp hai lực lượng: quần chúng chính trị đông đảo giữ vai trò chủ yếu đè bẹp bộ máy địch, còn lực lượng vũ trang giữ vai trò hỗ trợ đòn điểm, làm nòng cốt và bảo vệ an toàn cho phong trào."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VII.1",
            "excerpt": "Sự kết hợp giữa đấu tranh chính trị và đấu tranh vũ trang\nQuần chúng chính trị giữ vai trò chủ yếu, lực lượng vũ trang giữ vai trò hỗ trợ, nòng cốt và bảo vệ phong trào.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/370", "body/371"],
            "paragraphIndex": 370
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 60. VII-OBJECTIVE (VII.2)
    {
        "key": "VII-OBJECTIVE",
        "sectionId": "VII.2",
        "canonicalQuestion": "Những điều kiện khách quan quốc tế nào đã tạo thời cơ thuận lợi cho Cách mạng tháng Tám năm 1945 giành thắng lợi?",
        "aliases": [
            "Nguyên nhân khách quan tạo ra thời cơ cho Cách mạng tháng Tám là gì?",
            "Bối cảnh quốc tế nào giúp nhân dân Việt Nam có cơ hội thuận lợi giành chính quyền?",
            "Các yếu tố khách quan dẫn tới sự suy yếu của kẻ thù trong Cách mạng tháng Tám gồm những gì?"
        ],
        "approvedAnswer": "Những nguyên nhân khách quan tạo thời cơ gồm: Chiến tranh thế giới thứ hai kết thúc; phát xít Nhật đầu hàng Đồng minh; bộ máy thống trị Nhật và chính quyền tay sai suy yếu nghiêm trọng; quân Đồng minh chưa kịp tiến vào Đông Dương để giải giáp quân Nhật. Những yếu tố này tạo ra thời cơ thuận lợi để nhân dân Việt Nam giành chính quyền.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu phân tích các điều kiện quốc tế khách quan hết sức thuận lợi: Chiến tranh thế giới thứ hai kết thúc, phát xít Nhật đầu hàng Đồng minh, bộ máy cai trị của Nhật và tay sai suy yếu nghiêm trọng, và quân Đồng minh chưa kịp vào Đông Dương giải giáp. Tất cả đã tạo nên thời cơ thuận lợi ngàn năm có một cho dân tộc ta.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy rõ thời cơ trời cho: giặc phát xít Nhật bị Đồng minh đánh bại phải đầu hàng, chiến tranh thế giới kết thúc, bọn tay sai bán nước run sợ rệu rã, lại thêm quân Đồng minh chưa kịp kéo vào. Chính những điều kiện quốc tế ấy đã mở đường cho toàn dân ta nhất tề đứng dậy.",
            "truong-chinh": "Về mặt phân tích thời cơ khách quan của cách mạng: những yếu tố khách quan quyết định gồm: Chiến tranh thế giới thứ hai kết thúc; phát xít Nhật đầu hàng Đồng minh vô điều kiện; bộ máy thống trị Nhật và chính quyền tay sai suy yếu nghiêm trọng; quân Đồng minh chưa kịp tiến vào Đông Dương để giải giáp quân Nhật. Những yếu tố đó tạo ra khoảng trống quyền lực và thời cơ vô cùng thuận lợi để nhân dân ta tiến hành Tổng khởi nghĩa.",
            "vo-nguyen-giap": "Dưới góc độ chớp thời cơ thuận lợi quốc tế: Chiến tranh thế giới thứ hai kết thúc, phát xít Nhật đầu hàng Đồng minh làm sụp đổ hoàn toàn ý chí chiến đấu của quân chiếm đóng, chính quyền bù nhìn tan rã, trong khi quân Đồng minh chưa kịp áp sát Đông Dương. Đó là cơ hội thuận lợi nhất để ta đồng loạt xuất kích giành thắng lợi trọn vẹn."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VII.2",
            "excerpt": "2. Nguyên nhân khách quan\nChiến tranh thế giới thứ hai kết thúc.\nPhát xít Nhật đầu hàng Đồng minh.\nBộ máy thống trị Nhật và chính quyền tay sai suy yếu nghiêm trọng.\nQuân Đồng minh chưa kịp tiến vào Đông Dương để giải giáp quân Nhật.\nNhững yếu tố này tạo ra thời cơ thuận lợi để nhân dân Việt Nam giành chính quyền.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/372", "body/373", "body/374", "body/375", "body/376", "body/377"],
            "paragraphIndex": 372
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố.",
            "CAUSES: Duyệt nghĩa aliases, phân biệt nguyên nhân chủ quan và khách quan."
        ]
    },
    # 61. VIII-VIETNAM (VIII.1)
    {
        "key": "VIII-VIETNAM",
        "sectionId": "VIII",
        "canonicalQuestion": "Cách mạng tháng Tám năm 1945 có ý nghĩa lịch sử to lớn như thế nào đối với dân tộc Việt Nam?",
        "aliases": [
            "Ý nghĩa của Cách mạng tháng Tám đối với tiến trình lịch sử Việt Nam là gì?",
            "Thắng lợi Cách mạng tháng Tám 1945 đã làm thay đổi số phận dân tộc và nhân dân Việt Nam ra sao?",
            "Nước Việt Nam Dân chủ Cộng hòa ra đời mang lại những chuyển biến căn bản gì cho đất nước?"
        ],
        "approvedAnswer": "Ý nghĩa lịch sử đối với Việt Nam: đập tan ách thống trị của phát xít Nhật và chính quyền tay sai; chấm dứt chế độ thuộc địa và chế độ quân chủ; thành lập nước Việt Nam Dân chủ Cộng hòa; đưa nhân dân Việt Nam từ thân phận nô lệ trở thành người làm chủ đất nước; mở ra kỷ nguyên độc lập, tự do cho dân tộc; tạo cơ sở chính trị và pháp lý để xây dựng nhà nước mới.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu tổng kết tầm vóc thời đại đối với đất nước: Cách mạng tháng Tám đập tan ách thống trị của phát xít Nhật và tay sai, chấm dứt chế độ thuộc địa và quân chủ, lập nên nước Việt Nam Dân chủ Cộng hòa, đưa nhân dân từ nô lệ thành người làm chủ đất nước, mở ra kỷ nguyên độc lập, tự do và tạo cơ sở chính trị pháp lý để xây dựng nhà nước mới.",
            "hoang-quoc-viet": "Bà con hãy tự hào về bước ngoặt đổi đời của dân tộc: cuộc cách mạng đã đập tan xiềng xích nô lệ của phát xít Nhật và tay sai, xóa bỏ chế độ vua chúa và thuộc địa, dựng nên nước Việt Nam Dân chủ Cộng hòa. Đồng bào ta từ thân phận nô lệ lầm than nay hiên ngang đứng dậy làm chủ đất nước, bước vào kỷ nguyên độc lập tự do.",
            "truong-chinh": "Về mặt ý nghĩa lịch sử sâu sắc đối với dân tộc: Cách mạng tháng Tám năm 1945 đã đập tan ách thống trị của phát xít Nhật và chính quyền tay sai; chấm dứt chế độ thuộc địa và chế độ quân chủ phong kiến; thành lập nước Việt Nam Dân chủ Cộng hòa; đưa nhân dân Việt Nam từ thân phận nô lệ trở thành người làm chủ đất nước; mở ra kỷ nguyên độc lập, tự do cho dân tộc; tạo cơ sở chính trị và pháp lý vững chắc để xây dựng nhà nước mới.",
            "vo-nguyen-giap": "Dưới góc độ chiến công vĩ đại của sự nghiệp giải phóng dân tộc: Cách mạng tháng Tám đã quét sạch ách thống trị quân phiệt Nhật và bù nhìn tay sai, chấm dứt vĩnh viễn chế độ thuộc địa và quân chủ, khai sinh nước Việt Nam Dân chủ Cộng hòa, đưa dân tộc ta bước sang kỷ nguyên độc lập, tự do và nhân dân làm chủ vận mệnh non sông."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VIII",
            "excerpt": "1. Đối với Việt Nam\nĐập tan ách thống trị của phát xít Nhật và chính quyền tay sai.\nChấm dứt chế độ thuộc địa và chế độ quân chủ.\nThành lập nước Việt Nam Dân chủ Cộng hòa.\nĐưa nhân dân Việt Nam từ thân phận nô lệ trở thành người làm chủ đất nước.\nMở ra kỷ nguyên độc lập, tự do cho dân tộc.\nTạo cơ sở chính trị và pháp lý để xây dựng nhà nước mới.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/378", "body/379", "body/380", "body/381", "body/382", "body/383", "body/384", "body/385"],
            "paragraphIndex": 378
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 62. VIII-WORLD (VIII.2)
    {
        "key": "VIII-WORLD",
        "sectionId": "VIII.2",
        "canonicalQuestion": "Thắng lợi của Cách mạng tháng Tám năm 1945 có ý nghĩa và đóng góp như thế nào đối với phong trào cách mạng thế giới?",
        "aliases": [
            "Ý nghĩa quốc tế của Cách mạng tháng Tám năm 1945 là gì?",
            "Cách mạng tháng Tám đã cổ vũ phong trào giải phóng dân tộc trên thế giới như thế nào?",
            "Thắng lợi của nhân dân Việt Nam đóng góp gì vào cuộc đấu tranh chống phát xít và thực dân toàn cầu?"
        ],
        "approvedAnswer": "Ý nghĩa đối với thế giới: cổ vũ phong trào giải phóng dân tộc tại các nước thuộc địa; góp phần vào cuộc đấu tranh chống chủ nghĩa phát xít và chủ nghĩa thực dân; khẳng định sức mạnh của một dân tộc đoàn kết, có tổ chức và có đường lối lãnh đạo đúng đắn.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu khẳng định tầm vóc quốc tế to lớn của cuộc cách mạng: cổ vũ mạnh mẽ phong trào giải phóng dân tộc tại các nước thuộc địa, đóng góp xứng đáng vào cuộc đấu tranh chung chống chủ nghĩa phát xít và chủ nghĩa thực dân, đồng thời chứng minh cho thế giới thấy sức mạnh của một dân tộc đoàn kết, có tổ chức và có đường lối lãnh đạo đúng đắn.",
            "hoang-quoc-viet": "Bà con và đồng chí tự hào vì thắng lợi của ta đã truyền lửa cho bầu bạn năm châu: cuộc khởi nghĩa đã cổ vũ mạnh mẽ các dân tộc bị áp bức đứng lên tự giải phóng, góp phần đánh bại chủ nghĩa phát xít và thực dân, khẳng định chân lý sáng ngời rằng một dân tộc đoàn kết một lòng theo đường lối đúng đắn thì nhất định chiến thắng.",
            "truong-chinh": "Về mặt giá trị lý luận và thực tiễn cách mạng quốc tế: Cách mạng tháng Tám năm 1945 có ý nghĩa to lớn đối với thế giới: cổ vũ phong trào giải phóng dân tộc tại các nước thuộc địa; góp phần vào cuộc đấu tranh chống chủ nghĩa phát xít và chủ nghĩa thực dân; khẳng định sức mạnh của một dân tộc đoàn kết, có tổ chức và có đường lối lãnh đạo đúng đắn của Đảng Mác - Lênin.",
            "vo-nguyen-giap": "Dưới góc độ đóng góp vào sự nghiệp giải phóng các dân tộc bị áp bức: thắng lợi Cách mạng tháng Tám đã chọc thủng một khâu yếu trong hệ thống thuộc địa của chủ nghĩa đế quốc, cổ vũ mạnh mẽ phong trào đấu tranh của các dân tộc thuộc địa, đóng góp vào mặt trận chống phát xít và khẳng định sức mạnh vô địch của toàn dân đoàn kết có tổ chức lãnh đạo đúng đắn."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "VIII.2",
            "excerpt": "2. Đối với thế giới\nCổ vũ phong trào giải phóng dân tộc tại các nước thuộc địa.\nGóp phần vào cuộc đấu tranh chống chủ nghĩa phát xít và chủ nghĩa thực dân.\nKhẳng định sức mạnh của một dân tộc đoàn kết, có tổ chức và có đường lối lãnh đạo đúng đắn.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/386", "body/387", "body/388", "body/389"],
            "paragraphIndex": 386
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    }
]


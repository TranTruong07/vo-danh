import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadDocumentsContext } from "@/app/lib/pdf-loader";

// Danh sách các model Gemini tối ưu tốc độ (< 1.5s) và có độ ổn định cao nhất
const CANDIDATE_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

// Thời gian chờ tối đa cho mỗi model (4 giây) để tránh treo chờ quá lâu khi Google bị lag
const MODEL_TIMEOUT_MS = 4000;

export async function POST(req: NextRequest) {
  try {
    const { message, authorId, gender } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Tin nhắn không hợp lệ" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        {
          reply:
            "Hệ thống chưa được cấu hình GEMINI_API_KEY trong file .env.local. Vui lòng thêm API key để kích hoạt AI trả lời.",
        },
        { status: 200 }
      );
    }

    // 1. Tải toàn bộ nội dung từ các file PDF trong data/documents (Đã cache in-memory)
    const pdfContext = await loadDocumentsContext();

    if (!pdfContext.trim()) {
      return NextResponse.json(
        {
          reply:
            "Hiện tại chưa tìm thấy nội dung văn bản nào trong thư mục data/documents. Vui lòng kiểm tra lại file PDF.",
        },
        { status: 200 }
      );
    }

    // 2. Thiết lập System Instruction thắt chặt (Strict Grounding)
    const systemInstruction = `
Bạn là trợ lý ảo hỗ trợ thông tin đại diện cho tác giả/mã định danh: "${authorId || "Chưa xác định"}".
Giới tính/Phong thái phản hồi mong muốn: ${gender === "female" ? "Nữ (thân thiện, nhẹ nhàng)" : "Nam (lịch sự, rõ ràng)"}.

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. Bạn CHỈ ĐƯỢC PHÉP trả lời các câu hỏi dựa trên thông tin có sẵn trong [DỮ LIỆU TÀI LIỆU PDF] được cung cấp dưới đây.
2. TUYỆT ĐỐI KHÔNG tự suy diễn, không bịa đặt, và không dùng bất kỳ kiến thức bên ngoài nào nằm ngoài tài liệu.
3. Nếu câu hỏi của người dùng KHÔNG CÓ THÔNG TIN trong tài liệu, bạn PHẢI trả lời lịch sự: "Xin lỗi, thông tin này không có trong tài liệu được cung cấp nên tôi không thể trả lời."
4. Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, súc tích (1 đến 3 câu), phù hợp để đọc to bằng giọng nói (Text-To-Speech). Tránh sử dụng quá nhiều ký tự đặc biệt, bảng biểu phức tạp hoặc markdown rườm rà.

[DỮ LIỆU TÀI LIỆU PDF]:
${pdfContext}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    let reply = "";
    let lastError: unknown = null;

    // 3. Cơ chế thử model với timeout tự động chuyển đổi siêu tốc
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[Chatbot AI] Đang gọi model: ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 250,
          },
        });

        // Thiết lập timeout cho từng model để không bị kẹt khi Google quá tải
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`Quá thời gian phản hồi (${MODEL_TIMEOUT_MS}ms)`)),
            MODEL_TIMEOUT_MS
          );
        });

        const generatePromise = model.generateContent(message).then((res) => res.response.text());

        try {
          reply = await Promise.race([generatePromise, timeoutPromise]);
        } finally {
          clearTimeout(timeoutHandle!);
        }

        if (reply) {
          console.log(`[Chatbot AI] Phản hồi thành công từ model: ${modelName}`);
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        const errStr = String(err);
        console.warn(`[Chatbot AI] Model ${modelName} gặp lỗi/timeout (${errStr.slice(0, 100)}), chuyển model tiếp theo...`);
        // Chờ ngắn 150ms trước khi thử model tiếp theo
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    if (!reply) {
      console.error("[Chatbot AI] Tat ca candidate models deu that bai:", lastError);
      return NextResponse.json(
        {
          reply:
            "Máy chủ AI của Google đang bị quá tải tạm thời trong giây lát. Vui lòng nhấn gửi lại câu hỏi sau vài giây.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Lỗi khi xử lý chatbot AI:", error);
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định";
    return NextResponse.json(
      {
        error: "Lỗi xử lý phản hồi từ AI",
        detail: errorMessage,
      },
      { status: 500 }
    );
  }
}

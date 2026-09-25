import { NextRequest, NextResponse } from "next/server";
import * as googleTTS from "google-tts-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Thiếu nội dung text" }, { status: 400 });
  }

  try {
    // Làm sạch ký tự đặc biệt, chuẩn hóa khoảng trắng
    const cleanText = text
      .replace(/[*#_`~[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: "Text rỗng" }, { status: 400 });
    }

    // Tự động chia đoạn văn dài thành các chunks và lấy toàn bộ audio base64
    const audioChunks = await googleTTS.getAllAudioBase64(cleanText, {
      lang: "vi",
      slow: false,
      timeout: 10000,
    });

    // Ghép toàn bộ các đoạn âm thanh MP3 lại thành 1 file MP3 duy nhất
    const audioBuffers = audioChunks.map((chunk) => Buffer.from(chunk.base64, "base64"));
    const combinedBuffer = Buffer.concat(audioBuffers);

    return new NextResponse(combinedBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": combinedBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo audio TTS tiếng Việt:", error);
    return NextResponse.json({ error: "Không thể tạo giọng đọc" }, { status: 500 });
  }
}

"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

function ChatInterface() {
  const searchParams = useSearchParams();
  const authorId = searchParams.get("authorId") || "Tác giả";
  const gender = searchParams.get("gender") || "male"; // male | female

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Hàm phát giọng nói Tiếng Việt chuẩn xác 100%
  const speakText = async (text: string) => {
    if (!audioEnabled || typeof window === "undefined") {
      return;
    }

    // 1. Dừng mọi âm thanh đang phát
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Làm sạch text để đọc tự nhiên
    const cleanText = text.replace(/[*#_`~[\]]/g, "").replace(/\s+/g, " ").trim();
    if (!cleanText) return;

    try {
      // Ưu tiên 1: Sử dụng /api/tts (Google Vietnamese TTS Server-side) - Đảm bảo phát âm Tiếng Việt 100% trọn vẹn
      const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      // Điều chỉnh cao độ giả lập Nam/Nữ qua playbackRate & Web Audio nếu cần
      if (gender === "male") {
        audio.playbackRate = 0.92; // Giọng nam trầm, chắc
      } else {
        audio.playbackRate = 1.05; // Giọng nữ nhanh, thanh thoát
      }

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        // Fallback sang Web Speech API nếu thiết bị offline
        fallbackWebSpeech(cleanText);
      };

      await audio.play();
    } catch {
      fallbackWebSpeech(cleanText);
    }
  };

  const fallbackWebSpeech = (cleanText: string) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";

    if (gender === "female") {
      utterance.pitch = 1.25;
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 0.75;
      utterance.rate = 0.92;
    }

    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên các giọng có chứa 'vi' hoặc 'Vietnamese'
    const viVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith("vi") ||
        v.name.toLowerCase().includes("vietnamese") ||
        v.name.toLowerCase().includes("vi-vn")
    );
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Tin nhắn chào mừng ban đầu
  useEffect(() => {
    const welcomeText =
      gender === "female"
        ? `Xin chào! Em là trợ lý ảo đại diện cho ${authorId}. Em chỉ trả lời các thông tin có trong tài liệu được cung cấp. Anh/chị cần hỏi thông tin gì ạ?`
        : `Xin chào! Tôi là trợ lý ảo đại diện cho ${authorId}. Tôi chỉ trả lời các thông tin có trong tài liệu được cung cấp. Bạn cần tra cứu thông tin gì?`;

    const initialMsg: Message = {
      id: "welcome-1",
      sender: "bot",
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([initialMsg]);

    // Thử phát âm thanh (nếu trình duyệt cho phép tự động phát sau khi user tương tác)
    if (audioReady) {
      speakText(welcomeText);
    }
  }, [authorId, gender, audioReady]);

  // Xử lý gửi câu hỏi
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || loading) return;

    // Kích hoạt audio context sau lượt nhấn đầu tiên của người dùng (vượt rào cản autoplay policy của trình duyệt di động)
    if (!audioReady) {
      setAudioReady(true);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          authorId,
          gender,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || data.error || "Xin lỗi, hiện tại không nhận được phản hồi.";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Phát âm thanh câu trả lời ngay lập tức
      speakText(botReply);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-100 shadow-2xl overflow-hidden border-x border-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                gender === "female"
                  ? "bg-gradient-to-tr from-pink-500 to-rose-400"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-500"
              }`}
            >
              {gender === "female" ? "♀" : "♂"}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-800 text-sm">{authorId}</h1>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                {gender === "female" ? "Giọng Nữ" : "Giọng Nam"}
              </span>
            </div>
            <p className="text-xs text-slate-400">Trợ lý tài liệu thông minh</p>
          </div>
        </div>

        {/* Nút bật tắt âm thanh & Dừng phát */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={handleStopSpeaking}
              className="px-2 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg border border-rose-200 animate-pulse"
              title="Dừng phát giọng nói"
            >
              Dừng nói ⏹
            </button>
          )}

          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (isSpeaking) handleStopSpeaking();
            }}
            className={`p-2 rounded-xl border text-sm transition ${
              audioEnabled
                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                : "bg-slate-100 border-slate-200 text-slate-400"
            }`}
            title={audioEnabled ? "Đang bật âm thanh" : "Đã tắt âm thanh"}
          >
            {audioEnabled ? "🔊" : "🔇"}
          </button>

          <Link
            href="/"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
            title="Về trang tạo QR"
          >
            ✕
          </Link>
        </div>
      </header>

      {/* Thông báo quy tắc PDF */}
      <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
        <span className="shrink-0 font-bold">ℹ️</span>
        <span className="truncate">Chỉ giải đáp các thông tin có trong tài liệu PDF lưu trữ.</span>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>

            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              {msg.sender === "bot" && audioEnabled && (
                <button
                  onClick={() => speakText(msg.text)}
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium"
                >
                  Phát lại 🔊
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 max-w-[70%]">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-xs text-slate-400 ml-1">Đang tra cứu tài liệu...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input gửi câu hỏi */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập câu hỏi của bạn tại đây..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition shadow-sm shrink-0 flex items-center justify-center gap-1"
        >
          <span>Gửi</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
          Đang khởi tạo chatbot...
        </div>
      }
    >
      <ChatInterface />
    </Suspense>
  );
}


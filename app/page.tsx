"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default function Home() {
  const [authorId, setAuthorId] = useState("auth-001");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [destination, setDestination] = useState<"chat" | "author">("chat");
  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_APP_URL || ""
  );
  const [size, setSize] = useState(240);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Nếu chưa cấu hình NEXT_PUBLIC_APP_URL thì tự động lấy origin hiện tại của trình duyệt
    if (typeof window !== "undefined" && !baseUrl) {
      setBaseUrl(window.location.origin);
    }
  }, [baseUrl]);

  // Chuẩn hóa Base URL (bỏ dấu gạch chéo cuối nếu có)
  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const path = destination === "chat" ? "/chat" : "/author";
  const params = new URLSearchParams();
  if (authorId.trim()) params.set("authorId", authorId.trim());
  if (destination === "chat") params.set("gender", gender);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const targetUrl = cleanBaseUrl ? `${cleanBaseUrl}${path}${queryString}` : `${path}${queryString}`;

  // Tải mã QR dưới dạng ảnh PNG
  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Tăng chất lượng ảnh khi export
    const scaleFactor = 3;
    canvas.width = size * scaleFactor;
    canvas.height = size * scaleFactor;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-Author-${authorId || "code"}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // In mã QR ra giấy
  const handlePrint = () => {
    window.print();
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      {/* CSS dành riêng cho chế độ In ấn (Print Preview) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2rem;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              QR Code Generator
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tạo và in mã QR kèm tham số định danh (<code className="text-indigo-600 font-semibold">authorId</code>) cho người dùng quét từ bên ngoài.
            </p>
          </div>
          <div className="flex items-center gap-2 self-center md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sẵn sàng kết nối
            </span>
          </div>
        </header>

        {/* Nội dung chính: 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Cột 1: Cấu hình Input */}
          <div className="md:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Cấu hình Tham Số Đầu Vào</h2>
              <p className="text-xs text-slate-500">
                Nhập mã định danh tác giả/người dùng để tích hợp vào đường dẫn quét.
              </p>
            </div>

            {/* Chọn Trang Đích */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mục đích quét mã QR <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDestination("chat")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    destination === "chat"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>💬 Chatbot AI & Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDestination("author")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    destination === "author"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>👤 Xem Hồ Sơ Cá Nhân</span>
                </button>
              </div>
            </div>

            {/* Cấu hình Giọng nói & Giới tính khi chọn Chatbot */}
            {destination === "chat" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Giọng nói đại diện khi trả lời (Text-To-Speech)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      gender === "male"
                        ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold ring-1 ring-blue-500"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>♂ Giọng Nam (Trầm ấm)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      gender === "female"
                        ? "bg-pink-50 border-pink-500 text-pink-700 font-semibold ring-1 ring-pink-500"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>♀ Giọng Nữ (Thanh thoát)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input Base URL / Domain */}
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Domain / Base URL <span className="text-rose-500">*</span>
              </label>
              <input
                id="baseUrl"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://yourdomain.com hoặc http://192.168.1.X:3000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <p className="text-xs text-slate-400 mt-1">
                Camera điện thoại cần có <code className="font-mono text-indigo-600">https://</code> hoặc <code className="font-mono text-indigo-600">http://</code> để nhận diện mở link.
              </p>
            </div>

            {/* Input authorId */}
            <div>
              <label htmlFor="authorId" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mã Author ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="authorId"
                  type="text"
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  placeholder="Ví dụ: auth-001, user-99, dev-vietnam..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-slate-400">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={() => setAuthorId("auth-001")}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  auth-001
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setAuthorId("auth-002")}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  auth-002
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setAuthorId("VIP-GUEST-2026")}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  VIP-GUEST-2026
                </button>
              </div>
            </div>

            {/* Tùy chỉnh kích cỡ QR */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Kích thước hiển thị</label>
                <span className="text-xs font-mono text-slate-500">{size} x {size} px</span>
              </div>
              <input
                type="range"
                min="160"
                max="320"
                step="20"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Target URL Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Đường Dẫn Đích Khi Quét (Target URL)
              </span>
              <div className="mt-1 flex items-center justify-between gap-2 overflow-hidden">
                <p className="font-mono text-xs text-slate-700 truncate" title={targetUrl}>
                  {targetUrl}
                </p>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                >
                  {copied ? "Đã chép!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Link mở trực tiếp */}
            <div className="pt-2">
              <Link
                href={path + queryString}
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
              >
                <span>Xem thử trang đích trực tiếp ({destination === "chat" ? "Chatbot" : "Hồ sơ"})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Cột 2: Preview QR Code & Các thao tác In/Tải */}
          <div className="md:col-span-6 flex flex-col items-center">
            {/* Thẻ in ấn & Preview */}
            <div
              id="print-area"
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center w-full max-w-sm transition-all"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">MÃ QUÉT XÁC THỰC</h3>
                <p className="text-xs text-slate-400 mt-0.5">Quét mã bằng camera điện thoại để xem chi tiết</p>
              </div>

              {/* QR Container */}
              <div
                ref={qrRef}
                className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner flex items-center justify-center"
              >
                {authorId.trim() ? (
                  <QRCodeSVG
                    value={targetUrl}
                    size={size}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div
                    style={{ width: size, height: size }}
                    className="flex flex-col items-center justify-center text-slate-400 p-4 text-center text-xs"
                  >
                    Vui lòng nhập authorId để tạo mã
                  </div>
                )}
              </div>

              {/* Tag nhận diện dưới mã QR */}
              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs text-slate-500">
                <span>Tham số ID:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {authorId || "N/A"}
                </span>
              </div>
            </div>

            {/* Các nút hành động: Tải ảnh PNG & In ấn */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!authorId.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải ảnh PNG
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!authorId.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                In mã QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

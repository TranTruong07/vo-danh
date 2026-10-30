import type { Metadata, Viewport } from "next";
import PwaProvider from "@/features/pwa/pwa-provider";
import "@/features/pwa/pwa.css";
import { Anton, Geist, Geist_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import "./heritage.css";
import "./auth.css";

const brandFont = Anton({
  variable: "--font-brand",
  weight: "400",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});
const bodyFont = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"], display: "swap" });
const monoFont = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"], display: "swap" });
const readingFont = Noto_Serif({ variable: "--font-reading-serif", subsets: ["latin", "vietnamese"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "Dấu Chân Sử Ký", statusBarStyle: "default" },
  icons: { apple: "/pwa/icon-192.png" },
  title: "Dấu Chân Sử Ký | Đi từng bước, hiểu từng trang sử",
  description: "Khám phá Dấu Chân Sử Ký — board game lịch sử kết hợp câu hỏi nhân vật và mã QR, giúp học sinh THCS học mà chơi, chơi mà học.",
};

export const viewport: Viewport = { themeColor: "#981f25" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${brandFont.variable} ${bodyFont.variable} ${monoFont.variable} ${readingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><PwaProvider>{children}</PwaProvider></body>
    </html>
  );
}

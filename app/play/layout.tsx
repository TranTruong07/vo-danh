import type { Metadata } from "next";
import Link from "next/link";
import SiteLogo from "@/components/site-logo";
import "./play.css";
import "@/features/game/character-stage.css";

export const metadata: Metadata = { title: "Chơi cùng lịch sử | Dấu Chân Sử Ký", robots: { index: false, follow: false }, referrer: "same-origin" };
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div className="history-game"><header className="game-header"><Link href="/" className="game-brand"><SiteLogo />Dấu Chân Sử Ký</Link><Link href="/play">Quét QR</Link><Link href="/">Trang chủ</Link></header><main className="game-container">{children}</main><footer className="game-footer">Mỗi thẻ bài, một câu chuyện. Học mà chơi — chơi mà học.</footer></div>;
}

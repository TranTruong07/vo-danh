"use client";
import Link from "next/link";
export default function PlayError({ reset }: { reset: () => void }) {
  return <section className="scanner-panel"><h1>Chưa kết nối được bàn chơi</h1><p>Vui lòng kiểm tra mạng và thử lại sau ít giây.</p><div className="game-actions"><button className="game-button primary" onClick={reset}>Thử lại</button><Link className="game-button" href="/play">Quét mã khác</Link></div></section>;
}

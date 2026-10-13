"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { CharacterRecord } from "@/server/domain/character";
import CharacterAppearance from "./character-appearance";

const configuredBase = (process.env.NEXT_PUBLIC_APP_URL || "").trim();

export default function CharacterQr({ character }: { character: CharacterRecord }) {
  const [message, setMessage] = useState("");
  const area = useRef<HTMLDivElement>(null);
  let url = "";
  let localHost = false;
  try {
    const parsed = new URL(configuredBase);
    if (["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password) url = `${parsed.origin}/play/${character.id}`;
    localHost = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  } catch { /* Missing/invalid configuration keeps export disabled. */ }
  function download() {
    const canvas = area.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a"); link.download = `nhan-vat-${character.id}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  }
  return <section className="card character-qr">
    <div><h2>Mã QR nhân vật</h2><label>Địa chỉ website<input value={configuredBase} readOnly placeholder="https://website-cua-ban.vn" /></label>
      {localHost && <p className="hint">NEXT_PUBLIC_APP_URL đang dùng localhost. Hãy đổi sang tên miền HTTPS mà điện thoại truy cập được trước khi in thẻ chơi.</p>}
      <p className="character-url">{url || "Chưa cấu hình NEXT_PUBLIC_APP_URL là địa chỉ HTTP hoặc HTTPS hợp lệ."}</p>
      <div className="btn-row"><button className="btn primary" disabled={!url} onClick={download}>Tải PNG</button><button className="btn" disabled={!url} onClick={() => window.print()}>In QR</button><button className="btn" disabled={!url} onClick={async () => { try { await navigator.clipboard.writeText(url); setMessage("Đã sao chép liên kết."); } catch { setMessage("Không thể sao chép tự động. Hãy sao chép liên kết phía trên."); } }}>Sao chép</button></div>
      <div className="btn-row">{url && <a className="back-link" href={url} target="_blank" rel="noopener noreferrer">Mở trang chơi ↗</a>}</div><p role="status">{message}</p>
    </div>
    <div className="character-print" ref={area}><CharacterAppearance character={character} /><h3>{character.name}</h3>{character.openingLine && <p className="character-qr-opening">{character.openingLine}</p>}{url && <QRCodeCanvas key={url} value={url} size={640} style={{ width: "100%", height: "auto" }} level="M" marginSize={4} />}<p>Quét mã · Khám phá lịch sử</p><small>{character.id}</small></div>
  </section>;
}

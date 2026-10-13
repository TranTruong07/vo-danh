"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import GamePlayer from "@/features/game/game-player";
import OfflineLibrary from "./offline-library";
import { OfflineShellSignal, usePwa } from "./pwa-provider";

export default function OfflinePlayer() {
  const { pack } = usePwa();
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { void Promise.resolve().then(() => setId(window.location.pathname.match(/^\/play\/([a-f0-9]{24})/)?.[1] || "")); }, []);
  if (id === null || !pack) return <><OfflineShellSignal /><p role="status">Đang mở dữ liệu đã lưu trên máy…</p></>;
  const character = pack.characters.find(item => item.id === id);
  if (id && !character) return <><div className="game-message error" role="alert">Nhân vật này chưa có trong bộ dữ liệu đã tải. Hãy kết nối mạng để cập nhật hoặc chọn nhân vật bên dưới.</div><Link className="game-button" href="/play">Quét thẻ khác</Link><OfflineLibrary /></>;
  return <><OfflineShellSignal /><GamePlayer key={id} character={character} /></>;
}

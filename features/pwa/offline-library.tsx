"use client";
import { useState } from "react";
import { usePwa } from "./pwa-provider";

export default function OfflineLibrary() {
  const { online, pack } = usePwa();
  const [search, setSearch] = useState("");
  if (online || !pack) return null;
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  const characters = pack.characters.filter(character => normalized(character.name).includes(normalized(search)));
  return <section className="offline-library" aria-label="Nhân vật đã lưu offline"><p className="eyebrow">TIẾP TỤC HÀNH TRÌNH</p><h2>Nhân vật đã lưu trên máy</h2><p>Quét thẻ QR hoặc chọn một nhân vật để chơi. Câu hỏi và đáp án đã sẵn sàng, không cần mạng.</p><label>Tìm nhân vật<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nhập tên nhân vật…" /></label><div className="offline-character-grid">{characters.map(character => <a href={`/play/${character.id}`} key={character.id}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={character.image} alt={character.name} /><div><h3>{character.name}</h3><p>{character.openingLine}</p><small>{pack.questions.filter(question => question.characterId === character.id).length} câu hỏi · Mở thẻ →</small></div>
  </a>)}</div>{!characters.length && <p>Không tìm thấy nhân vật trong bộ dữ liệu đã tải.</p>}</section>;
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PublicCharacter } from "@/server/domain/character";
import "./character-chat.css";

// Presentation only. Connect the new model once its API contract is available.
export default function CharacterChat({ character }: { character: Pick<PublicCharacter, "name" | "image" | "openingLine"> }) {
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);
  function close() { setOpen(false); launcher.current?.focus(); }

  return <div className="character-chat-widget">
    {open && <section id={id} className="character-chat-panel" role="dialog" aria-label={`Trò chuyện với ${character.name}`} onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); close(); }
    }}>
      <header>
        <span className="chat-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={character.image} alt="" referrerPolicy="no-referrer" />
        </span>
        <div><h2>{character.name}</h2><small>Người bạn đồng hành lịch sử</small></div>
        <button ref={closeButton} type="button" aria-label="Đóng trò chuyện" onClick={close}>×</button>
      </header>
      <div className="character-chat-log" role="log" aria-label="Nội dung trò chuyện" aria-live="polite">
        <p className="chat-message assistant">{character.openingLine || `Xin chào! Cùng khám phá lịch sử với ${character.name} nhé.`}</p>
      </div>
      <p id={`${id}-status`} className="character-chat-notice" role="status">Trò chuyện đang được chuẩn bị. Bạn vẫn có thể trả lời câu hỏi và quét thẻ tiếp theo.</p>
      <div className="character-chat-composer">
        <label className="sr-only" htmlFor={`${id}-input`}>Tin nhắn cho {character.name}</label>
        <input id={`${id}-input`} placeholder="Hỏi nhân vật điều bạn tò mò…" disabled aria-describedby={`${id}-status`} />
        <button type="button" disabled aria-label="Gửi tin nhắn" aria-describedby={`${id}-status`}>↑</button>
      </div>
    </section>}
    <button ref={launcher} type="button" className="character-chat-launcher" aria-expanded={open} aria-controls={open ? id : undefined} aria-label={`${open ? "Đóng" : "Mở"} trò chuyện với ${character.name}`} onClick={() => open ? close() : setOpen(true)}>
      <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" /><path d="M7 11h.01M12 11h.01M17 11h.01" strokeWidth="3" strokeLinecap="round" /></svg>
      <span>{open ? "Đóng trò chuyện" : "Trò chuyện cùng nhân vật"}</span><small>AI</small>
    </button>
  </div>;
}

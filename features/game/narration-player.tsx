"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./narration-player.css";

export default function NarrationPlayer({ urls = [], feedback, active, leadIn }: { urls?: string[]; feedback: boolean; active: boolean; leadIn?: string }) {
  const element = useRef<HTMLAudioElement>(null);
  const index = useRef(0), generation = useRef(0);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "blocked" | "error">("idle");
  const playlistKey = [...(leadIn ? [leadIn] : []), ...urls].join("|");
  const playlistLength = urls.length + (leadIn ? 1 : 0);
  const start = useCallback(async function play(restart: boolean): Promise<void> {
    const audio = element.current;
    const playlist = playlistKey ? playlistKey.split("|") : [];
    if (!audio || !playlist.length || !active || muted) return;
    const turn = ++generation.current;
    if (restart) index.current = 0;
    audio.pause(); // One media element: stop the preceding clip before loading the next.
    audio.src = playlist[index.current];
    try { await audio.play(); if (turn === generation.current) setState("playing"); }
    catch (error) {
      if (turn !== generation.current) return;
      if (error instanceof DOMException && error.name === "NotAllowedError") setState("blocked");
      else if (leadIn && index.current === 0 && playlist.length > 1) { index.current++; await play(false); }
      else setState("error");
    }
  }, [playlistKey, active, muted, leadIn]);
  useEffect(() => {
    let disposed = false;
    const audio = element.current;
    void Promise.resolve().then(() => { if (!disposed) { setState("idle"); void start(true); } });
    return () => {
      disposed = true;
      // This ref is a cancellation counter, not a DOM node; invalidate any pending play().
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      audio?.pause(); audio?.removeAttribute("src");
    };
  }, [start, feedback]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { generation.current++; element.current?.pause(); setState("idle"); } };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  return <div className="narration-player" aria-label="Giọng đọc nhân vật">
    <audio ref={element} preload="auto" onEnded={() => {
      if (index.current + 1 < playlistLength) { index.current++; void start(false); }
      else setState("idle");
    }} onError={() => {
      if (!element.current?.getAttribute("src")) return;
      // A missing effect must not suppress the stored spoken feedback.
      if (leadIn && index.current === 0 && urls.length) { index.current++; void start(false); }
      else setState("error");
    }} />
    <button type="button" disabled={!playlistLength || !active || muted} onClick={() => {
      if (state === "playing") { generation.current++; element.current?.pause(); setState("idle"); }
      else void start(true);
    }}>{state === "playing" ? "Dừng đọc" : feedback ? "Nghe phản hồi" : "Nghe câu hỏi"}</button>
    <button type="button" aria-pressed={muted} onClick={() => setMuted(value => !value)}>{muted ? "Bật âm thanh" : "Tắt âm thanh"}</button>
    <span role="status">{!playlistLength ? "Chưa có âm thanh cho nội dung này." : state === "blocked" ? "Bấm nghe để bật giọng đọc." : state === "error" ? "Chưa tải được âm thanh. Bạn vẫn có thể trả lời câu hỏi." : state === "playing" ? "Đang phát âm thanh…" : ""}</span>
  </div>;
}

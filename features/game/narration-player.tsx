"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./narration-player.css";

export default function NarrationPlayer({ urls = [], feedback, active }: { urls?: string[]; feedback: boolean; active: boolean }) {
  const element = useRef<HTMLAudioElement>(null);
  const index = useRef(0), generation = useRef(0);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "blocked" | "error">("idle");
  const playlistKey = urls.join("|");
  const start = useCallback(async (restart: boolean) => {
    const audio = element.current;
    const playlist = playlistKey ? playlistKey.split("|") : [];
    if (!audio || !playlist.length || !active || muted) return;
    const turn = ++generation.current;
    if (restart) index.current = 0;
    audio.src = playlist[index.current];
    try { await audio.play(); if (turn === generation.current) setState("playing"); }
    catch (error) { if (turn === generation.current) setState(error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "error"); }
  }, [playlistKey, active, muted]);
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
      if (index.current + 1 < urls.length) { index.current++; void start(false); }
      else setState("idle");
    }} onError={() => { if (element.current?.getAttribute("src")) setState("error"); }} />
    <button type="button" disabled={!urls.length || !active || muted} onClick={() => {
      if (state === "playing") { generation.current++; element.current?.pause(); setState("idle"); }
      else void start(true);
    }}>{state === "playing" ? "Dừng đọc" : feedback ? "Nghe phản hồi" : "Nghe câu hỏi"}</button>
    <button type="button" aria-pressed={muted} onClick={() => setMuted(value => !value)}>{muted ? "Bật âm thanh" : "Tắt âm thanh"}</button>
    <span role="status">{!urls.length ? "Chưa có âm thanh cho nội dung này." : state === "blocked" ? "Bấm nghe để bật giọng đọc." : state === "error" ? "Chưa tải được âm thanh. Bạn vẫn có thể trả lời câu hỏi." : state === "playing" ? "Nhân vật đang đọc…" : ""}</span>
  </div>;
}

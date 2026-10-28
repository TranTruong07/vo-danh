"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [1, 2, 3, 4];

export default function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || hovered || focused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !motion.matches) setActive(index => (index + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused]);

  return <section className="hero-art hero-slideshow" aria-label="Hình ảnh board game Dấu Chân Sử Ký" aria-roledescription="trình chiếu"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    {slides.map((number, index) => <div key={number} className={`hero-slide${index === active ? " is-active" : ""}`} aria-hidden={index !== active}>
      <div className="hero-slide-backdrop" aria-hidden="true" style={{ backgroundImage: `url(/images/anh_slide${number}.png)` }} />
      <Image src={`/images/anh_slide${number}.png`} alt={`Board game Dấu Chân Sử Ký — hình ${number}`} fill unoptimized loading="eager" sizes="(max-width: 760px) 100vw, 50vw" />
    </div>)}
    <button type="button" className="hero-slide-arrow previous" aria-label="Ảnh trước" onClick={() => setActive(index => (index + slides.length - 1) % slides.length)}>‹</button>
    <button type="button" className="hero-slide-arrow next" aria-label="Ảnh tiếp theo" onClick={() => setActive(index => (index + 1) % slides.length)}>›</button>
    <div className="hero-slide-controls">
      <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu"}>{paused ? "▶" : "Ⅱ"}</button>
      <div className="hero-slide-dots" aria-label="Chọn ảnh">{slides.map((number, index) => <button key={number} type="button" aria-label={`Xem ảnh ${number}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)}><span /></button>)}</div>
      <span className="hero-slide-count" aria-live="off">0{active + 1} / 04</span>
    </div>
  </section>;
}

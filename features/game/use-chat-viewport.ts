"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

const query = "(max-width: 640px)";
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};

// Keep the mobile dialog inside the visual viewport without changing the game.
// Restore all body styles and the board's scroll position on close/unmount.
export function useChatViewport(open: boolean, widget: RefObject<HTMLDivElement | null>) {
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
  useEffect(() => {
    if (!open || !mobile || !widget.current) return;
    const element = widget.current, body = document.body, root = document.documentElement;
    const { scrollX, scrollY } = window;
    const original = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow, rootOverflow: root.style.overflow };
    Object.assign(body.style, { position: "fixed", top: `${-scrollY}px`, left: `${-scrollX}px`, width: "100%", overflow: "hidden" });
    root.style.overflow = "hidden";
    const viewport = window.visualViewport;
    const update = () => {
      element.style.setProperty("--chat-height", `${viewport?.height ?? window.innerHeight}px`);
      element.style.setProperty("--chat-top", `${viewport?.offsetTop ?? 0}px`);
      element.style.setProperty("--chat-left", `${viewport?.offsetLeft ?? 0}px`);
      element.style.setProperty("--chat-width", `${viewport?.width ?? window.innerWidth}px`);
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      Object.assign(body.style, { position: original.position, top: original.top, left: original.left, width: original.width, overflow: original.overflow });
      root.style.overflow = original.rootOverflow;
      for (const name of ["height", "top", "left", "width"]) element.style.removeProperty(`--chat-${name}`);
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    };
  }, [open, mobile, widget]);
  return mobile;
}

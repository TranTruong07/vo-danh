"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readPack, type SavedPack } from "./local-game";

const PwaContext = createContext<{ online: boolean; pack: SavedPack | null; markOffline: () => void }>({ online: true, pack: null, markOffline: () => {} });
export const usePwa = () => useContext(PwaContext);

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [online, setOnline] = useState(true), [pack, setPack] = useState<SavedPack | null>(null);
  const [notice, setNotice] = useState("");
  const markOffline = useCallback(() => setOnline(false), []);
  const supportedPage = pathname === "/" || pathname.startsWith("/play") || pathname.startsWith("/offline");
  const sync = useCallback(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!navigator.onLine || !navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({ type: "PWA_SYNC" });
  }, []);
  useEffect(() => {
    const update = () => { setOnline(navigator.onLine); if (navigator.onLine) sync(); };
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, [sync]);
  useEffect(() => {
    if (!supportedPage) return;
    if (!window.isSecureContext || !("serviceWorker" in navigator)) return;
    // Development chunks change on every edit; offline readiness is tested in production.
    if (process.env.NODE_ENV !== "production") return;
    let disposed = false;
    const restore = async () => { const saved = await readPack().catch(() => null); if (!disposed) setPack(saved); };
    const message = (event: MessageEvent) => {
      if (event.data?.type === "PWA_READY") { setOnline(navigator.onLine); void restore(); }
      if (event.data?.type === "PWA_ERROR") void restore();
    };
    navigator.serviceWorker.addEventListener("message", message);
    const controlled = () => { void restore(); sync(); };
    navigator.serviceWorker.addEventListener("controllerchange", controlled);
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(async () => {
      await navigator.serviceWorker.ready;
      if (!disposed && navigator.serviceWorker.controller) controlled();
    }).catch(error => { console.warn("Không đăng ký được chế độ offline.", error); });
    return () => { disposed = true; navigator.serviceWorker.removeEventListener("message", message); navigator.serviceWorker.removeEventListener("controllerchange", controlled); };
  }, [supportedPage, sync]);
  useEffect(() => {
    // Offline navigation must load the cached document shell, not a Next RSC request.
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      const gameLink = (url.pathname === "/" && !url.search) || /^\/play(?:\/[a-f0-9]{24})?\/?$/.test(url.pathname);
      if (online && navigator.onLine && !(pack && gameLink)) return;
      event.preventDefault(); event.stopPropagation();
      if (gameLink) location.assign(url.href);
      else setNotice("Tính năng này cần mạng. Bạn vẫn có thể về Home, quét QR và chơi câu hỏi.");
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [online, pack]);
  return <PwaContext.Provider value={{ online, pack, markOffline }}>
    {supportedPage && !online && <aside className="pwa-status is-offline" aria-label="Trạng thái chơi offline">
      <div role="status">Chuẩn bị chơi offline</div>
    </aside>}
    {notice && <div className="pwa-notice" role="alert">{notice} <button onClick={() => setNotice("")} aria-label="Đóng thông báo">×</button></div>}
    {children}
  </PwaContext.Provider>;
}

// The cached shell also covers an unreachable server while Wi-Fi remains on,
// a case where navigator.onLine can still be true.
export function OfflineShellSignal() {
  const { markOffline } = usePwa();
  useEffect(() => { void Promise.resolve().then(markOffline); }, [markOffline]);
  return null;
}

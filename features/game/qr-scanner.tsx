"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { characterIdFromQr } from "@/server/domain/character";

export default function QrScanner({ onScan }: { onScan: (id: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const stop = useCallback(() => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) { stop(); setActive(false); setBusy(false); } };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); stop(); };
  }, [stop]);

  function accept(raw: string) {
    const id = characterIdFromQr(raw);
    if (!id) { setError("Mã này không phải thẻ nhân vật. Hãy quét QR được tạo ở mục Nhân vật & QR."); return false; }
    stop(); setActive(false); setBusy(false); setError(""); onScan(id); return true;
  }
  async function start() {
    stop(); setError(""); setBusy(true);
    const current = generation.current;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("secure");
      const { default: jsQR } = await import("jsqr");
      if (current !== generation.current) return;
      const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (current !== generation.current || !video.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media; video.current.srcObject = media;
      await video.current.play();
      if (current !== generation.current) return;
      setActive(true); setBusy(false);
      const canvas = document.createElement("canvas"); const context = canvas.getContext("2d", { willReadFrequently: true });
      let lastInvalid = "";
      const tick = () => {
        if (current !== generation.current) return;
        const preview = video.current;
        if (preview && preview.readyState >= 2 && context && preview.videoWidth) {
          const scale = Math.min(1, 800 / preview.videoWidth);
          canvas.width = Math.round(preview.videoWidth * scale); canvas.height = Math.round(preview.videoHeight * scale);
          context.drawImage(preview, 0, 0, canvas.width, canvas.height);
          const frame = context.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
          if (result && result.data !== lastInvalid) { if (accept(result.data)) return; lastInvalid = result.data; }
        }
        timer.current = setTimeout(tick, 250);
      };
      tick();
    } catch (cause) {
      if (current !== generation.current) return;
      stop(); setBusy(false); setActive(false);
      const name = cause instanceof Error ? cause.name : "";
      setError(cause instanceof Error && cause.message === "secure" ? "Camera cần HTTPS (hoặc localhost). Bạn vẫn có thể chọn ảnh QR hay dán liên kết bên dưới." : name === "NotAllowedError" ? "Bạn chưa cho phép dùng camera. Hãy cấp quyền trong trình duyệt, hoặc chọn ảnh QR." : name === "NotFoundError" ? "Không tìm thấy camera. Bạn có thể chọn ảnh QR bên dưới." : "Không mở được camera. Đóng ứng dụng đang dùng camera rồi thử lại, hoặc chọn ảnh QR.");
    }
  }
  async function readImage(file?: File) {
    if (!file) return;
    stop(); setActive(false); setBusy(true); setError("");
    const current = generation.current;
    let objectUrl = "";
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Chọn ảnh PNG, JPEG hoặc WebP không quá 10 MB.");
      objectUrl = URL.createObjectURL(file);
      const picture = new Image(); picture.src = objectUrl; await picture.decode();
      const { default: jsQR } = await import("jsqr");
      if (current !== generation.current) return;
      const scale = Math.min(1, 1800 / Math.max(picture.width, picture.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.round(picture.width * scale); canvas.height = Math.round(picture.height * scale);
      const context = canvas.getContext("2d"); if (!context) throw new Error("Trình duyệt không đọc được ảnh.");
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(frame.data, frame.width, frame.height);
      if (!result) throw new Error("Không tìm thấy QR trong ảnh. Hãy chọn ảnh rõ và có đủ bốn góc mã.");
      accept(result.data);
    } catch (cause) { if (current === generation.current) setError(cause instanceof Error ? cause.message : "Không đọc được ảnh QR."); }
    finally { if (objectUrl) URL.revokeObjectURL(objectUrl); if (current === generation.current) setBusy(false); }
  }
  return <section className="scanner-panel" aria-label="Quét mã QR">
    <div className="scanner-intro"><span aria-hidden="true">▣</span><h2>Quét thẻ nhân vật</h2><p>Đưa mã QR vào khung hình để bắt đầu lượt chơi. Không cần đăng nhập.</p></div>
    <div className={`camera-frame ${active ? "is-active" : ""}`}><video ref={video} muted playsInline aria-label="Hình ảnh camera quét QR" />{!active && <span>{busy ? "Đang mở…" : "Camera sẽ hiển thị tại đây"}</span>}</div>
    <div className="game-actions">{!active && !busy ? <button className="game-button primary" onClick={start}>Bật camera quét QR</button> : <button className="game-button" onClick={() => { stop(); setActive(false); setBusy(false); }}>Dừng camera</button>}<label className="game-button file-button">Chọn ảnh QR<input type="file" aria-label="Chọn ảnh QR" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { void readImage(e.target.files?.[0]); e.target.value = ""; }} /></label></div>
    {error && <p className="game-message error" role="alert">{error}</p>}
    <details className="manual-qr"><summary>Hoặc dán liên kết / mã nhân vật</summary><form onSubmit={e => { e.preventDefault(); accept(manual); }}><label>Liên kết hoặc ID nhân vật<input value={manual} onChange={e => setManual(e.target.value)} maxLength={2000} required placeholder="https://…/play/…" /></label><button className="game-button" type="submit">Mở nhân vật</button></form></details>
  </section>;
}

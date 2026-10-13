"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOrderAction } from "@/actions/orders";
export default function CompleteOrderButton({ id, cod }: { id: string; cod: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), router = useRouter();
  const [error, setError] = useState(""), [pending, startTransition] = useTransition();
  function complete() {
    setError(""); startTransition(async () => {
      try { const result = await completeOrderAction(id); if (result.ok) { dialog.current?.close(); router.refresh(); } else setError(result.message); }
      catch { setError("Không thể kết nối. Vui lòng thử lại."); }
    });
  }
  return <><button className="commerce-button" onClick={() => dialog.current?.showModal()}>Hoàn tất đơn hàng</button><dialog ref={dialog} className="order-confirm" aria-labelledby={`finish-${id}`} onCancel={e => { if (pending) e.preventDefault(); }}><h2 id={`finish-${id}`}>Hoàn tất đơn hàng?</h2><p>{cod ? "Xác nhận đơn COD đã được xử lý xong và đã thu tiền khi giao hàng." : "Xác nhận đơn đã thanh toán được xử lý và giao hàng xong."} Trạng thái hoàn tất không thể thay đổi lại.</p>{error && <p role="alert" className="commerce-error">{error}</p>}<div className="commerce-actions"><button className="commerce-button secondary" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Hủy</button><button className="commerce-button" onClick={complete} disabled={pending}>{pending ? "Đang lưu…" : "Xác nhận hoàn tất"}</button></div></dialog></>;
}

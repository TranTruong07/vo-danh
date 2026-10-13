"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { checkPaymentAction, startPaymentAction } from "@/actions/orders";
import type { OrderView } from "@/server/models/order";
import { money } from "@/server/domain/order";

export default function PaymentPanel({ order }: { order: OrderView }) {
  const router = useRouter(), initialized = useRef(false), [error, setError] = useState(""), [pending, startTransition] = useTransition();
  const stopped = ["CANCELLED", "EXPIRED", "FAILED"].includes(order.providerStatus || "");
  useEffect(() => {
    if (order.status !== "pending" || order.paymentMethod !== "payos" || initialized.current || order.checkoutUrl) return;
    initialized.current = true;
    startTransition(async () => {
      try { const result = await startPaymentAction(order.id); if (!result.ok) setError(result.message); else router.refresh(); }
      catch { setError("Chưa tạo được mã thanh toán. Vui lòng thử lại."); }
    });
  }, [order.id, order.status, order.paymentMethod, order.checkoutUrl, router]);
  useEffect(() => {
    if (order.status !== "pending" || !order.checkoutUrl || stopped) return;
    let alive = true, running = false;
    const check = async () => {
      if (running || document.hidden) return; running = true;
      try {
        const result = await checkPaymentAction(order.id);
        if (alive && result.ok && result.order && (result.order.status !== order.status || result.order.providerStatus !== order.providerStatus)) router.refresh();
      } catch { /* Manual retry remains available on transient network errors. */ }
      finally { running = false; }
    };
    void check(); const timer = setInterval(check, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [order.id, order.status, order.providerStatus, order.checkoutUrl, stopped, router]);
  if (order.status === "completed") return <div className="commerce-notice success" role="status">Đơn hàng đã hoàn tất. Cảm ơn bạn đã đồng hành cùng Dấu Chân Sử Ký!</div>;
  if (order.status === "paid") return <div className="commerce-notice success" role="status">Đã nhận thanh toán {money(order.total)}. Cửa hàng sẽ chuẩn bị đơn của bạn.</div>;
  if (order.paymentMethod === "cod") return <div className="commerce-notice" role="status">Đặt hàng thành công! Đơn COD chưa thanh toán, đang chờ cửa hàng xác nhận và xử lý.</div>;
  function retry() {
    setError(""); startTransition(async () => {
      try {
        if (order.checkoutUrl) {
          const result = await checkPaymentAction(order.id);
          if (!result.ok) setError(result.message);
          else { router.refresh(); if (result.order?.status === "pending") setError("Chưa nhận đủ thanh toán. Hệ thống sẽ tiếp tục kiểm tra."); }
        } else {
          const result = await startPaymentAction(order.id);
          if (!result.ok) setError(result.message); else router.refresh();
        }
      } catch { setError("Không thể kết nối. Vui lòng thử lại."); }
    });
  }
  return <section className="commerce-card payment-panel"><div><p className="commerce-kicker">THANH TOÁN ONLINE</p><h2>{stopped ? "Liên kết thanh toán đã đóng" : "Quét mã để thanh toán"}</h2><p>{stopped ? "Đơn chưa thanh toán, chưa được xử lý. Bạn có thể quay lại cửa hàng để đặt đơn mới." : `Mở ứng dụng ngân hàng và quét mã để thanh toán ${money(order.total)}. Giữ nguyên số tiền và nội dung chuyển khoản.`}</p><p>Trạng thái sẽ tự cập nhật sau khi ngân hàng xác nhận.</p>{!stopped && order.checkoutUrl && <a className="commerce-button" href={order.checkoutUrl} target="_blank" rel="noopener noreferrer">Mở trang thanh toán payOS ↗</a>}<button className="commerce-button secondary" onClick={retry} disabled={pending}>{pending ? "Đang xử lý…" : order.checkoutUrl ? "Kiểm tra thanh toán" : "Thử tạo mã thanh toán"}</button>{error && <p className="commerce-error" role="status">{error}</p>}</div>{!stopped && order.qrCode && <div className="payment-qr"><QRCodeSVG value={order.qrCode} size={220} marginSize={4} /><strong>{money(order.total)}</strong><small>Nội dung: DH{order.orderCode}</small></div>}</section>;
}

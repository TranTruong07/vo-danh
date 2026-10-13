"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeOrderAction } from "@/actions/orders";
import { money } from "@/server/domain/order";

export default function CheckoutForm({ email, requestKey, product, payosEnabled }: {
  email: string; requestKey: string; product: { name: string; price: number }; payosEnabled: boolean;
}) {
  const router = useRouter(), [quantity, setQuantity] = useState(1), [error, setError] = useState(""), [pending, startTransition] = useTransition();
  const [checkoutKey] = useState(requestKey);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const form = new FormData(event.currentTarget); setError("");
    startTransition(async () => {
      try { const result = await placeOrderAction(form); if (result.ok) router.push(`/orders/${result.id}`); else setError(result.message); }
      catch { setError("Kết nối bị gián đoạn. Vui lòng thử lại; hệ thống sẽ kiểm tra đơn đã tạo."); }
    });
  }
  return <form onSubmit={submit} className="checkout-grid" aria-busy={pending}>
    <fieldset disabled={pending} className="commerce-card checkout-fields">
      <h2><span className="commerce-step">01</span> Thông tin nhận hàng</h2>
      <input type="hidden" name="requestKey" value={checkoutKey} />
      <input type="hidden" name="quotedPrice" value={product.price} />
      <label>Họ và tên người nhận<input name="name" autoComplete="shipping name" minLength={2} maxLength={100} required placeholder="Nguyễn Văn An" /></label>
      <div className="commerce-two"><label>Email tài khoản<input type="email" value={email} readOnly autoComplete="email" /><small>Đơn hàng được lưu vào tài khoản này.</small></label><label>Số điện thoại<input name="phone" type="tel" autoComplete="shipping tel" required maxLength={20} placeholder="0912 345 678" /></label></div>
      <label>Địa chỉ nhận hàng<textarea name="address" autoComplete="shipping street-address" required minLength={10} maxLength={500} rows={3} placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành phố" /></label>
      <label>Ghi chú <small>(không bắt buộc)</small><textarea name="note" maxLength={500} rows={2} placeholder="Lưu ý cho người giao hàng…" /></label>
      <h2><span className="commerce-step">02</span> Phương thức thanh toán</h2>
      <label className="payment-option"><input type="radio" name="paymentMethod" value="cod" defaultChecked /><span><strong>Thanh toán khi nhận hàng (COD)</strong><small>Thanh toán cho người giao hàng. Đơn chờ cửa hàng xác nhận.</small></span></label>
      <label className={`payment-option ${!payosEnabled ? "unavailable" : ""}`}><input type="radio" name="paymentMethod" value="payos" disabled={!payosEnabled} /><span><strong>Chuyển khoản qua payOS</strong><small>{payosEnabled ? "Quét mã QR bằng ứng dụng ngân hàng. Xác nhận thanh toán tự động." : "Thanh toán online đang được thiết lập."}</small></span></label>
    </fieldset>
    <aside className="commerce-card checkout-summary"><p className="commerce-kicker">HỘP SỬ KÝ CỦA BẠN</p><div className="checkout-art" /><h2>{product.name}</h2><p>Cùng chơi, cùng học, cùng nhớ những câu chuyện lịch sử.</p><label>Số lượng<input name="quantity" type="number" min={1} max={10} step={1} required value={quantity} disabled={pending} onChange={e => setQuantity(Math.max(1, Math.min(10, Math.floor(Number(e.target.value)) || 1)))} /></label><dl><div><dt>Đơn giá</dt><dd>{money(product.price)}</dd></div><div><dt>Tạm tính · {quantity} hộp</dt><dd>{money(product.price * quantity)}</dd></div><div className="commerce-total"><dt>Tổng thanh toán</dt><dd>{money(product.price * quantity)}</dd></div></dl><button className="commerce-button" disabled={pending}>{pending ? "Đang tạo đơn…" : "Đặt hàng →"}</button>{error && <p role="alert" className="commerce-error">{error}</p>}<small>Bạn có thể xem tiến trình đơn trong Lịch sử mua hàng.</small></aside>
  </form>;
}

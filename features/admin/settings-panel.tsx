"use client";
import { useState } from "react";
import { checkPaymentAction, saveSettingsAction } from "@/actions/settings";
import { money } from "@/server/domain/order";
import type { PaymentConfiguration, PaymentConnectionReport, ShopSettings } from "@/server/domain/settings";
import { AdminIcon } from "./icons";

export default function SettingsPanel({ shop, payment }: { shop: ShopSettings; payment: PaymentConfiguration }) {
  const [price, setPrice] = useState(shop.productPrice?.toString() || "");
  const [saving, setSaving] = useState(false), [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(""), [error, setError] = useState("");
  const [report, setReport] = useState<PaymentConnectionReport | null>(null);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return;
    const data = new FormData(event.currentTarget);
    setSaving(true); setMessage(""); setError("");
    try { const result = await saveSettingsAction(data); if (result.ok) setMessage(`Đã lưu giá bán ${money(result.data.productPrice!)}. Giá mới áp dụng cho đơn hàng tạo sau thời điểm này.`); else setError(result.message); }
    catch { setError("Chưa kết nối được máy chủ. Vui lòng thử lại."); }
    finally { setSaving(false); }
  }
  async function check() {
    if (checking) return; setChecking(true); setReport(null);
    try { const result = await checkPaymentAction(); setReport(result.ok ? result.data : { state: "error", message: result.message, checkedAt: new Date().toISOString() }); }
    catch { setReport({ state: "error", message: "Chưa kiểm tra được. Vui lòng thử lại.", checkedAt: new Date().toISOString() }); }
    finally { setChecking(false); }
  }
  return <div className="settings-page"><div className="settings-heading"><span className="settings-mark"><AdminIcon name="settings" /></span><div><h1>Thiết lập</h1><p>Quản lý cấu hình cửa hàng và kết nối thanh toán tại một nơi.</p></div></div>
    <div className="settings-layout"><nav className="settings-sections" aria-label="Nhóm thiết lập"><a href="#store-settings"><AdminIcon name="products" /> Cửa hàng</a><a href="#payment-settings"><AdminIcon name="orders" /> Thanh toán</a><p>Các nhóm thiết lập mới sẽ được bổ sung tại đây khi website mở rộng.</p></nav><div>
      <section className="card" id="store-settings"><div className="settings-section-heading"><span className="badge">CỬA HÀNG</span><h2>Giá bán sản phẩm</h2><p>Board game Dấu Chân Sử Ký</p></div>
        <form onSubmit={save}><label htmlFor="product-price">Giá bán (VND)<input id="product-price" name="productPrice" type="number" inputMode="numeric" min="1000" max="100000000" step="1" required value={price} onChange={event => setPrice(event.target.value)} placeholder="Ví dụ: 599000" disabled={saving} aria-describedby="price-hint" /></label><p className="hint" id="price-hint">{price && Number.isSafeInteger(Number(price)) ? `Hiển thị: ${money(Number(price))}. ` : ""}Nhập số nguyên, không thêm dấu phân cách. Các đơn hàng đã tạo giữ nguyên đơn giá.</p><button className="btn primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu thiết lập"}</button>{message && <p className="msg success" role="status">{message}</p>}{error && <p className="msg error" role="alert">{error}</p>}</form>
      </section>
      <section className="card" id="payment-settings"><div className="settings-section-heading"><span className="badge">THANH TOÁN</span><h2>Kết nối payOS</h2><p>Kiểm tra API mà không tạo đơn hay phát sinh giao dịch.</p></div><dl className="payment-config">{[["Client ID", payment.clientId], ["API Key", payment.apiKey], ["Checksum Key", payment.checksumKey]].map(([name, configured]) => <div key={String(name)}><dt>{name}</dt><dd className={configured ? "configured" : "missing"}>{configured ? "Đã cấu hình" : "Chưa cấu hình"}</dd></div>)}</dl><p className="hint">Khóa bảo mật được quản lý trên máy chủ và không hiển thị trong trình duyệt.</p><div className="payment-webhook"><strong>Địa chỉ nhận kết quả thanh toán</strong><code>{payment.webhookUrl || "Chưa có địa chỉ hợp lệ"}</code><p>{payment.publicHttps ? "Đăng ký địa chỉ này trong kênh thanh toán payOS. Kiểm tra API chưa xác nhận webhook đã được đăng ký hoặc nhận thanh toán thành công." : "Địa chỉ hiện tại chưa dùng HTTPS công khai. Cần domain HTTPS hoặc tunnel để payOS gửi kết quả thanh toán về website."}</p></div><button type="button" className="btn" onClick={check} disabled={checking}>{checking ? "Đang kiểm tra…" : "Kiểm tra kết nối payOS"}</button>{report && <div className={`payment-report ${report.state}`} role="status"><strong>{report.state === "verified" ? "Đã xác minh API và chữ ký" : report.state === "reachable" ? "API đã phản hồi" : report.state === "missing" ? "Thiếu cấu hình" : "Chưa kết nối thành công"}</strong><p>{report.message}</p><small>Kiểm tra lúc {new Date(report.checkedAt).toLocaleString("vi-VN")}</small></div>}</section>
    </div></div></div>;
}

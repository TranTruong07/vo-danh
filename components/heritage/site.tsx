import Image from "next/image";
import Link from "next/link";
import { contact } from "@/lib/site-config";
import { PurchaseButton } from "./purchase-button";
import { shopProduct } from "@/server/services/catalog";
import { money } from "@/server/domain/order";
import AuthControls from "@/features/auth/auth-controls";
import { currentAccount } from "@/server/services/account-session";
import type { AuthMode } from "@/server/domain/auth";

export function Arrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

export function Icon({ name }: { name: "board" | "spark" | "qr" | "bag" }) {
  const paths = { board: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8 8 .01 0M16 8h.01M12 12h.01M8 16h.01M16 16h.01" strokeWidth="3" /></>, spark: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" /><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z" /></>, qr: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3m-3 0v3h3" /></>, bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></> };
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Brand() { return <Link href="/" className="brand" aria-label="Dấu Chân Sử Ký — Trang chủ"><span className="brand-seal">Dấu Chân<br />Sử Ký<span>✦</span></span><span className="brand-wordmark">Dấu Chân Sử Ký<small>CHƠI LỊCH SỬ · HIỂU CỘI NGUỒN</small></span></Link>; }

export async function SiteHeader({ active, initialAuthMode, resetToken, publicOnly = false }: { publicOnly?: boolean; active?: "home" | "shop"; initialAuthMode?: AuthMode; resetToken?: string }) {
  const user = publicOnly ? null : await currentAccount().catch(() => null);
  return <><a href="#main-content" className="skip-link">Đến nội dung chính</a><header className="heritage-header"><div className="header-inner"><Brand /><nav aria-label="Điều hướng chính"><Link href="/" className={active === "home" ? "active" : ""} aria-current={active === "home" ? "page" : undefined}>Home</Link><Link href="/shop" className={active === "shop" ? "active" : ""} aria-current={active === "shop" ? "page" : undefined}>Shop</Link><Link href="/play" className="header-scan"><Icon name="qr" /> Quét mã</Link></nav><div className="header-actions"><Link href="/shop#san-pham" className="header-cta"><Icon name="bag" /> Khám phá ngay <Arrow /></Link>{!publicOnly && <AuthControls user={user} initialMode={initialAuthMode} resetToken={resetToken} />}</div></div></header></>;
}

export async function ProductSection({ shop = false, offline = false }: { shop?: boolean; offline?: boolean }) {
  const product = offline ? { ready: false, price: 0 } : await shopProduct().catch(() => ({ ready: false, price: 0 }));
  return <section className={`section-wrap product-section ${shop ? "shop-product" : ""}`} id="san-pham"><div className="product-visual"><span className="product-edition">DẤU CHÂN SỬ KÝ / BOARD GAME</span><div className="game-box"><div className="box-face"><Image unoptimized={offline} src="/images/history-landscape.webp" alt="Thiết kế minh họa hộp board game Dấu Chân Sử Ký với họa tiết núi sông đỏ son" fill sizes="(max-width: 760px) 75vw, 420px" /><div className="box-title"><span>HỌC MÀ CHƠI — CHƠI MÀ HỌC</span><strong>Dấu Chân<br />Sử Ký</strong><small>BOARD GAME LỊCH SỬ · MÃ QR</small></div></div><div className="box-spine">DẤU CHÂN SỬ KÝ <span>✦</span></div></div><span className="product-visual-caption">Hình ảnh minh họa ý tưởng sản phẩm</span><div className="product-seal">MỞ HỘP<br /><strong>MỞ LỊCH SỬ</strong><span>✦</span></div></div><div className="product-copy"><p className="eyebrow">MỘT HỘP NHỎ, CẢ HÀNH TRÌNH LỚN</p><h2>Mang lịch sử<br /><em>lên bàn chơi.</em></h2><h3>Board game Dấu Chân Sử Ký</h3><p>Cùng bạn bè khám phá câu chuyện của cha ông qua từng lượt chơi. Kết hợp trải nghiệm trên bàn, mã QR và câu hỏi về nhân vật để mỗi câu hỏi đều mở ra một điều thú vị.</p><div className="product-tags"><span>Học sinh THCS</span><span>Chơi cùng bạn bè</span><span>Tích hợp MÃ QR</span></div><div className="product-purchase"><div><span>GIÁ BÁN</span><strong>{product.ready ? money(product.price) : "Đang cập nhật"}</strong></div><PurchaseButton /></div><p className="product-note">Một món quà khơi gợi sự tò mò và tình yêu lịch sử.</p></div></section>;
}

export function SiteFooter() {
  return <footer className="heritage-footer" id="lien-he"><div className="section-wrap footer-grid"><div className="footer-about"><Brand /><p>Kết nối thế hệ trẻ với những câu chuyện ngàn năm.<br />Bằng niềm vui, sự tò mò và công nghệ.</p></div><div><h3>Cùng khám phá</h3><Link href="/#cau-chuyen">Về Dấu Chân Sử Ký</Link><Link href="/shop">Board game của chúng mình</Link></div><div className="contact-column"><h3>Kết nối với chúng mình</h3><p>Dành cho đặt mua, hợp tác và những ý tưởng hay.</p>{contact.isExample ? <><span>hello@dauchansuky.example</span><span>09xx xxx xxx</span><small className="contact-example">Thông tin liên hệ minh họa</small></> : <>{contact.email && <a href={`mailto:${contact.email}`}>{contact.email} ↗</a>}{contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</a>}</>}</div></div><div className="footer-bottom section-wrap"><span>© {new Date().getFullYear()} Dấu Chân Sử Ký</span><span>Được tạo nên từ tình yêu lịch sử Việt Nam <span className="footer-heart">♥</span></span><a href="#main-content">Về đầu trang ↑</a></div></footer>;
}

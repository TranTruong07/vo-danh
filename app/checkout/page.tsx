import Link from "next/link";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { SiteFooter, SiteHeader } from "@/components/heritage/site";
import { currentAccount } from "@/server/services/account-session";
import { checkoutSettings } from "@/server/services/orders";
import CheckoutForm from "@/features/orders/checkout-form";
import "@/features/orders/orders.css";
export default async function CheckoutPage() {
  const user = await currentAccount();
  if (!user) redirect("/?auth=login&next=/checkout");
  const { product, payosEnabled } = await checkoutSettings();
  return <div className="heritage"><SiteHeader active="shop" /><main id="main-content" className="commerce-wrap"><Link href="/shop">← Tiếp tục khám phá</Link><div className="commerce-heading"><p className="commerce-kicker">MỘT HỘP NHỎ, CẢ HÀNH TRÌNH LỚN</p><h1>Đặt mua board game</h1><p>Điền thông tin nhận hàng để bắt đầu hành trình.</p></div>{product.ready ? <CheckoutForm email={user.email} requestKey={randomUUID()} product={product} payosEnabled={payosEnabled} /> : <div className="commerce-card"><h2>Cửa hàng đang cập nhật giá bán</h2><p>Vui lòng quay lại sau để đặt hàng.</p></div>}</main><SiteFooter /></div>;
}

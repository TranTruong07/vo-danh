import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/heritage/site";
import { currentAccount } from "@/server/services/account-session";
import { customerOrders } from "@/server/services/orders";
import { OrderBadge, orderDate } from "@/features/orders/order-detail";
import { money } from "@/server/domain/order";
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!await currentAccount()) redirect("/?auth=login&next=/orders");
  const query = await searchParams, data = await customerOrders(Number(query.page) || 1);
  return <div className="heritage"><SiteHeader active="shop" /><main id="main-content" className="commerce-wrap"><div className="commerce-heading"><p className="commerce-kicker">NHỮNG HÀNH TRÌNH CỦA BẠN</p><h1>Lịch sử mua hàng</h1><p>{data.total} đơn hàng · Theo dõi thanh toán và tiến trình đơn tại đây.</p></div><div className="order-history">{data.rows.map(order => <article className="commerce-card" key={order.id}><div className="order-card-top"><div><Link href={`/orders/${order.id}`}><strong>Đơn #{order.orderCode}</strong></Link><small>{orderDate(order.createdAt)}</small></div><OrderBadge status={order.status} /></div><h2>{order.productName}</h2><p>{order.quantity} hộp · {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản payOS"}</p><div className="order-card-top"><strong>{money(order.total)}</strong><Link className="commerce-button secondary" href={`/orders/${order.id}`}>{order.status === "pending" ? "Xem & thanh toán →" : "Xem chi tiết →"}</Link></div></article>)}</div>{!data.total && <section className="commerce-card commerce-empty"><h2>Chưa có đơn hàng</h2><p>Chọn hộp board game đầu tiên để cùng khám phá lịch sử.</p><Link className="commerce-button" href="/shop">Khám phá cửa hàng →</Link></section>}<nav className="commerce-pagination" aria-label="Phân trang đơn mua">{data.page > 1 && <Link href={`/orders?page=${data.page - 1}`}>← Trang trước</Link>}<span>Trang {data.page} / {data.pages}</span>{data.page < data.pages && <Link href={`/orders?page=${data.page + 1}`}>Trang sau →</Link>}</nav></main><SiteFooter /></div>;
}

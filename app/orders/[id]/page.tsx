import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/heritage/site";
import { currentAccount } from "@/server/services/account-session";
import { customerOrder } from "@/server/services/orders";
import { OrderBadge, OrderDetail } from "@/features/orders/order-detail";
import PaymentPanel from "@/features/orders/payment-panel";
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  if (!await currentAccount()) redirect(`/?auth=login&next=/orders/${id}`);
  const order = await customerOrder(id); if (!order) notFound();
  return <div className="heritage"><SiteHeader active="shop" /><main id="main-content" className="commerce-wrap"><Link href="/orders">← Lịch sử mua hàng</Link><div className="commerce-heading"><p className="commerce-kicker">CHI TIẾT ĐƠN HÀNG</p><h1>Đơn #{order.orderCode}</h1><OrderBadge status={order.status} /></div><PaymentPanel order={order} /><OrderDetail order={order} /></main><SiteFooter /></div>;
}

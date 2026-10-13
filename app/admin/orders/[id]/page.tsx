import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { adminOrder } from "@/server/services/orders";
import { canComplete } from "@/server/domain/order";
import { OrderBadge, OrderDetail } from "@/features/orders/order-detail";
import CompleteOrderButton from "@/features/orders/complete-order-button";
export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const order = await adminOrder((await params).id); if (!order) notFound();
  return <><Link href="/admin/orders">← Danh sách đơn hàng</Link><div className="dashboard-heading commerce-heading"><div><p className="dashboard-eyebrow">CHI TIẾT ĐƠN HÀNG</p><h1>Đơn #{order.orderCode}</h1><OrderBadge status={order.status} /></div>{canComplete(order) && <CompleteOrderButton id={order.id} cod={order.paymentMethod === "cod"} />}</div>{order.status === "pending" && <p className="commerce-notice">Đơn online đang chờ thanh toán. Chỉ payOS có thể xác nhận trạng thái Đã thanh toán; chưa thể hoàn tất đơn này.</p>}{order.status === "completed" && <p className="commerce-notice success">Đơn đã hoàn tất và được khóa thay đổi trạng thái.</p>}<OrderDetail order={order} /></>;
}

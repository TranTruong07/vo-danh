import "server-only";
import { randomInt } from "node:crypto";
import { currentAccount } from "./account-session";
import { requireAdmin } from "./admin-auth";
import { shopProduct } from "./catalog";
import { OrderError, orderFilter, validateCheckout } from "@/server/domain/order";
import * as repository from "@/server/repositories/orders";
import { createPayosLink, getPayosPayment, payosReady, verifyPayosWebhook } from "@/server/infrastructure/payos";
import type { OrderModel } from "@/server/models/order";

export async function checkoutSettings() { return { product: await shopProduct(), payosEnabled: payosReady() }; }

export async function requireCustomer() {
  const user = await currentAccount();
  if (!user) throw new OrderError("Vui lòng đăng nhập trước khi mua hàng.");
  return user;
}
export async function placeOrder(form: FormData) {
  const user = await requireCustomer(), input = validateCheckout(form);
  const existing = await repository.findOrderByRequest(user.userId, input.requestKey);
  if (existing) return repository.orderView(existing);
  const product = await shopProduct();
  if (!product.ready) throw new OrderError("Cửa hàng đang cập nhật giá bán. Vui lòng quay lại sau.");
  if (form.get("quotedPrice") !== String(product.price)) throw new OrderError("Giá bán vừa được cập nhật. Vui lòng tải lại trang để xem và xác nhận giá mới trước khi đặt hàng.");
  if (input.paymentMethod === "payos" && !payosReady()) throw new OrderError("Thanh toán online chưa sẵn sàng. Vui lòng chọn COD.");
  const now = new Date();
  const order = await repository.insertOrder({ ...input, userId: user.userId, email: user.email,
    orderCode: Date.now() * 1000 + randomInt(1000), productName: product.name, unitPrice: product.price,
    total: product.price * input.quantity,
    status: input.paymentMethod === "cod" ? "unpaid" : "pending", createdAt: now, updatedAt: now });
  return repository.orderView(order);
}
export async function customerOrder(id: string) {
  const user = await requireCustomer();
  const row = await repository.findOrder(id, user.userId);
  return row ? repository.orderView(row) : null;
}
export async function customerOrders(page: number) {
  const user = await requireCustomer();
  return repository.listOrders(undefined, "", page, user.userId);
}
export async function startOrderPayment(id: string) {
  const user = await requireCustomer(), order = await repository.findOrder(id, user.userId);
  if (!order || order.paymentMethod !== "payos" || order.status !== "pending") throw new OrderError("Đơn hàng không cần thanh toán online.");
  if (order.checkoutUrl) return;
  if (!await repository.paymentLease(order._id)) throw new OrderError("Đang tạo mã thanh toán. Vui lòng đợi vài giây rồi thử lại.");
  try { await repository.savePaymentLink(order._id, await createPayosLink(order)); }
  finally { await repository.releasePaymentLease(order._id); }
}
async function reconcile(order: OrderModel) {
  const payment = await getPayosPayment(order.orderCode);
  if (payment.orderCode !== order.orderCode || payment.amount !== order.total || (order.paymentLinkId && payment.id !== order.paymentLinkId)) throw new OrderError("Thông tin giao dịch chưa khớp với đơn hàng.");
  const paid = payment.status === "PAID" && payment.amountPaid >= order.total && payment.amountRemaining === 0;
  await repository.recordProviderStatus(order._id, payment.status, paid);
}
export async function refreshOrderPayment(id: string) {
  const user = await requireCustomer(), order = await repository.findOrder(id, user.userId);
  if (!order) throw new OrderError("Không tìm thấy đơn hàng.");
  if (order.status === "pending" && order.paymentMethod === "payos" && order.paymentLinkId && await repository.reservePaymentCheck(order._id)) {
    try { await reconcile(order); } catch { throw new OrderError("Chưa kiểm tra được thanh toán. Vui lòng thử lại sau."); }
  }
  return customerOrder(id);
}
export async function receivePaymentWebhook(payload: unknown) {
  const data = await verifyPayosWebhook(payload);
  if (data.code !== "00" || data.currency !== "VND" || !Number.isSafeInteger(data.orderCode)) return;
  const order = await repository.findOrderByCode(data.orderCode);
  // Also acknowledges payOS's signed registration sample without creating an order.
  if (!order || order.paymentMethod !== "payos" || order.status !== "pending") return;
  if (order.paymentLinkId && order.paymentLinkId !== data.paymentLinkId) throw new OrderError("Giao dịch không khớp.");
  // Query authoritative cumulative paid amount: partial transfers must never mark an order paid.
  await reconcile(order);
}
export async function adminOrders(status: string | undefined, q: string, page: number) {
  await requireAdmin();
  const [list, metrics] = await Promise.all([repository.listOrders(orderFilter(status), q, page), repository.orderMetrics()]);
  return { ...list, metrics };
}
export async function adminOrder(id: string) { await requireAdmin(); const row = await repository.findOrder(id); return row ? repository.orderView(row) : null; }
export async function finishOrder(id: string) {
  await requireAdmin(); const user = await requireCustomer();
  if (!await repository.completeOrder(id, user.userId)) throw new OrderError("Chỉ đơn Đã thanh toán hoặc đơn COD Chưa thanh toán mới được hoàn tất.");
}

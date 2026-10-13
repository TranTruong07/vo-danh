export const orderStatuses = {
  pending: "Chờ thanh toán online", unpaid: "Chưa thanh toán", paid: "Đã thanh toán", completed: "Hoàn tất",
} as const;
export type OrderStatus = keyof typeof orderStatuses;
export type PaymentMethod = "cod" | "payos";
export class OrderError extends Error {}
export const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
export function canComplete(order: { status: OrderStatus; paymentMethod: PaymentMethod }) {
  return order.status === "paid" || (order.status === "unpaid" && order.paymentMethod === "cod");
}
export function orderFilter(value: string | undefined): OrderStatus | undefined {
  return value && Object.hasOwn(orderStatuses, value) ? value as OrderStatus : undefined;
}
export function validateCheckout(form: FormData) {
  const field = (key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
  const name = field("name"), phone = field("phone").replace(/[\s().-]/g, ""), address = field("address"), note = field("note");
  const quantity = Number(field("quantity")), paymentMethod = field("paymentMethod"), requestKey = field("requestKey");
  if (name.length < 2 || name.length > 100) throw new OrderError("Tên người nhận cần từ 2 đến 100 ký tự.");
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(phone)) throw new OrderError("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
  if (address.length < 10 || address.length > 500) throw new OrderError("Địa chỉ cần từ 10 đến 500 ký tự, gồm số nhà, đường và tỉnh/thành.");
  if (note.length > 500) throw new OrderError("Ghi chú tối đa 500 ký tự.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new OrderError("Số lượng phải từ 1 đến 10 hộp.");
  if (paymentMethod !== "cod" && paymentMethod !== "payos") throw new OrderError("Phương thức thanh toán không hợp lệ.");
  if (!/^[a-f\d-]{36}$/i.test(requestKey)) throw new OrderError("Phiên đặt hàng không hợp lệ. Vui lòng tải lại trang.");
  return { name, phone, address, note, quantity, paymentMethod, requestKey } as const;
}

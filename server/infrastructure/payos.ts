import "server-only";
import { PayOS } from "@payos/node";
import type { Webhook } from "@payos/node/lib/resources/webhooks";
import type { OrderModel } from "@/server/models/order";
import { OrderError } from "@/server/domain/order";
import type { PaymentConfiguration, PaymentConnectionReport } from "@/server/domain/settings";

export function payosReady() { return [process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY].every(value => !!value?.trim()); }
function client() {
  if (!payosReady()) throw new OrderError("Thanh toán online chưa sẵn sàng. Vui lòng chọn COD hoặc thử lại sau.");
  return new PayOS({ clientId: process.env.PAYOS_CLIENT_ID?.trim(), apiKey: process.env.PAYOS_API_KEY?.trim(), checksumKey: process.env.PAYOS_CHECKSUM_KEY?.trim(), timeout: 12000, maxRetries: 0, logLevel: "off" });
}
function appUrl() {
  const url = new URL(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001");
  if (!["https:", "http:"].includes(url.protocol) || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) throw new OrderError("Chưa cấu hình địa chỉ thanh toán hợp lệ.");
  return url.origin;
}
export async function createPayosLink(order: OrderModel) {
  const payos = client(), url = `${appUrl()}/orders/${order._id.toHexString()}`;
  try {
    const result = await payos.paymentRequests.create({ orderCode: order.orderCode, amount: order.total,
      description: `DH${order.orderCode}`, returnUrl: url, cancelUrl: url,
      buyerName: order.name, buyerEmail: order.email, buyerPhone: order.phone, buyerAddress: order.address,
      // Older orders keep their stored total; omit optional line items if that total differs.
      ...(order.total === order.unitPrice * order.quantity ? { items: [{ name: order.productName, quantity: order.quantity, price: order.unitPrice }] } : {}),
    });
    if (result.orderCode !== order.orderCode || result.amount !== order.total || result.currency !== "VND") throw new Error("Payment mismatch");
    const checkout = new URL(result.checkoutUrl);
    if (checkout.protocol !== "https:" || checkout.hostname !== "pay.payos.vn") throw new Error("Invalid checkout URL");
    return { paymentLinkId: result.paymentLinkId, checkoutUrl: result.checkoutUrl, qrCode: result.qrCode };
  } catch {
    // Recover the same order code if payOS created a link but its response was lost.
    const existing = await payos.paymentRequests.get(order.orderCode).catch(() => null);
    if (existing && existing.orderCode === order.orderCode && existing.amount === order.total && /^[a-f\d]{32}$/i.test(existing.id)) {
      return { paymentLinkId: existing.id, checkoutUrl: `https://pay.payos.vn/web/${existing.id}` };
    }
    throw new OrderError("Chưa kết nối được payOS. Đơn hàng đã được lưu; bạn có thể thử thanh toán lại tại đây.");
  }
}
export async function getPayosPayment(orderCode: number) { return client().paymentRequests.get(orderCode); }
export async function verifyPayosWebhook(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("data" in payload) || !("signature" in payload)) throw new OrderError("Webhook không hợp lệ.");
  try { return await client().webhooks.verify(payload as Webhook); }
  catch { throw new OrderError("Chữ ký webhook không hợp lệ."); }
}

export function paymentConfiguration(): PaymentConfiguration {
  let webhookUrl: string | null = null, publicHttps = false;
  try {
    const url = new URL(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001");
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) {
      webhookUrl = `${url.origin}/api/payos/webhook`;
      publicHttps = url.protocol === "https:" && !/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(url.hostname);
    }
  } catch { /* Invalid deployment URL is reported without exposing environment values. */ }
  return { clientId: !!process.env.PAYOS_CLIENT_ID?.trim(), apiKey: !!process.env.PAYOS_API_KEY?.trim(), checksumKey: !!process.env.PAYOS_CHECKSUM_KEY?.trim(), webhookUrl, publicHttps };
}
export async function probePayosConnection(orderCode?: number): Promise<PaymentConnectionReport> {
  const checkedAt = new Date().toISOString();
  if (!payosReady()) return { state: "missing", checkedAt, message: "Cần cấu hình đủ Client ID, API Key và Checksum Key trên máy chủ." };
  try {
    // GET only. A known order lets the SDK verify the response checksum as well.
    await client().paymentRequests.get(orderCode ?? Date.now());
    return { state: "verified", checkedAt, message: "Đã đọc thông tin thanh toán và xác minh chữ ký phản hồi bằng SDK payOS. Chưa kiểm thử nhận tiền hoặc webhook đầu cuối." };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    // payOS returns code 101 for an order code that does not exist.
    if (code === "101") return { state: "reachable", checkedAt, message: "payOS đã phản hồi: mã thanh toán không tồn tại (101). Kết nối tới API hoạt động; chưa có dữ liệu giao dịch để xác minh Checksum Key và chưa kiểm thử webhook." };
    return { state: "error", checkedAt, message: "Không xác minh được kết nối hoặc chữ ký payOS. Kiểm tra bộ khóa của cùng một kênh thanh toán và kết nối mạng rồi thử lại." };
  }
}

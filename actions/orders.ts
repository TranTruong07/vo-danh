"use server";
import { revalidatePath } from "next/cache";
import { OrderError } from "@/server/domain/order";
import { finishOrder, placeOrder, refreshOrderPayment, startOrderPayment } from "@/server/services/orders";
function message(error: unknown) { return error instanceof OrderError ? error.message : "Không thể xử lý đơn hàng. Vui lòng thử lại sau."; }
export async function placeOrderAction(form: FormData) {
  try { const order = await placeOrder(form); revalidatePath("/orders"); revalidatePath("/admin"); return { ok: true as const, id: order.id }; }
  catch (error) { return { ok: false as const, message: message(error) }; }
}
export async function startPaymentAction(id: string) {
  try { await startOrderPayment(id); revalidatePath(`/orders/${id}`); return { ok: true as const }; }
  catch (error) { return { ok: false as const, message: message(error) }; }
}
export async function checkPaymentAction(id: string) {
  try { const order = await refreshOrderPayment(id); return { ok: true as const, order }; }
  catch (error) { return { ok: false as const, message: message(error) }; }
}
export async function completeOrderAction(id: string) {
  try { await finishOrder(id); revalidatePath("/admin", "layout"); revalidatePath("/orders", "layout"); return { ok: true as const }; }
  catch (error) { return { ok: false as const, message: message(error) }; }
}

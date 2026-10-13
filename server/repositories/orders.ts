import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { getDatabase } from "@/lib/db/client";
import type { OrderModel, OrderView } from "@/server/models/order";
import type { OrderStatus } from "@/server/domain/order";

const state = globalThis as typeof globalThis & { orderIndexes?: Promise<void> };
async function orders() {
  const collection = (await getDatabase()).collection<OrderModel>("orders");
  state.orderIndexes ??= Promise.all([
    collection.createIndex({ orderCode: 1 }, { unique: true }),
    collection.createIndex({ userId: 1, requestKey: 1 }, { unique: true }),
    collection.createIndex({ userId: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
  ]).then(() => {}).catch(error => { state.orderIndexes = undefined; throw error; });
  await state.orderIndexes;
  return collection;
}
export function orderView(row: OrderModel): OrderView {
  const { _id, createdAt, updatedAt, paidAt, completedAt, requestKey: _key, paymentLeaseUntil: _lease, lastPaymentCheck: _check, ...rest } = row;
  void _key; void _lease; void _check;
  return { ...rest, id: _id.toHexString(), createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString(), paidAt: paidAt?.toISOString(), completedAt: completedAt?.toISOString() };
}
export async function findOrder(id: string, userId?: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  return (await orders()).findOne({ _id: new ObjectId(id), ...(userId ? { userId } : {}) });
}
export async function findOrderByCode(orderCode: number) { return (await orders()).findOne({ orderCode }); }
export async function findOrderByRequest(userId: string, requestKey: string) { return (await orders()).findOne({ userId, requestKey }); }
export async function insertOrder(row: Omit<OrderModel, "_id">) {
  const document = { ...row, _id: new ObjectId() };
  try { await (await orders()).insertOne(document); return document; }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const existing = await findOrderByRequest(row.userId, row.requestKey);
      if (existing) return existing;
    }
    throw error;
  }
}
export function orderQuery(status?: OrderStatus, search = "", userId?: string): Filter<OrderModel> {
  const q = search.trim().slice(0, 120), literal = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { ...(userId ? { userId } : {}), ...(status ? { status } : {}), ...(q ? { $or: [
    { email: { $regex: literal, $options: "i" } }, { name: { $regex: literal, $options: "i" } },
    { phone: { $regex: literal } }, ...( /^\d+$/.test(q) ? [{ orderCode: Number(q) }] : []),
  ] } : {}) };
}
export async function listOrders(status: OrderStatus | undefined, search: string, page: number, userId?: string) {
  const collection = await orders(), filter = orderQuery(status, search, userId);
  const total = await collection.countDocuments(filter), pages = Math.max(1, Math.ceil(total / 15));
  const currentPage = Math.min(pages, Math.max(1, Math.floor(page) || 1));
  const rows = await collection.find(filter).sort({ createdAt: -1, _id: -1 }).skip((currentPage - 1) * 15).limit(15).toArray();
  return { rows: rows.map(orderView), total, pages, page: currentPage };
}
export async function exportOrderRows(status?: OrderStatus, search = "") {
  return (await orders()).find(orderQuery(status, search)).sort({ createdAt: -1 });
}
export async function completeOrder(id: string, adminId: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) return false;
  const result = await (await orders()).updateOne({ _id: new ObjectId(id), $or: [{ status: "paid" }, { status: "unpaid", paymentMethod: "cod" }] },
    { $set: { status: "completed", completedAt: new Date(), completedBy: adminId, updatedAt: new Date() } });
  return result.modifiedCount === 1;
}
export async function paymentLease(id: ObjectId) {
  return (await orders()).findOneAndUpdate({ _id: id, status: "pending", $or: [{ paymentLeaseUntil: { $exists: false } }, { paymentLeaseUntil: { $lt: new Date() } }] },
    { $set: { paymentLeaseUntil: new Date(Date.now() + 45_000) } }, { returnDocument: "after" });
}
export async function releasePaymentLease(id: ObjectId) { await (await orders()).updateOne({ _id: id }, { $unset: { paymentLeaseUntil: "" } }); }
export async function savePaymentLink(id: ObjectId, link: { paymentLinkId: string; checkoutUrl: string; qrCode?: string }) {
  await (await orders()).updateOne({ _id: id, paymentMethod: "payos" }, { $set: { ...link, updatedAt: new Date() } });
}
export async function reservePaymentCheck(id: ObjectId) {
  return (await orders()).findOneAndUpdate({ _id: id, status: "pending", $or: [{ lastPaymentCheck: { $exists: false } }, { lastPaymentCheck: { $lt: new Date(Date.now() - 10_000) } }] },
    { $set: { lastPaymentCheck: new Date() } }, { returnDocument: "after" });
}
export async function recordProviderStatus(id: ObjectId, providerStatus: string, paid: boolean) {
  await (await orders()).updateOne({ _id: id, paymentMethod: "payos", status: "pending" },
    { $set: { providerStatus, updatedAt: new Date(), ...(paid ? { status: "paid" as const, paidAt: new Date() } : {}) } });
}
export async function orderMetrics() {
  const groups = await (await orders()).aggregate<{ _id: OrderStatus; count: number; revenue: number }>([
    { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$paidAt", null] }, null] }, { $and: [{ $eq: ["$paymentMethod", "cod"] }, { $eq: ["$status", "completed"] }] }] }, "$total", 0] } } } },
  ]).toArray();
  return { total: groups.reduce((n, g) => n + g.count, 0), revenue: groups.reduce((n, g) => n + g.revenue, 0), counts: Object.fromEntries(groups.map(g => [g._id, g.count])) as Partial<Record<OrderStatus, number>> };
}

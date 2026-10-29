import "server-only";
import { getDatabase } from "@/lib/db/client";
import type { ShopSettingsModel } from "@/server/models/settings";
import type { ProductContent } from "@/server/domain/product";

export async function readShopSettings() {
  return (await getDatabase()).collection<ShopSettingsModel>("settings").findOne({ _id: "shop" });
}
export async function writeProductPrice(productPrice: number) {
  const updatedAt = new Date();
  await (await getDatabase()).collection<ShopSettingsModel>("settings").updateOne(
    { _id: "shop" }, { $set: { productPrice, updatedAt } }, { upsert: true },
  );
  return { productPrice, updatedAt: updatedAt.toISOString() };
}
export async function writeShopProduct(product: ProductContent, productPrice: number) {
  // Content and checkout price share one atomic document update.
  await (await getDatabase()).collection<ShopSettingsModel>("settings").updateOne(
    { _id: "shop" }, { $set: { product, productPrice, updatedAt: new Date() } }, { upsert: true },
  );
}
export async function paymentProbeOrderCode() {
  const row = await (await getDatabase()).collection<{ orderCode: number; paymentMethod: string; paymentLinkId?: string }>("orders")
    .findOne({ paymentMethod: "payos", paymentLinkId: { $type: "string", $ne: "" } }, { sort: { createdAt: -1 }, projection: { orderCode: 1 } });
  return row?.orderCode;
}

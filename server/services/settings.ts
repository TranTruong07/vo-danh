import "server-only";
import { requireAdmin } from "./admin-auth";
import { parseProductPrice, validProductPrice, type ShopSettings } from "@/server/domain/settings";
import { paymentProbeOrderCode, readShopSettings, writeProductPrice } from "@/server/repositories/settings";
import { paymentConfiguration, probePayosConnection } from "@/server/infrastructure/payos";

export async function adminSettings() {
  await requireAdmin();
  const row = await readShopSettings();
  const shop: ShopSettings = { productPrice: validProductPrice(row?.productPrice) ? row.productPrice : null, updatedAt: row?.updatedAt.toISOString() || null };
  return { shop, payment: paymentConfiguration() };
}
export async function saveShopSettings(form: FormData): Promise<ShopSettings> {
  await requireAdmin();
  return writeProductPrice(parseProductPrice(form.get("productPrice")));
}
export async function checkPaymentConnection() {
  await requireAdmin();
  const orderCode = await paymentProbeOrderCode();
  return probePayosConnection(orderCode);
}

import "server-only";
import { readShopSettings } from "@/server/repositories/settings";
import { validProductPrice } from "@/server/domain/settings";
export async function shopProduct() {
  const settings = await readShopSettings();
  const price = settings?.productPrice;
  return { name: "Board game Dấu Chân Sử Ký", price: validProductPrice(price) ? price : 0, ready: validProductPrice(price) };
}

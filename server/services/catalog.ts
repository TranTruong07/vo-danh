import "server-only";
import { readShopSettings } from "@/server/repositories/settings";
import { validProductPrice } from "@/server/domain/settings";
import { DEFAULT_PRODUCT, readProductGallery, type CatalogProduct } from "@/server/domain/product";
export async function shopProduct(): Promise<CatalogProduct> {
  const settings = await readShopSettings();
  const price = settings?.productPrice;
  return { ...DEFAULT_PRODUCT, ...settings?.product, gallery: readProductGallery(settings?.product?.gallery), price: validProductPrice(price) ? price : 0, ready: validProductPrice(price) };
}

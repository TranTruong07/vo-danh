import "server-only";
import { readShopSettings } from "@/server/repositories/settings";
import { calculateOriginalPrice, validDiscountPercent, validProductPrice } from "@/server/domain/settings";
import { DEFAULT_PRODUCT, readProductGallery, type CatalogProduct } from "@/server/domain/product";
export async function shopProduct(): Promise<CatalogProduct> {
  const settings = await readShopSettings();
  const price = settings?.productPrice;
  const validPrice = validProductPrice(price) ? price : 0;
  const discountPercent = validDiscountPercent(settings?.discountPercent) ? settings.discountPercent : 0;
  const originalPrice = calculateOriginalPrice(validPrice, discountPercent);
  return {
    ...DEFAULT_PRODUCT,
    ...settings?.product,
    gallery: readProductGallery(settings?.product?.gallery),
    price: validPrice,
    ready: validProductPrice(price),
    discountPercent,
    originalPrice,
  };
}

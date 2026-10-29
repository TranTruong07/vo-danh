import "server-only";
import { requireAdmin } from "./admin-auth";
import { shopProduct } from "./catalog";
import { DEFAULT_PRODUCT, validateProductContent } from "@/server/domain/product";
import { parseProductPrice, SettingsError } from "@/server/domain/settings";
import { MAX_IMAGE_BYTES } from "@/server/domain/image";
import { prepareCharacterImage } from "@/server/infrastructure/character-image";
import { R2_PUBLIC_BASE_URL } from "@/server/infrastructure/r2";
import { uploadProductImage } from "@/server/repositories/images";
import { writeShopProduct } from "@/server/repositories/settings";

export async function adminProduct() { await requireAdmin(); return shopProduct(); }

export function isProductImage(url: string) {
  if (url === DEFAULT_PRODUCT.mainImage) return true;
  const prefix = `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/images/products/`;
  return !!R2_PUBLIC_BASE_URL && url.startsWith(prefix) && /^[a-f0-9-]{36}\.webp$/.test(url.slice(prefix.length));
}

export async function saveProduct(form: FormData) {
  await requireAdmin();
  const price = parseProductPrice(form.get("price"));
  const raw = form.get("product");
  if (typeof raw !== "string" || raw.length > 40000) throw new SettingsError("Thông tin sản phẩm quá lớn hoặc không hợp lệ.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new SettingsError("Thông tin sản phẩm không hợp lệ."); }
  const product = validateProductContent(parsed);
  if (![product.mainImage, ...product.gallery.map(image => image.url)].every(isProductImage)) throw new SettingsError("Vui lòng dùng ảnh sản phẩm tải lên từ màn quản trị này.");
  await writeShopProduct(product, price);
  return { ...product, price, ready: true };
}

export async function uploadProductPhoto(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES) throw new SettingsError("Mỗi ảnh phải có dung lượng từ 1 byte đến 3 MB.");
  const bytes = await prepareCharacterImage(Buffer.from(await file.arrayBuffer()));
  const object = await uploadProductImage(bytes);
  return { url: object.url };
}

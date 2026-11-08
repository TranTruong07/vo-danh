export interface ShopSettings { productPrice: number | null; updatedAt: string | null }
export class SettingsError extends Error {}
export function validProductPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1000 && value <= 100_000_000;
}
export function parseProductPrice(value: FormDataEntryValue | null): number {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) throw new SettingsError("Nhập giá bán bằng số nguyên VND, không dùng dấu chấm hoặc dấu phẩy.");
  const price = Number(value);
  if (!validProductPrice(price)) throw new SettingsError("Giá bán cần từ 1.000 đến 100.000.000 đồng.");
  return price;
}
export function validDiscountPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value < 100;
}
export function parseDiscountPercent(value: FormDataEntryValue | null): number {
  if (value === null || value === undefined) return 0;
  if (typeof value !== "string") throw new SettingsError("Phần trăm giảm giá không hợp lệ.");
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!/^\d+$/.test(trimmed)) throw new SettingsError("Phần trăm giảm giá phải là số nguyên từ 0 đến 99.");
  const discount = Number(trimmed);
  if (!validDiscountPercent(discount)) throw new SettingsError("Phần trăm giảm giá phải từ 0% đến 99%.");
  return discount;
}
export function calculateOriginalPrice(price: number, discountPercent: number): number {
  if (!validDiscountPercent(discountPercent) || discountPercent <= 0) return price;
  return Math.round(price / (1 - discountPercent / 100));
}
export interface PaymentConnectionReport {
  state: "missing" | "reachable" | "verified" | "error";
  message: string;
  checkedAt: string;
}
export interface PaymentConfiguration {
  clientId: boolean; apiKey: boolean; checksumKey: boolean;
  webhookUrl: string | null;
  publicHttps: boolean;
}

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

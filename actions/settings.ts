"use server";
import { revalidatePath } from "next/cache";
import { checkPaymentConnection, saveShopSettings } from "@/server/services/settings";
import { SettingsError, type PaymentConnectionReport, type ShopSettings } from "@/server/domain/settings";
import type { GameResult } from "@/server/domain/quiz";

export async function saveSettingsAction(form: FormData): Promise<GameResult<ShopSettings>> {
  try {
    const data = await saveShopSettings(form);
    for (const path of ["/admin/settings", "/", "/shop", "/checkout"]) revalidatePath(path);
    return { ok: true, data };
  } catch (error) { return { ok: false, message: error instanceof SettingsError ? error.message : "Không lưu được thiết lập. Kiểm tra phiên admin và kết nối rồi thử lại." }; }
}
export async function checkPaymentAction(): Promise<GameResult<PaymentConnectionReport>> {
  try { return { ok: true, data: await checkPaymentConnection() }; }
  catch { return { ok: false, message: "Không kiểm tra được kết nối. Vui lòng đăng nhập admin và thử lại." }; }
}

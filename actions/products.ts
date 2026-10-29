"use server";
import { revalidatePath } from "next/cache";
import { saveProduct, uploadProductPhoto } from "@/server/services/products";
import { SettingsError } from "@/server/domain/settings";
import { GameError } from "@/server/domain/character";
import type { GameResult } from "@/server/domain/quiz";
import type { CatalogProduct } from "@/server/domain/product";

const message = (error: unknown) => error instanceof SettingsError || error instanceof GameError ? error.message : "Không lưu được sản phẩm. Kiểm tra phiên admin và kết nối rồi thử lại.";
export async function saveProductAction(form: FormData): Promise<GameResult<CatalogProduct>> {
  try {
    const data = await saveProduct(form);
    for (const path of ["/admin/products", "/admin/settings", "/", "/shop", "/checkout", "/api/offline/pack"]) revalidatePath(path);
    return { ok: true, data };
  } catch (error) { return { ok: false, message: message(error) }; }
}
export async function uploadProductPhotoAction(form: FormData): Promise<GameResult<{ url: string }>> {
  try { return { ok: true, data: await uploadProductPhoto(form) }; }
  catch (error) { return { ok: false, message: message(error) }; }
}

"use server";

import { revalidatePath } from "next/cache";
import { AuthError, type AuthMode, type AuthResult } from "@/server/domain/auth";
import { handleAccountAction } from "@/server/services/accounts";
import { closeAccountSession } from "@/server/services/account-session";

export async function accountAction(mode: AuthMode, form: FormData): Promise<AuthResult> {
  if (!["login", "register", "forgot", "reset"].includes(mode)) return { ok: false, message: "Thao tác không hợp lệ." };
  const field = (name: string) => typeof form.get(name) === "string" ? String(form.get(name)) : "";
  const input = { email: field("email"), password: field("password"), confirmPassword: field("confirmPassword"), token: field("token") };
  if (input.email.length > 254 || input.password.length > 32 || input.confirmPassword.length > 32 || input.token.length > 64) return { ok: false, message: "Email không hợp lệ hoặc mật khẩu vượt quá 32 ký tự." };
  try {
    const avatar = form.get("avatarFile");
    const result = await handleAccountAction(mode, input, mode === "register" && avatar instanceof File ? avatar : undefined);
    const returnTo = field("returnTo");
    if (result.ok && result.user?.role !== "admin" && result.user && /^\/(?:checkout|account(?:\/password)?|orders(?:\/[a-f\d]{24})?)$/.test(returnTo)) result.redirectTo = returnTo;
    if (result.ok && (mode === "register" || mode === "login" || mode === "reset")) revalidatePath("/", "layout");
    return result;
  } catch (error) {
    return { ok: false, message: error instanceof AuthError ? error.message : "Không thể kết nối hệ thống tài khoản. Vui lòng thử lại sau." };
  }
}

export async function logoutAccount(): Promise<AuthResult> {
  try { await closeAccountSession(); }
  catch { return { ok: false, message: "Phiên trên trình duyệt đã đóng, nhưng chưa thu hồi được phiên trên máy chủ. Vui lòng thử lại khi có kết nối." }; }
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã đăng xuất." };
}

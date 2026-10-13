"use server";

import { revalidatePath } from "next/cache";
import { AuthError, type AuthResult } from "@/server/domain/auth";
import { changePassword, saveProfile } from "@/server/services/profile";

export async function updateProfileAction(form: FormData): Promise<AuthResult> {
  try {
    const result = await saveProfile(form);
    revalidatePath("/", "layout");
    return result;
  } catch (error) {
    return { ok: false, message: error instanceof AuthError ? error.message : "Không thể lưu thông tin cá nhân. Vui lòng thử lại." };
  }
}

export async function changePasswordAction(form: FormData): Promise<AuthResult> {
  try {
    const result = await changePassword(form);
    revalidatePath("/", "layout");
    return result;
  } catch (error) {
    return { ok: false, message: error instanceof AuthError ? error.message : "Không thể đổi mật khẩu. Vui lòng thử lại." };
  }
}

import "server-only";
import { ObjectId } from "mongodb";
import { AuthError, DEFAULT_AVATAR, normalizeEmail, validPassword, type AuthResult } from "@/server/domain/auth";
import { hashPassword, verifyPassword } from "@/server/infrastructure/password";
import * as users from "@/server/repositories/users";
import { currentAccount, openAccountSession, publicUser } from "./account-session";
import { rollbackAccountAvatar, uploadAccountAvatar } from "./account-avatar";
import { limitAttempts } from "./accounts";

const field = (form: FormData, name: string) => typeof form.get(name) === "string" ? String(form.get(name)) : "";

async function requireAccount() {
  const account = await currentAccount();
  if (!account) throw new AuthError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  const user = await users.findUserById(new ObjectId(account.userId));
  if (!user) throw new AuthError("Không tìm thấy tài khoản.");
  return user;
}

export async function saveProfile(form: FormData): Promise<AuthResult> {
  const user = await requireAccount();
  const fullName = field(form, "fullName").trim();
  const phone = field(form, "phone").trim();
  const address = field(form, "address").trim();
  if (fullName.length > 100 || /[\u0000-\u001f]/.test(fullName)) throw new AuthError("Họ và tên không được vượt quá 100 ký tự hoặc chứa ký tự điều khiển.");
  if (phone && !/^\+?[\d ()-]{6,20}$/.test(phone)) throw new AuthError("Số điện thoại phải có từ 6 đến 20 ký tự, chỉ gồm số, dấu +, khoảng trắng, dấu ngoặc hoặc gạch ngang.");
  if (address.length > 500) throw new AuthError("Địa chỉ không được vượt quá 500 ký tự.");
  await limitAttempts("profile", user._id.toHexString());
  const file = form.get("avatarFile");
  const avatar = await uploadAccountAvatar(file instanceof File ? file : undefined);
  try {
    const updated = await users.updateUserProfile(user._id, user.authVersion, {
      fullName, phone, address,
      avatarUrl: avatar?.url ?? (field(form, "removeAvatar") === "true" ? DEFAULT_AVATAR : user.avatarUrl || DEFAULT_AVATAR),
    });
    if (!updated) throw new AuthError("Thông tin tài khoản đã thay đổi. Vui lòng tải lại trang và thử lại.");
    return { ok: true, message: "Đã lưu thông tin cá nhân.", user: publicUser(updated) };
  } catch (error) { await rollbackAccountAvatar(avatar); throw error; }
}

export async function changePassword(form: FormData): Promise<AuthResult> {
  const user = await requireAccount();
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  if (user.role === "admin" || user.email === adminEmail) throw new AuthError("Mật khẩu quản trị viên được quản lý bằng ADMIN_PASSWORD trong .env.local.");
  await limitAttempts("password", user._id.toHexString());
  const current = field(form, "currentPassword"), password = field(form, "password"), confirm = field(form, "confirmPassword");
  if (!validPassword(current)) throw new AuthError("Vui lòng nhập mật khẩu hiện tại từ 6 đến 32 ký tự.");
  if (!validPassword(password)) throw new AuthError("Mật khẩu mới phải dài từ 6 đến 32 ký tự.");
  if (password !== confirm) throw new AuthError("Mật khẩu xác nhận không khớp.");
  if (!await verifyPassword(current, user.passwordHash)) throw new AuthError("Mật khẩu hiện tại không đúng.");
  if (password === current) throw new AuthError("Mật khẩu mới phải khác mật khẩu hiện tại.");
  const updated = await users.changeUserPassword(user, await hashPassword(password), adminEmail);
  if (!updated) throw new AuthError("Mật khẩu vừa được thay đổi ở một phiên khác. Vui lòng đăng nhập lại.");
  // authVersion invalidates every old session and the reset link; keep this browser signed in.
  try { await openAccountSession(updated); }
  catch { return { ok: true, message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.", redirectTo: "/?auth=login&next=/account" }; }
  return { ok: true, message: "Đã đổi mật khẩu. Các phiên đăng nhập cũ đã được thu hồi." };
}

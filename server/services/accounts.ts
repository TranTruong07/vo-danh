import "server-only";
import { randomBytes } from "node:crypto";
import { AuthError, normalizeEmail, validateAuthInput, type AuthInput, type AuthMode, type AuthResult } from "@/server/domain/auth";
import { hashPassword, verifyPassword, equalSecret, hashToken } from "@/server/infrastructure/password";
import { resetMailConfiguration, sendPasswordResetEmail } from "@/server/infrastructure/reset-email";
import * as users from "@/server/repositories/users";
import { configuredAdmin, openAccountSession, publicUser } from "./account-session";
import { rollbackAccountAvatar, uploadAccountAvatar } from "./account-avatar";

const FORGOT_MESSAGE = "Nếu email có tài khoản phù hợp, hướng dẫn đặt lại mật khẩu sẽ được gửi. Vui lòng kiểm tra hộp thư.";

export async function limitAttempts(mode: AuthMode | "profile" | "password", identity: string) {
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const record = await users.recordAuthAttempt(hashToken(`${mode}:${identity}:${window}`), new Date((window + 1) * windowMs));
  if (!record || record.count > (mode === "forgot" ? 3 : 15)) throw new AuthError("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.");
}

export async function handleAccountAction(mode: AuthMode, input: AuthInput, avatarFile?: File): Promise<AuthResult> {
  const errors = validateAuthInput(mode, input);
  if (errors) return { ok: false, message: "Vui lòng kiểm tra thông tin đã nhập.", errors };
  const email = normalizeEmail(input.email);
  const admin = configuredAdmin();
  const reservedAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  await limitAttempts(mode, mode === "reset" ? hashToken(input.token) : email);

  if (mode === "register") {
    if (email === reservedAdminEmail) throw new AuthError("Email này không thể đăng ký. Vui lòng đăng nhập hoặc dùng email khác.");
    if (await users.findUserByEmail(email)) throw new AuthError("Email đã được đăng ký. Vui lòng đăng nhập hoặc chọn quên mật khẩu.");
    let user;
    const avatar = await uploadAccountAvatar(avatarFile);
    try { user = await users.createUser(email, await hashPassword(input.password), avatar?.url); }
    catch (error) {
      await rollbackAccountAvatar(avatar);
      if (error && typeof error === "object" && "code" in error && error.code === 11000) throw new AuthError("Email đã được đăng ký. Vui lòng đăng nhập.");
      throw error;
    }
    await openAccountSession(user);
    return { ok: true, message: "Đăng ký thành công.", user: publicUser(user) };
  }
  if (mode === "login") {
    let user;
    if (email === reservedAdminEmail) {
      if (!admin || !equalSecret(input.password, admin.password)) throw new AuthError("Email hoặc mật khẩu không đúng.");
      user = await users.provisionAdmin(email, await hashPassword(input.password));
    } else {
      user = await users.findUserByEmail(email);
      // Do password work for absent users as well, to reduce email probing by timing.
      if (!user) { await hashPassword(input.password); throw new AuthError("Email hoặc mật khẩu không đúng."); }
      if (user.role !== "user" || !await verifyPassword(input.password, user.passwordHash)) throw new AuthError("Email hoặc mật khẩu không đúng.");
    }
    if (!user) throw new AuthError("Không thể đăng nhập. Vui lòng thử lại.");
    await openAccountSession(user);
    return { ok: true, message: "Đăng nhập thành công.", user: publicUser(user), ...(user.role === "admin" ? { redirectTo: "/admin" } : {}) };
  }
  if (mode === "forgot") {
    resetMailConfiguration();
    const user = await users.findUserByEmail(email);
    // Environment-managed admins change their password in server configuration.
    if (user?.role === "user" && email !== reservedAdminEmail) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);
      await users.setResetToken(user._id, tokenHash, new Date(Date.now() + 30 * 60 * 1000));
      try { await sendPasswordResetEmail(email, token); }
      catch {
        await users.clearResetToken(user._id, tokenHash);
        throw new AuthError("Không thể gửi email lúc này. Vui lòng thử lại sau.");
      }
    }
    return { ok: true, message: FORGOT_MESSAGE };
  }
  if (!/^[a-f0-9]{64}$/.test(input.token)) throw new AuthError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
  const user = await users.consumeResetToken(hashToken(input.token), await hashPassword(input.password), reservedAdminEmail);
  if (!user) throw new AuthError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
  return { ok: true, message: "Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới." };
}

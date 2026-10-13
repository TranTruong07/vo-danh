export type AuthMode = "login" | "register" | "forgot" | "reset";
export type UserRole = "user" | "admin";
export const DEFAULT_AVATAR = "/images/default-avatar.svg";
export interface UserProfile { fullName: string; phone: string; address: string; avatarUrl: string }
export interface PublicUser extends UserProfile { userId: string; email: string; role: UserRole }
export type AuthField = "email" | "password" | "confirmPassword";
export interface AuthResult {
  ok: boolean;
  message: string;
  errors?: Partial<Record<AuthField, string>>;
  user?: PublicUser;
  redirectTo?: string;
}
export interface AuthInput { email: string; password: string; confirmPassword: string; token: string }

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: string) => email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email) && !email.split("@")[0].startsWith(".") && !email.split("@")[0].endsWith(".") && !email.includes("..");
export const validPassword = (password: string) => password.length >= 6 && password.length <= 32;

export function validateAuthInput(mode: AuthMode, value: AuthInput): AuthResult["errors"] {
  const errors: NonNullable<AuthResult["errors"]> = {};
  if (mode !== "reset" && !validEmail(normalizeEmail(value.email))) errors.email = "Vui lòng nhập email hợp lệ.";
  if (mode !== "forgot" && !validPassword(value.password)) errors.password = "Mật khẩu phải dài từ 6 đến 32 ký tự.";
  if ((mode === "register" || mode === "reset") && value.password !== value.confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  return Object.keys(errors).length ? errors : undefined;
}

export class AuthError extends Error {
  constructor(message: string) { super(message); this.name = "AuthError"; }
}

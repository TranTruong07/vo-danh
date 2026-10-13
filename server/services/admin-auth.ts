import "server-only";
import { currentAccount } from "./account-session";

export async function hasAdminSession() {
  return (await currentAccount())?.role === "admin";
}

export async function requireAdmin() {
  if (!await hasAdminSession()) throw new Error("Bạn cần đăng nhập bằng tài khoản admin để thực hiện thao tác này.");
}

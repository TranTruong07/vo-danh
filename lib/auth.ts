import "server-only";
import { currentAccount } from "@/server/services/account-session";
import type { PublicUser } from "@/server/domain/auth";

export type UserSession = PublicUser;
export const getCurrentSession = currentAccount;

export async function requireAuth(): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session) throw new Error("Unauthorized: Yêu cầu đăng nhập");
  return session;
}

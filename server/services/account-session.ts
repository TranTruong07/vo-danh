import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { hashToken } from "@/server/infrastructure/password";
import { deleteSession, findSession, findUserById, saveSession } from "@/server/repositories/users";
import type { UserModel } from "@/server/models/user";
import { DEFAULT_AVATAR, normalizeEmail, validEmail, validPassword, type PublicUser } from "@/server/domain/auth";

const COOKIE = "vo_danh_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function configuredAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_PASSWORD ?? "";
  return validEmail(email) && validPassword(password) ? { email, password, fingerprint: hashToken(`${email}\0${password}`) } : null;
}

export function publicUser(user: UserModel): PublicUser {
  return { userId: user._id.toHexString(), email: user.email, role: user.role,
    fullName: user.fullName ?? "", phone: user.phone ?? "", address: user.address ?? "", avatarUrl: user.avatarUrl || DEFAULT_AVATAR };
}

export async function openAccountSession(user: UserModel) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const admin = configuredAdmin();
  await saveSession({ _id: hashToken(token), userId: user._id, authVersion: user.authVersion, createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_SECONDS * 1000),
    ...(user.role === "admin" && admin ? { adminConfigHash: admin.fingerprint } : {}),
  });
  const jar = await cookies();
  const previous = jar.get(COOKIE)?.value;
  if (previous) await deleteSession(hashToken(previous));
  jar.delete("vo_danh_admin");
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS });
}

export const currentAccount = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await findSession(hashToken(token));
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user || user.authVersion !== session.authVersion) return null;
  const admin = configuredAdmin();
  if (user.role === "admin" && (!admin || user.email !== admin.email || session.adminConfigHash !== admin.fingerprint)) return null;
  if (user.role !== "admin" && admin?.email === user.email) return null;
  return publicUser(user);
});

export async function closeAccountSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  try { if (token) await deleteSession(hashToken(token)); }
  finally { jar.delete(COOKIE); jar.delete("vo_danh_admin"); }
}

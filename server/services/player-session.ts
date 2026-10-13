import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { hashToken } from "@/server/infrastructure/password";
import { GameError } from "@/server/domain/character";
export async function playerSession(create: boolean) {
  const jar = await cookies();
  let token = jar.get("history_player")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) throw new GameError("Phiên chơi đã hết hạn. Hãy quét lại mã QR.");
    token = randomBytes(32).toString("hex");
  }
  if (create) jar.set("history_player", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86400 });
  return hashToken(token);
}

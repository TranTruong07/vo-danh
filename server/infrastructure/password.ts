import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const equalSecret = (a: string, b: string) => timingSafeEqual(Buffer.from(hashToken(a), "hex"), Buffer.from(hashToken(b), "hex"));

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => error ? reject(error) : resolve(key)));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hash, extra] = encoded.split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "") || extra) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, "hex"));
}

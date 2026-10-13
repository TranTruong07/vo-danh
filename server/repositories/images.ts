import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET, R2_PUBLIC_BASE_URL } from "@/server/infrastructure/r2";
import { GameError } from "@/server/domain/character";

async function uploadImage(bytes: Buffer, folder: "characters" | "avatars") {
  let base: URL;
  try { base = new URL(R2_PUBLIC_BASE_URL); }
  catch { throw new GameError("Chưa cấu hình R2_PUBLIC_BASE_URL cho ảnh."); }
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) throw new GameError("R2_PUBLIC_BASE_URL phải là địa chỉ HTTPS công khai của bucket, không kèm query.");
  const key = `images/${folder}/${randomUUID()}.webp`;
  const url = `${R2_PUBLIC_BASE_URL}/${key}`;
  try {
    await getR2Client().send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: bytes, ContentLength: bytes.length, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(25000) });
    return { key, url };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (["AccessDenied", "Forbidden", "InvalidAccessKeyId", "SignatureDoesNotMatch"].includes(name)) throw new GameError("R2 từ chối upload ảnh. Kiểm tra API token có quyền ghi đúng bucket.");
    if (name === "NoSuchBucket") throw new GameError("Không tìm thấy bucket ảnh. Kiểm tra R2_BUCKET.");
    throw new GameError("Không upload được ảnh lên R2. Kiểm tra cấu hình R2 và kết nối rồi thử lại.");
  }
}

export const uploadCharacterImage = (bytes: Buffer) => uploadImage(bytes, "characters");
export const uploadAvatarImage = (bytes: Buffer) => uploadImage(bytes, "avatars");

// Only used to roll back a newly uploaded, unreferenced object after a failed save.
export async function discardUncommittedImage(key: string) {
  if (!/^images\/(?:characters|avatars)\/[a-f0-9-]{36}\.webp$/.test(key)) throw new Error("Invalid image cleanup key.");
  await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }), { abortSignal: AbortSignal.timeout(10000) });
}

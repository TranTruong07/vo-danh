import "server-only";
import { AuthError } from "@/server/domain/auth";
import { GameError } from "@/server/domain/character";
import { MAX_IMAGE_BYTES } from "@/server/domain/image";
import { prepareCharacterImage } from "@/server/infrastructure/character-image";
import { discardUncommittedImage, uploadAvatarImage } from "@/server/repositories/images";
import { isUserAvatarReferenced } from "@/server/repositories/users";

export async function uploadAccountAvatar(file?: File) {
  // Browsers/Server Actions may submit a zero-byte File even when nothing was selected.
  if (!file?.size) return undefined;
  if (file.size > MAX_IMAGE_BYTES) throw new AuthError("Ảnh đại diện phải có dung lượng từ 1 byte đến 3 MB.");
  try {
    const bytes = await prepareCharacterImage(Buffer.from(await file.arrayBuffer()));
    return await uploadAvatarImage(bytes);
  } catch (error) {
    if (error instanceof GameError) throw new AuthError(error.message);
    throw error;
  }
}

export async function rollbackAccountAvatar(image?: { key: string; url: string }) {
  if (!image) return;
  // An ambiguous DB write may have succeeded. Never remove a referenced image.
  try { if (!await isUserAvatarReferenced(image.url)) await discardUncommittedImage(image.key); }
  catch { /* Retain the object if we cannot confirm it is unused. */ }
}

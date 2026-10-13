import "server-only";
import { requireAdmin } from "./admin-auth";
import { DEFAULT_CHARACTER_BACKGROUND, GameError, isCharacterId, validateCharacter } from "@/server/domain/character";
import * as repository from "@/server/repositories/characters";
import { prepareCharacterImage } from "@/server/infrastructure/character-image";
import { uploadCharacterImage, discardUncommittedImage } from "@/server/repositories/images";
import { MAX_IMAGE_BYTES, MAX_IMAGE_LABEL } from "@/server/domain/image";
import { hasCharacterQuestions } from "@/server/repositories/character-questions";

export async function loadAdminCharacters(page: number, search: string) {
  await requireAdmin();
  return repository.listCharacters(page, search);
}

export async function loadAdminCharacter(id: string) {
  await requireAdmin();
  const row = await repository.findCharacter(id);
  return row ? repository.characterRecord(row) : null;
}

export async function saveCharacterForm(id: string | null, form: FormData) {
  await requireAdmin();
  if (id !== null && !isCharacterId(id)) throw new GameError("Mã nhân vật không hợp lệ.");
  const value = (key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
  const existing = id ? await repository.findCharacter(id) : null;
  if (id && !existing) throw new GameError("Nhân vật không còn tồn tại.");
  const images = { image: "", backgroundImage: "" };
  const prepared: Partial<Record<keyof typeof images, Buffer>> = {};
  for (const field of ["image", "backgroundImage"] as const) {
    let image = value(field);
    const upload = form.get(`${field}File`);
    if (upload instanceof File && upload.size) {
      if (upload.size > MAX_IMAGE_BYTES) throw new GameError(`Mỗi ảnh không được quá ${MAX_IMAGE_LABEL}.`);
      prepared[field] = await prepareCharacterImage(Buffer.from(await upload.arrayBuffer()));
      image = "/images/pending-upload.webp";
    } else if (image === "__keep__" && existing) {
      image = existing[field] || (field === "backgroundImage" ? DEFAULT_CHARACTER_BACKGROUND : "");
      if (image.startsWith("data:")) {
        if (image.length > 710000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) throw new GameError("Ảnh cũ không hợp lệ. Vui lòng chọn ảnh mới.");
        prepared[field] = await prepareCharacterImage(Buffer.from(image.slice(image.indexOf(",") + 1), "base64"));
        image = "/images/pending-upload.webp";
      }
    } else if (image.startsWith("data:")) {
      throw new GameError("Vui lòng dùng nút tải ảnh lên.");
    }
    images[field] = image;
  }
  const data = validateCharacter({ name: value("name"), openingLine: value("openingLine"), ...images });
  const uploaded: { key: string; url: string }[] = [];
  try {
    for (const field of ["image", "backgroundImage"] as const) {
      const bytes = prepared[field];
      if (!bytes) continue;
      const object = await uploadCharacterImage(bytes);
      uploaded.push(object);
      data[field] = object.url;
    }
    const row = await repository.saveCharacter(id, data);
    if (!row) throw new GameError("Nhân vật không còn tồn tại.");
    return repository.characterRecord(row);
  } catch (error) {
    for (const object of uploaded) {
      try {
        // A write may have committed even if its response was lost. Never delete a referenced image.
        if (!await repository.isCharacterImageReferenced(object.url)) await discardUncommittedImage(object.key);
      } catch { console.warn("Không thể xác nhận/dọn ảnh R2 sau khi lưu nhân vật lỗi."); }
    }
    throw error;
  }
}
export async function removeCharacter(id: string) {
  await requireAdmin();
  if (!isCharacterId(id)) throw new GameError("Mã nhân vật không hợp lệ.");
  if (await hasCharacterQuestions(id)) throw new GameError("Nhân vật còn câu hỏi. Hãy xóa hoặc chuyển các câu hỏi sang nhân vật khác trước.");
  await repository.deleteCharacter(id);
}

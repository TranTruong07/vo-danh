import "server-only";
import sharp from "sharp";
import { GameError } from "@/server/domain/character";
import { MAX_IMAGE_BYTES, MAX_IMAGE_LABEL } from "@/server/domain/image";

export async function prepareCharacterImage(bytes: Buffer): Promise<Buffer> {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new GameError(`Ảnh phải có dung lượng từ 1 byte đến ${MAX_IMAGE_LABEL}.`);
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000, failOn: "warning", animated: false });
    const meta = await image.metadata();
    if (!meta.format || !["png", "jpeg", "webp"].includes(meta.format) || (meta.pages ?? 1) > 1) throw new GameError("Chỉ nhận ảnh tĩnh PNG, JPEG hoặc WebP.");
    // Decode and re-encode: discard metadata and reject corrupt/disguised files.
    const result = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (result.length > MAX_IMAGE_BYTES) throw new GameError("Ảnh sau tối ưu vẫn quá lớn. Hãy chọn ảnh nhỏ hơn.");
    return result;
  } catch (error) {
    if (error instanceof GameError) throw error;
    throw new GameError("Không đọc được ảnh. Hãy dùng ảnh PNG, JPEG hoặc WebP hợp lệ, không quá 20 triệu điểm ảnh.");
  }
}

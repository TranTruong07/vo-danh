import { SettingsError } from "./settings";

export interface ProductImage { url: string; description: string }
export interface ProductContent {
  name: string;
  headline: string;
  summary: string;
  mainImage: string;
  gallery: ProductImage[];
  tags: string[];
  description: string;
  players: string;
  ageRange: string;
  playTime: string;
  boxContents: string;
}
export interface CatalogProduct extends ProductContent { price: number; ready: boolean }
export const DEFAULT_PRODUCT: ProductContent = {
  name: "Board game Dấu Chân Sử Ký", headline: "Mang lịch sử lên bàn chơi.",
  summary: "Cùng bạn bè khám phá câu chuyện của cha ông qua từng lượt chơi. Kết hợp trải nghiệm trên bàn, mã QR và câu hỏi về nhân vật để mỗi câu hỏi đều mở ra một điều thú vị.",
  mainImage: "/images/history-landscape.webp", gallery: [],
  tags: ["Học sinh THCS", "Chơi cùng bạn bè", "Tích hợp MÃ QR"],
  description: "", players: "", ageRange: "", playTime: "", boxContents: "",
};
export const MAX_PRODUCT_GALLERY = 5;

// Read legacy URL-only galleries without mutating or discarding stored records.
export function readProductGallery(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (typeof item === "string" && item) return [{ url: item, description: "" }];
    if (item && typeof item === "object" && typeof item.url === "string" && item.url)
      return [{ url: item.url, description: typeof item.description === "string" ? item.description : "" }];
    return [];
  });
}

export function validateProductContent(input: unknown): ProductContent {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new SettingsError("Thông tin sản phẩm không hợp lệ.");
  const data = input as Record<string, unknown>;
  const text = (key: string, label: string, max: number, required = false) => {
    const value = data[key];
    if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw new SettingsError(`${label}: ${required ? "vui lòng nhập nội dung, " : ""}tối đa ${max} ký tự.`);
    return value.trim();
  };
  const gallery = data.gallery, tags = data.tags;
  if (!Array.isArray(gallery) || gallery.length > MAX_PRODUCT_GALLERY || gallery.some(image => !image || typeof image !== "object" || typeof image.url !== "string" || !image.url || image.url.length > 2000 || typeof image.description !== "string" || image.description.trim().length > 500)) throw new SettingsError("Chọn tối đa 5 ảnh phụ; mô tả mỗi ảnh tối đa 500 ký tự.");
  if (new Set(gallery.map(image => image.url)).size !== gallery.length) throw new SettingsError("Các ảnh phụ phải khác nhau.");
  if (!Array.isArray(tags) || tags.length > 6 || tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.trim().length > 50)) throw new SettingsError("Nhập tối đa 6 đặc điểm, mỗi đặc điểm không quá 50 ký tự.");
  return { name: text("name", "Tên sản phẩm", 120, true), headline: text("headline", "Tiêu đề home", 120, true), summary: text("summary", "Mô tả ngắn", 1000, true),
    mainImage: text("mainImage", "Ảnh chính", 2000, true), gallery: gallery.map(image => ({ url: image.url, description: image.description.trim() })), tags: [...new Set(tags.map(tag => tag.trim()))],
    description: text("description", "Mô tả chi tiết", 12000), players: text("players", "Số người chơi", 80), ageRange: text("ageRange", "Độ tuổi", 80), playTime: text("playTime", "Thời gian chơi", 80), boxContents: text("boxContents", "Thành phần bộ game", 4000) };
}

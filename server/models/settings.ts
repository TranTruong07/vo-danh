import type { ProductContent } from "@/server/domain/product";

export interface ShopSettingsModel {
  _id: "shop";
  productPrice: number;
  product?: ProductContent;
  updatedAt: Date;
}

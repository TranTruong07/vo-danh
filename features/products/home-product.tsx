"use client";

import Image from "next/image";
import { PurchaseButton } from "@/components/heritage/purchase-button";
import { usePwa } from "@/features/pwa/pwa-provider";
import { money } from "@/server/domain/order";
import { DEFAULT_PRODUCT, type CatalogProduct } from "@/server/domain/product";

export default function HomeProduct({ initial, offline }: { initial: CatalogProduct; offline: boolean }) {
  const { pack, online } = usePwa();
  const product = (offline || !online) && pack?.product ? pack.product : initial;
  return <section className="section-wrap product-section" id="san-pham">
    <div className="product-main-visual"><Image src={product.mainImage || DEFAULT_PRODUCT.mainImage} alt={product.name} fill unoptimized sizes="(max-width:760px) 100vw, 50vw" /></div>
    <div className="product-copy"><p className="eyebrow">MỘT HỘP NHỎ, CẢ HÀNH TRÌNH LỚN</p><h2>{product.headline}</h2><h3>{product.name}</h3><p>{product.summary}</p>
      {!!product.tags.length && <div className="product-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
      <div className="product-purchase"><div><span>GIÁ BÁN</span><strong>{product.ready ? money(product.price) : "Đang cập nhật"}</strong></div><PurchaseButton /></div>
      <p className="product-note">Một món quà khơi gợi sự tò mò và tình yêu lịch sử.</p>
    </div>
  </section>;
}

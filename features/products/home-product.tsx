"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePwa } from "@/features/pwa/pwa-provider";
import { money } from "@/server/domain/order";
import { DEFAULT_PRODUCT, type CatalogProduct } from "@/server/domain/product";
import { calculateOriginalPrice } from "@/server/domain/settings";

export default function HomeProduct({ initial, offline }: { initial: CatalogProduct; offline: boolean }) {
  const { pack, online } = usePwa();
  const product = (offline || !online) && pack?.product ? pack.product : initial;
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || "");

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
  const currentPrice = selectedVariant?.price ?? product.price;
  const originalPrice = calculateOriginalPrice(currentPrice, product.discountPercent);

  const checkoutHref = selectedVariant?.id
    ? `/checkout?variant=${encodeURIComponent(selectedVariant.id)}`
    : "/checkout";

  return <section className="section-wrap product-section" id="san-pham">
    <div className="product-main-visual"><Image src={product.mainImage || DEFAULT_PRODUCT.mainImage} alt={product.name} fill unoptimized sizes="(max-width:760px) 100vw, 50vw" /></div>
    <div className="product-copy"><p className="eyebrow">MỘT HỘP NHỎ, CẢ HÀNH TRÌNH LỚN</p><h2>{product.headline}</h2><h3>{product.name}</h3><p>{product.summary}</p>
      {!!product.tags.length && <div className="product-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
      
      {!!product.variants?.length && (
        <div className="product-variants-selection">
          <span className="product-variants-title">LOẠI SẢN PHẨM:</span>
          <div className="product-variants-options" role="radiogroup" aria-label="Chọn loại sản phẩm">
            {product.variants.map((v, idx) => {
              const isSelected = v.id === (selectedVariant?.id || product.variants[0].id);
              return (
                <button
                  key={v.id || idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`product-variant-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedVariantId(v.id)}
                >
                  <span className="option-name">{v.name}</span>
                  {v.price && v.price !== product.price && (
                    <span className="option-price">{money(v.price)}</span>
                  )}
                </button>
              );
            })}
          </div>
          {selectedVariant?.description && (
            <p className="product-variant-description">{selectedVariant.description}</p>
          )}
        </div>
      )}

      <div className="product-purchase">
        <div className="product-price-block">
          <span className="product-price-label">GIÁ BÁN</span>
          <div className="product-price-row">
            <strong className="product-current-price">{product.ready ? money(currentPrice) : "Đang cập nhật"}</strong>
            {product.ready && product.discountPercent > 0 && (
              <>
                <span className="product-original-price">{money(originalPrice)}</span>
                <span className="product-discount-badge">GIẢM {product.discountPercent}%</span>
              </>
            )}
          </div>
        </div>
        <Link className="heritage-button primary" href={checkoutHref}>
          Mua ngay <span aria-hidden="true">→</span>
        </Link>
      </div>
      <p className="product-note">Một món quà khơi gợi sự tò mò và tình yêu lịch sử.</p>
    </div>
  </section>;
}

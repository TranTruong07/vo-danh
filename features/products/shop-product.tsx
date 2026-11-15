"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/server/domain/order";
import type { CatalogProduct } from "@/server/domain/product";
import { calculateOriginalPrice } from "@/server/domain/settings";
import ProductGallery from "./product-gallery";
import "./shop-product.css";

export default function ShopProduct({ product }: { product: CatalogProduct }) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || "");
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
  const currentPrice = selectedVariant?.price ?? product.price;
  const originalPrice = calculateOriginalPrice(currentPrice, product.discountPercent);

  const checkoutHref = selectedVariant?.id
    ? `/checkout?variant=${encodeURIComponent(selectedVariant.id)}`
    : "/checkout";

  const specifications = [["Số người chơi", product.players], ["Độ tuổi", product.ageRange], ["Thời gian chơi", product.playTime]].filter(([, value]) => value);
  return <>
    <section className="section-wrap product-section shop-product" id="san-pham">
      <ProductGallery name={product.name} mainImage={product.mainImage} gallery={product.gallery} />
      <div className="product-copy">
        <p className="eyebrow">MỘT HỘP NHỎ, CẢ HÀNH TRÌNH LỚN</p>
        <h2>{product.headline}</h2><h3>{product.name}</h3><p>{product.summary}</p>
        {!!product.tags.length && <div className="product-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
        {!!specifications.length && <dl className="shop-specifications">{specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        
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
    </section>
    {(product.description || product.boxContents) && <section className="section-wrap shop-configured-details" aria-label="Thông tin sản phẩm">
      {product.description && <article><h2>Về sản phẩm</h2><p>{product.description}</p></article>}
      {product.boxContents && <article><h2>Trong hộp có gì?</h2><p>{product.boxContents}</p></article>}
    </section>}
  </>;
}

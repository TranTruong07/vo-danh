import { PurchaseButton } from "@/components/heritage/purchase-button";
import { money } from "@/server/domain/order";
import type { CatalogProduct } from "@/server/domain/product";
import ProductGallery from "./product-gallery";
import "./shop-product.css";

export default function ShopProduct({ product }: { product: CatalogProduct }) {
  const specifications = [["Số người chơi", product.players], ["Độ tuổi", product.ageRange], ["Thời gian chơi", product.playTime]].filter(([, value]) => value);
  return <>
    <section className="section-wrap product-section shop-product" id="san-pham">
      <ProductGallery name={product.name} mainImage={product.mainImage} gallery={product.gallery} />
      <div className="product-copy">
        <p className="eyebrow">MỘT HỘP NHỎ, CẢ HÀNH TRÌNH LỚN</p>
        <h2>{product.headline}</h2><h3>{product.name}</h3><p>{product.summary}</p>
        {!!product.tags.length && <div className="product-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
        {!!specifications.length && <dl className="shop-specifications">{specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <div className="product-purchase"><div><span>GIÁ BÁN</span><strong>{product.ready ? money(product.price) : "Đang cập nhật"}</strong></div><PurchaseButton /></div>
        <p className="product-note">Một món quà khơi gợi sự tò mò và tình yêu lịch sử.</p>
      </div>
    </section>
    {(product.description || product.boxContents) && <section className="section-wrap shop-configured-details" aria-label="Thông tin sản phẩm">
      {product.description && <article><h2>Về sản phẩm</h2><p>{product.description}</p></article>}
      {product.boxContents && <article><h2>Trong hộp có gì?</h2><p>{product.boxContents}</p></article>}
    </section>}
  </>;
}

"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_PRODUCT, MAX_PRODUCT_GALLERY, type ProductImage } from "@/server/domain/product";

export default function ProductGallery({ name, mainImage, gallery }: { name: string; mainImage: string; gallery: ProductImage[] }) {
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), title = useId();
  const [open, setOpen] = useState(false), [active, setActive] = useState(0);
  const images = [{ url: mainImage || DEFAULT_PRODUCT.mainImage, description: name }, ...gallery.slice(0, MAX_PRODUCT_GALLERY)];
  const selected = images[active] || images[0];
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function show() { setActive(0); setOpen(true); dialog.current?.showModal(); }
  function close() { dialog.current?.close(); }
  function step(direction: number) { setActive(current => (current + direction + images.length) % images.length); }

  return <div className="shop-gallery">
    <button ref={trigger} type="button" className="shop-gallery-trigger product-main-visual" onClick={show} aria-haspopup="dialog" aria-label={`Xem ảnh sản phẩm ${name}`}>
      <Image src={images[0].url} alt={name} fill unoptimized sizes="(max-width:760px) 100vw, 50vw" />
      <span className="shop-gallery-hint">{gallery.length ? "Bấm để khám phá bộ ảnh sản phẩm ↗" : "Bấm để xem ảnh lớn ↗"}</span>
    </button>
    <dialog ref={dialog} className="product-gallery-dialog" aria-labelledby={title} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); step(event.key === "ArrowRight" ? 1 : -1); }
    }}>
      {open && <div className="product-gallery-content">
        <header className="product-gallery-header"><div><p className="eyebrow">KHÁM PHÁ TỪNG CHI TIẾT</p><h2 id={title}>{name}</h2></div><button type="button" className="gallery-close" onClick={close} aria-label="Đóng bộ ảnh">×</button></header>
        <div className={`product-gallery-stage${images.length === 1 ? " is-single" : ""}`}>
          <figure className="product-gallery-featured"><div className="gallery-large-image"><Image src={selected.url} alt={active ? `Ảnh chi tiết ${active} của ${name}` : name} fill unoptimized sizes="(max-width:700px) 90vw, 480px" /></div><figcaption aria-live="polite">{selected.description || `Ảnh chi tiết ${active}`}</figcaption></figure>
          {images.slice(1).map((image, index) => <figure key={image.url} className={`product-gallery-card card-${index + 1}`}>
            <button type="button" onClick={() => setActive(index + 1)} aria-label={`Xem ảnh phụ ${index + 1}`} aria-pressed={active === index + 1}><span className="gallery-card-number">{String(index + 1).padStart(2, "0")}</span><Image src={image.url} alt={`Ảnh phụ ${index + 1} của ${name}`} width={240} height={180} unoptimized /></button>
            {image.description && <figcaption>{image.description}</figcaption>}
          </figure>)}
        </div>
        {images.length > 1 && <nav className="product-gallery-navigation" aria-label="Chọn ảnh sản phẩm"><button type="button" onClick={() => step(-1)} aria-label="Ảnh sản phẩm trước">‹</button><div className="product-gallery-thumbnails">{images.map((image, index) => <button key={index} type="button" onClick={() => setActive(index)} aria-label={index ? `Chọn ảnh phụ ${index}` : "Chọn ảnh chính"} aria-current={active === index ? "true" : undefined}><Image src={image.url} alt="" width={76} height={60} unoptimized /></button>)}</div><button type="button" onClick={() => step(1)} aria-label="Ảnh sản phẩm tiếp theo">›</button></nav>}
      </div>}
    </dialog>
  </div>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProductAction, uploadProductPhotoAction } from "@/actions/products";
import { MAX_PRODUCT_GALLERY, type CatalogProduct } from "@/server/domain/product";
import { MAX_IMAGE_BYTES } from "@/server/domain/image";
import { money } from "@/server/domain/order";

export default function ProductEditor({ initial }: { initial: CatalogProduct }) {
  const router = useRouter(), lock = useRef(false);
  const [mainImage, setMainImage] = useState(initial.mainImage), [gallery, setGallery] = useState(initial.gallery);
  const [price, setPrice] = useState(initial.ready ? String(initial.price) : "");
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [message, setMessage] = useState("");

  async function upload(files: FileList | null, main: boolean) {
    if (!files?.length || lock.current) return;
    const selected = Array.from(files);
    setError(""); setMessage("");
    if ((main && selected.length !== 1) || (!main && gallery.length + selected.length > MAX_PRODUCT_GALLERY)) { setError("Chọn 1 ảnh chính hoặc tối đa 5 ảnh phụ."); return; }
    if (selected.some(file => file.size > MAX_IMAGE_BYTES || !file.size)) { setError("Mỗi ảnh phải có dung lượng từ 1 byte đến 3 MB."); return; }
    lock.current = true;
    try {
      for (const [index, file] of selected.entries()) {
        setBusy(`Đang tải ảnh ${index + 1}/${selected.length}…`);
        const form = new FormData(); form.set("file", file);
        const result = await uploadProductPhotoAction(form);
        if (!result.ok) throw new Error(result.message);
        if (main) setMainImage(result.data.url); else setGallery(current => [...current, { url: result.data.url, description: "" }]);
      }
      setMessage("Ảnh đã tải lên. Bấm Lưu sản phẩm để áp dụng lên website.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa tải được ảnh. Vui lòng thử lại."); }
    finally { lock.current = false; setBusy(""); }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const form = new FormData(event.currentTarget), text = (key: string) => String(form.get(key) || "");
    form.set("product", JSON.stringify({ name: text("name"), headline: text("headline"), summary: text("summary"), mainImage, gallery,
      tags: text("tags").split("\n").map(tag => tag.trim()).filter(Boolean), description: text("description"), players: text("players"), ageRange: text("ageRange"), playTime: text("playTime"), boxContents: text("boxContents") }));
    lock.current = true; setBusy("Đang lưu sản phẩm…"); setError(""); setMessage("");
    try {
      const result = await saveProductAction(form);
      if (!result.ok) throw new Error(result.message);
      setMessage("Đã lưu sản phẩm. Home và giá bán đã cập nhật; các đơn hàng cũ giữ nguyên giá."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không lưu được. Vui lòng kiểm tra kết nối."); }
    finally { lock.current = false; setBusy(""); }
  }
  function moveImage(index: number, direction: number) {
    setGallery(current => { const next = [...current]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next; });
  }
  return <form className="product-editor" onSubmit={save} aria-busy={!!busy}>
    <fieldset disabled={!!busy}>
      <section className="card"><h2>Thông tin hiển thị trên home</h2><p className="subtitle">Ảnh chính, tên, mô tả, đặc điểm và giá bán sẽ xuất hiện ở phần sản phẩm.</p>
        <label>Tên sản phẩm<input name="name" defaultValue={initial.name} maxLength={120} required /></label>
        <div className="product-editor-grid"><label>Giá bán (VND)<input name="price" type="number" inputMode="numeric" min={1000} max={100000000} step={1} required value={price} onChange={event => setPrice(event.target.value)} /><small>{price && Number.isSafeInteger(Number(price)) ? money(Number(price)) : "Nhập số nguyên, không thêm dấu phân cách."}</small></label><label>Tiêu đề giới thiệu<input name="headline" defaultValue={initial.headline} maxLength={120} required /></label></div>
        <label>Mô tả ngắn<textarea name="summary" defaultValue={initial.summary} rows={4} maxLength={1000} required /></label>
        <label>Đặc điểm nổi bật<textarea name="tags" defaultValue={initial.tags.join("\n")} rows={3} maxLength={305} /><small>Mỗi dòng một đặc điểm. Tối đa 6 dòng, 50 ký tự/dòng.</small></label>
      </section>
      <section className="card"><h2>Ảnh sản phẩm</h2><p className="subtitle">PNG, JPEG hoặc WebP, tối đa 3 MB/ảnh. Ảnh được lưu trên R2; thay đổi có hiệu lực sau khi lưu sản phẩm.</p>
        <div className="product-editor-grid"><div><h3>Ảnh chính</h3><Image className="product-main-preview" src={mainImage} alt="Ảnh chính sản phẩm" width={560} height={420} unoptimized /><label>Thay ảnh chính<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void upload(event.target.files, true); event.target.value = ""; }} /></label></div>
          <div><h3>Ảnh phụ ({gallery.length}/{MAX_PRODUCT_GALLERY})</h3><p className="subtitle">Hiện khi khách bấm ảnh chính trên trang chi tiết. Có thể viết mô tả và sắp xếp thứ tự ảnh.</p>
            {gallery.length > MAX_PRODUCT_GALLERY && <p className="msg error">Sản phẩm cũ có hơn 5 ảnh phụ. Hãy chọn bỏ ảnh không cần dùng trước khi lưu; ảnh trên R2 vẫn được giữ lại.</p>}
            <div className="product-gallery-editor">{gallery.map((image, index) => <div key={image.url}><Image src={image.url} alt={`Ảnh phụ ${index + 1}`} width={200} height={150} unoptimized /><label>Mô tả ảnh phụ {index + 1}<textarea rows={3} maxLength={500} value={image.description} onChange={event => { const description = event.target.value; setGallery(current => current.map(item => item.url === image.url ? { ...item, description } : item)); }} /><small>Tối đa 500 ký tự.</small></label><div className="btn-row"><button type="button" className="btn" disabled={!index} onClick={() => moveImage(index, -1)} aria-label={`Chuyển ảnh ${index + 1} lên trước`}>←</button><button type="button" className="btn" disabled={index === gallery.length - 1} onClick={() => moveImage(index, 1)} aria-label={`Chuyển ảnh ${index + 1} ra sau`}>→</button><button type="button" className="btn danger" onClick={() => setGallery(current => current.filter(item => item.url !== image.url))}>Bỏ ảnh {index + 1}</button></div></div>)}</div>
            <label>Thêm ảnh phụ<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={gallery.length >= MAX_PRODUCT_GALLERY || !!busy} onChange={event => { void upload(event.target.files, false); event.target.value = ""; }} /></label>
          </div></div>
      </section>
      <section className="card"><h2>Thông tin chi tiết</h2><p className="subtitle">Hiển thị trên trang chi tiết sản phẩm. Các mục để trống sẽ được ẩn.</p>
        <div className="product-editor-grid"><label>Số người chơi<input name="players" defaultValue={initial.players} maxLength={80} placeholder="Ví dụ: 2–6 người" /></label><label>Độ tuổi phù hợp<input name="ageRange" defaultValue={initial.ageRange} maxLength={80} placeholder="Ví dụ: Từ 12 tuổi" /></label><label>Thời gian chơi<input name="playTime" defaultValue={initial.playTime} maxLength={80} placeholder="Ví dụ: 30–60 phút" /></label></div>
        <label>Mô tả chi tiết<textarea name="description" defaultValue={initial.description} rows={7} maxLength={12000} /></label>
        <label>Thành phần trong bộ game<textarea name="boxContents" defaultValue={initial.boxContents} rows={4} maxLength={4000} /></label>
      </section>
      <div className="btn-row"><button className="btn primary" type="submit">Lưu sản phẩm</button><Link className="btn" href="/#san-pham" target="_blank">Xem trên home ↗</Link></div>
    </fieldset>
    {busy && <p className="msg" role="status">{busy}</p>}{message && <p className="msg success" role="status">{message}</p>}{error && <p className="msg error" role="alert">{error}</p>}
  </form>;
}

import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { adminProduct } from "@/server/services/products";
import ProductEditor from "@/features/products/product-editor";
import "@/features/products/products.css";

export default async function ProductsPage() {
  if (!await hasAdminSession()) redirect("/?auth=login");
  return <><p className="dashboard-eyebrow">CỬA HÀNG</p><h1>Thiết lập sản phẩm</h1><p className="subtitle">Cập nhật sản phẩm hiển thị trên home và giá bán cho đơn hàng mới.</p><ProductEditor initial={await adminProduct()} /></>;
}

import type { Metadata } from "next";
import { ProductSection, SiteFooter, SiteHeader } from "@/components/heritage/site";

export const metadata: Metadata = { title: "Shop | Dấu Chân Sử Ký", description: "Khám phá board game lịch sử Dấu Chân Sử Ký, kết hợp câu hỏi nhân vật và mã QR dành cho học sinh THCS." };

export default function ShopPage() {
  return <div className="heritage"><SiteHeader active="shop" /><main id="main-content"><div className="shop-heading section-wrap"><p className="eyebrow">GÓC NHỎ CỦA NHỮNG NGƯỜI YÊU SỬ</p><h1>Một món quà.<br /><em>Ngàn câu chuyện.</em></h1><p>Chọn một hành trình khám phá để cùng chơi, cùng học và cùng nhớ.</p></div><ProductSection shop /><section className="section-wrap shop-details"><h2>Khám phá trước khi mở hộp</h2><details><summary>Board game dành cho ai?</summary><p>Dấu Chân Sử Ký hướng đến học sinh trung học cơ sở, cùng thầy cô, phụ huynh và những người muốn tìm hiểu lịch sử qua hoạt động tương tác.</p></details><details><summary>Mã QR giúp chơi như thế nào?</summary><p>Quét mã QR trên thẻ để gặp nhân vật và nhận một câu hỏi với bốn đáp án. Chọn đáp án để nhận phản hồi đúng hoặc sai. Muốn chơi câu tiếp theo, hãy quét lại mã QR.</p></details><details><summary>Làm thế nào để đặt mua?</summary><p>Chọn “Mua ngay”, đăng nhập và nhập thông tin nhận hàng. Bạn có thể thanh toán khi nhận hàng (COD) hoặc chuyển khoản qua payOS khi phương thức này sẵn sàng. Theo dõi đơn tại mục Đơn mua trong tài khoản.</p></details></section></main><SiteFooter /></div>;
}

import { OfflineShellSignal } from "@/features/pwa/pwa-provider";
import HeroSlideshow from "./hero-slideshow";
import Link from "next/link";
import { SiteHeader, SiteFooter, Arrow, Icon, ProductSection } from "@/components/heritage/site";
import type { AuthMode } from "@/server/domain/auth";

export default async function HomeView({ searchParams, offline = false }: { searchParams: Promise<{ auth?: string; token?: string }>; offline?: boolean }) {
  const query = await searchParams;
  const authMode = query.auth && ["login", "register", "forgot", "reset"].includes(query.auth) ? query.auth as AuthMode : undefined;
  return (
    <div className="heritage">
      {offline && <OfflineShellSignal />}
      <SiteHeader publicOnly={offline} active="home" initialAuthMode={authMode} resetToken={typeof query.token === "string" ? query.token : undefined} />
      <main id="main-content">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span /> MỘT CÁCH MỚI ĐỂ YÊU LỊCH SỬ</div>
            <h1 className="hero-headline">Đi từng bước -<br />Hiểu từng trang sử</h1>
            <p className="hero-description">Lịch sử không chỉ ở trong trang sách. Cùng Dấu Chân Sử Ký, biến mỗi lượt chơi thành một chuyến phiêu lưu về nguồn cội.</p>
            <div className="hero-actions">
              <Link className="heritage-button primary" href="/shop">Khám phá board game <Arrow /></Link>
              <Link className="heritage-button text-button" href="/play"><Icon name="qr" /> Quét thẻ để chơi <Arrow /></Link>
            </div>
          </div>
          <HeroSlideshow />
        </section>
        <div className="feature-ribbon"><div><Icon name="board" /><span>Chơi để khám phá</span></div><span className="ribbon-star">✦</span><div><Icon name="spark" /><span>Thử thách kiến thức</span></div><span className="ribbon-star">✦</span><div><Icon name="qr" /><span>Quét QR để kết nối</span></div></div>
        <section className="section-wrap about-section" id="cau-chuyen">
          <div className="section-heading"><div><p className="eyebrow">CÂU CHUYỆN CỦA CHÚNG MÌNH</p><h2>Khi lịch sử trở thành<br />một <em>cuộc phiêu lưu.</em></h2></div><p>Chúng mình là Dấu Chân Sử Ký — mang lịch sử đến gần hơn với học sinh trung học cơ sở qua board game và những thử thách từ mã QR.<br /><br />Để kiến thức được khám phá, câu chuyện được kể lại, và niềm tự hào được tiếp nối.</p></div>
          <div className="experience-grid">
            {[{number:"01", icon:"board" as const, title:"Chạm vào lịch sử", text:"Rời trang sách, bước vào bàn chơi. Khám phá những câu chuyện lịch sử qua từng thử thách và lựa chọn."}, {number:"02", icon:"spark" as const, title:"Chọn đáp án. Khám phá.", text:"Thử sức với câu hỏi về từng nhân vật. Chọn đáp án và nhận phản hồi để ghi nhớ kiến thức lịch sử."}, {number:"03", icon:"qr" as const, title:"Một lần quét, mở thế giới", text:"Kết nối bàn chơi với trải nghiệm số. Quét mã QR để gặp nhân vật và nhận một câu hỏi cho mỗi lượt chơi."}].map(item => <article className="experience-card" key={item.number}><div className="card-top"><Icon name={item.icon} /><span>{item.number}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}
          </div>
        </section>
        <ProductSection offline={offline} />
        <section className="journey-banner"><span className="banner-ornament">✦</span><p>Lịch sử được viết bởi cha ông.<br /><em>Hành trình khám phá bắt đầu từ bạn.</em></p><Link href="/shop" className="heritage-button cream">Bắt đầu hành trình <Arrow /></Link></section>
      </main>
      <SiteFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { money, orderStatuses } from "@/server/domain/order";
import { useState } from "react";
import type { DashboardData } from "@/server/services/dashboard";
import { AdminIcon, type AdminIconName } from "./icons";

const number = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
export default function Dashboard({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<"accounts" | "sales">("accounts");
  const [focused, setFocused] = useState<number | null>(null);
  const max = Math.max(4, Math.ceil(Math.max(0, ...data.registrations.map(row => row.count)) / 4) * 4);
  const points = data.registrations.map((row, index) => ({ x: 45 + index * 810 / (data.days - 1), y: 210 - row.count / max * 160, ...row }));
  const line = points.map(p => `${p.x},${p.y}`).join(" ");
  const publishedPercent = data.totalCharacters ? Math.round(data.publishedCharacters / data.totalCharacters * 100) : 0;
  const metrics: { label: string; value: string; detail: string; icon: AdminIconName; tone: string }[] = [
    { label: "Doanh thu đã xác nhận", value: money(data.sales.revenue), detail: "Online đã trả + COD đã hoàn tất", icon: "chart", tone: "blue" },
    { label: "Đơn hàng", value: number(data.sales.total), detail: `${number((data.sales.counts.paid || 0) + (data.sales.counts.unpaid || 0))} đơn chờ xử lý`, icon: "orders", tone: "mint" },
    { label: "Tài khoản người dùng", value: number(data.totalUsers), detail: `${number(data.newUsers)} đăng ký trong ${data.days} ngày`, icon: "users", tone: "purple" },
    { label: "Nhân vật lịch sử", value: number(data.totalCharacters), detail: `${number(data.publishedCharacters)} mã QR sẵn sàng`, icon: "characters", tone: "amber" },
  ];
  return <>
    <div className="dashboard-heading"><div><p className="dashboard-eyebrow">KHÔNG GIAN QUẢN TRỊ</p><h1>Dashboard quản trị</h1><p className="subtitle">Một góc nhìn tổng quan cho hành trình của Dấu Chân Sử Ký.</p></div><Link className="btn primary" href="/admin/characters"><span>+</span> Quản lý nhân vật →</Link></div>
    <section className="metric-grid" aria-label="Thống kê tổng quan">{metrics.map(metric => <article className="metric-card" key={metric.label}><span className={`metric-icon ${metric.tone}`}><AdminIcon name={metric.icon} /></span><div><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.detail}</small></div></article>)}</section>
    <section className="dashboard-section"><div className="section-title"><h2>Tổng quan hoạt động</h2><nav className="period-picker" aria-label="Khoảng thời gian"><Link href="/admin?days=7" aria-current={data.days === 7 ? "page" : undefined}>7 ngày</Link><Link href="/admin?days=30" aria-current={data.days === 30 ? "page" : undefined}>30 ngày</Link></nav></div>
      <div className="overview-card"><div className="overview-tabs" role="tablist" aria-label="Loại thống kê"><button role="tab" id="accounts-tab" aria-controls="accounts-panel" aria-selected={tab === "accounts"} onClick={() => setTab("accounts")}>TÀI KHOẢN MỚI</button><button role="tab" id="sales-tab" aria-controls="sales-panel" aria-selected={tab === "sales"} onClick={() => setTab("sales")}>DOANH THU & ĐƠN HÀNG</button></div>
        {tab === "accounts" ? <div id="accounts-panel" role="tabpanel" aria-labelledby="accounts-tab" className="chart-panel"><div className="chart-summary"><div><strong>{number(data.newUsers)}</strong><span>tài khoản mới trong {data.days} ngày gần nhất</span></div><span className="chart-legend"><i /> Tài khoản mới</span></div>
          <div className="activity-chart"><svg viewBox="0 0 900 260" role="img" aria-label={`Biểu đồ tài khoản đăng ký ${data.days} ngày qua, tổng ${data.newUsers} tài khoản`}><defs><linearGradient id="account-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c83f4" stopOpacity=".2" /><stop offset="100%" stopColor="#4c83f4" stopOpacity=".015" /></linearGradient></defs>
            {[0, 1, 2, 3, 4].map(index => <g key={index}><line x1="45" x2="855" y1={50 + index * 40} y2={50 + index * 40} stroke="#edf1f7" /><text x="30" y={54 + index * 40} textAnchor="end">{Math.round(max * (4 - index) / 4)}</text></g>)}
            <polygon points={`45,210 ${line} 855,210`} fill="url(#account-chart-fill)" /><polyline points={line} fill="none" stroke="#4a7ff0" strokeWidth="2.5" strokeLinejoin="round" />
            {points.map((point, index) => <g key={point.date}>{(index === 0 || index === data.days - 1 || index % Math.ceil(data.days / 5) === 0) && <text x={point.x} y="245" textAnchor="middle">{point.date.slice(8)}/{point.date.slice(5, 7)}</text>}<circle cx={point.x} cy={point.y} r={focused === index ? 5 : 3} fill="#4a7ff0" tabIndex={0} role="img" aria-label={`${point.date}: ${point.count} tài khoản`} onMouseEnter={() => setFocused(index)} onMouseLeave={() => setFocused(null)} onFocus={() => setFocused(index)} onBlur={() => setFocused(null)}><title>{point.date + ": " + point.count + " tài khoản"}</title></circle></g>)}
          </svg>{focused !== null && <div className="chart-hover" role="status">{points[focused].date} · <strong>{points[focused].count} tài khoản mới</strong></div>}</div>
          <details className="chart-data"><summary>Xem dữ liệu theo ngày</summary><div>{data.registrations.map(row => <p key={row.date}><span>{row.date}</span><strong>{row.count}</strong></p>)}</div></details>
        </div> : <div id="sales-panel" role="tabpanel" aria-labelledby="sales-tab" className="sales-empty"><span className="empty-icon"><AdminIcon name="chart" /></span><h3>{money(data.sales.revenue)} doanh thu đã xác nhận</h3><p>Tổng {number(data.sales.total)} đơn từ trước đến nay · Bao gồm đơn online đã thanh toán và COD đã hoàn tất.</p><div className="sales-status-summary">{Object.entries(orderStatuses).map(([status, label]) => <Link key={status} href={`/admin/orders?status=${status}`}>{label}: <strong>{data.sales.counts[status as keyof typeof orderStatuses] || 0}</strong></Link>)}</div><Link className="btn primary" href="/admin/orders">Quản lý đơn hàng →</Link></div>}
      </div>
    </section>
    <div className="dashboard-bottom"><section><div className="section-title"><h2>Kho nhân vật</h2><Link href="/admin/characters">Quản lý ↗</Link></div><div className="breakdown-card"><span className="dashboard-eyebrow">THẺ QR NHÂN VẬT</span><div className="breakdown-body"><div className="character-donut" style={{ background: `conic-gradient(#4d7ff3 0% ${publishedPercent}%, #e7edfa ${publishedPercent}% 100%)` }} role="img" aria-label={`${data.totalCharacters} mã QR sẵn sàng`}><div><strong>{number(data.totalCharacters)}</strong><span>nhân vật</span></div></div><div className="donut-legend"><p><i /><span>Sẵn sàng quét QR</span><strong>{data.publishedCharacters}</strong></p></div></div><p className="breakdown-note">Chỉ mã QR sẵn sàng mới có thể nhận câu hỏi qua QR.</p></div></section>
      <section><div className="section-title"><h2>Cập nhật gần đây</h2><Link href="/admin/characters">Xem tất cả ↗</Link></div><div className="recent-card">{data.recent.length ? <div className="recent-table-wrap"><table><thead><tr><th>NHÂN VẬT</th><th>TRẠNG THÁI</th><th>CẬP NHẬT</th></tr></thead><tbody>{data.recent.map(item => <tr key={item.id}><td><Link href={`/admin/characters?q=${encodeURIComponent(item.name)}`}><span className="character-initial">{item.name.slice(0, 1)}</span><span>{item.name}<small>{item.openingLine}</small></span></Link></td><td><span className={`status-pill ${item.published ? "published" : "draft"}`}>{"Sẵn sàng quét"}</span></td><td>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(item.updatedAt))}</td></tr>)}</tbody></table></div> : <div className="recent-empty"><AdminIcon name="characters" /><h3>Bắt đầu với nhân vật đầu tiên</h3><p>Thêm hồ sơ lịch sử và tạo thẻ QR cho bàn chơi.</p><Link href="/admin/characters">Thêm nhân vật →</Link></div>}</div></section>
    </div>
  </>;
}

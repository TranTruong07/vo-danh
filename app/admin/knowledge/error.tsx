"use client";
export default function KnowledgeError({ reset }: { reset: () => void }) {
  return <div className="card"><h1>Chưa tải được kho kiến thức</h1><p>Kiểm tra kết nối và tài liệu nguồn trên server rồi thử lại. Chưa có thao tác nào được thực hiện từ trang lỗi này.</p><button className="btn primary" onClick={reset}>Thử lại</button></div>;
}

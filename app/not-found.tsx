import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
        <div className="text-5xl font-extrabold text-indigo-600">404</div>
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy trang</h2>
        <p className="text-sm text-slate-600">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị thay đổi.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

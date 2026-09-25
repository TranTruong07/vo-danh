"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AuthorDetailContent() {
  const searchParams = useSearchParams();
  const authorId = searchParams.get("authorId");

  // Dữ liệu mẫu giả lập theo authorId
  const authorMockData: Record<
    string,
    { name: string; role: string; bio: string; department: string; email: string; avatar: string }
  > = {
    "auth-001": {
      name: "Nguyễn Văn An",
      role: "Trưởng ban Kỹ Thuật",
      department: "Phòng Công Nghệ Thông Tin",
      email: "an.nguyen@example.com",
      bio: "Chuyên gia phát triển hệ thống nhúng và giải pháp số hóa doanh nghiệp.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    },
    "auth-002": {
      name: "Trần Thị Mai",
      role: "Chuyên viên Quản lý Vận hành",
      department: "Ban Quản lý Thiết bị",
      email: "mai.tran@example.com",
      bio: "Phụ trách kiểm tra, cấp phát mã nhận diện thiết bị và theo dõi tài sản.",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    },
  };

  const author = authorId
    ? authorMockData[authorId] || {
        name: `Tác giả / Mã định danh (${authorId})`,
        role: "Thành viên hệ thống",
        department: "Đơn vị liên kết",
        email: `${authorId.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
        bio: `Thông tin được truy xuất tự động từ hệ sinh thái qua mã QR định danh ${authorId}.`,
        avatar: "",
      }
    : null;

  if (!authorId || !author) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy mã Author</h2>
        <p className="text-gray-500 text-sm mb-6">
          Vui lòng quét lại mã QR hợp lệ hoặc kiểm tra đường dẫn liên kết.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
        >
          Về trang tạo mã QR
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full border border-gray-100 transition-all">
      {/* Header Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold tracking-wider">
          SCAN VERIFIED
        </div>
      </div>

      {/* Avatar & Profile Information */}
      <div className="px-6 pb-6 relative pt-0">
        <div className="flex justify-between items-end -mt-14 mb-4">
          <div className="relative">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center text-indigo-600 text-3xl font-bold">
                {author.name.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">
              ID: {authorId}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{author.name}</h1>
          <p className="text-indigo-600 font-medium text-sm mt-0.5">{author.role}</p>
        </div>

        {/* Thông tin chi tiết */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              🏢
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Phòng ban / Đơn vị</p>
              <p className="text-sm font-medium text-gray-800">{author.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✉️
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Email liên hệ</p>
              <p className="text-sm font-medium text-gray-800">{author.email}</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 font-medium mb-1">Giới thiệu tóm tắt</p>
            <p className="text-sm text-gray-600 leading-relaxed">{author.bio}</p>
          </div>
        </div>

        {/* Thông báo quét thành công */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-emerald-600 text-lg leading-none">✓</span>
          <p className="text-xs text-emerald-800">
            Hệ thống đã ghi nhận lượt quét mã QR với tham số <span className="font-semibold">{authorId}</span> thành công.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="w-full block text-center py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm transition"
          >
            Tạo mã QR khác
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthorPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="p-8 text-center bg-white rounded-2xl shadow">
            <p className="text-gray-500">Đang tải thông tin quét...</p>
          </div>
        }
      >
        <AuthorDetailContent />
      </Suspense>
    </main>
  );
}

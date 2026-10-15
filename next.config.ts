import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Private source stays in server traces for authenticated knowledge review only.
  outputFileTracingIncludes: {
    "/admin/knowledge{,/**}": ["./knowledge/extraction-manifest.json", "./knowledge/draft-questions-phase-2-v3.json", "./docs/source/Tong-hop-kien-thuc.docx"],
    "/api/admin/knowledge{,/**}": ["./knowledge/extraction-manifest.json", "./knowledge/draft-questions-phase-2-v3.json", "./docs/source/Tong-hop-kien-thuc.docx"],
  },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }, { key: "Service-Worker-Allowed", value: "/" }] }, { source: "/pwa-assets.json", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
  // Cho phép truy cập từ điện thoại qua mạng LAN
  allowedDevOrigins: ["192.168.34.104", "localhost", "127.0.0.1", "*.local"],
  // Two images up to 3 MiB each, plus form fields and multipart overhead.
  experimental: { serverActions: { bodySizeLimit: "7mb" } },
};

export default nextConfig;

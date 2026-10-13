import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Dấu Chân Sử Ký", short_name: "Sử Ký", lang: "vi",
    description: "Quét thẻ nhân vật, khám phá lịch sử và chơi câu hỏi cả khi mất mạng.",
    start_url: "/", scope: "/", display: "standalone",
    background_color: "#faf5e9", theme_color: "#981f25",
    icons: [{ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
  };
}

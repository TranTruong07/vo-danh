import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép truy cập từ điện thoại qua mạng LAN
  allowedDevOrigins: ["192.168.34.104", "localhost", "127.0.0.1", "*.local"],
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;

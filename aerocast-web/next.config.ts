import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ["192.168.1.35"],
};

export default nextConfig;

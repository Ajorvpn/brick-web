import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static-export friendly: no server runtime, no images remote patterns needed.
  // (Only inline SVG / CSS visuals are used; no next/image remote sources.)
  reactStrictMode: true,
};

export default nextConfig;

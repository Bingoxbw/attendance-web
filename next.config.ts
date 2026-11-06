import type { NextConfig } from "next";

/** Set BASE_PATH=/qiandao on the China server before build. Leave empty for local. */
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  // Hide Next.js "N" dev indicator (not Neon)
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

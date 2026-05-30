import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Keep dev and production build artifacts separate to avoid .next corruption
  // when running `next dev` and `next build` in different terminals.
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
};

export default nextConfig;

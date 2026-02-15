import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Hackathon-friendly: allow hotlinked OG images from arbitrary sources without remotePatterns churn.
    unoptimized: true,
  },
};

export default nextConfig;

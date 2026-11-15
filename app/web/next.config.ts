import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

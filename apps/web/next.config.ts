import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // @react-pdf/renderer must run only on the Node.js runtime (API routes)
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;

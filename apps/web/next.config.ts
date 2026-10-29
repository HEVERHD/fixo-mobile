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
  // TODO: Remove after running `npx supabase gen types typescript --project-id <id>`
  // to generate proper Database types for the typed Supabase client.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Scaffold default is true; it breaks `export const runtime = "nodejs"` in route handlers and forces
  // <Suspense> around every cookies()/params read. partialPrefetching requires it, so both are off.
  cacheComponents: false,
  // EC2 + pm2 deploy runs the self-contained server from .next/standalone
  output: "standalone",
  // native-ish / dynamic-require server deps: load with Node require instead of bundling
  serverExternalPackages: ["pg", "@electric-sql/pglite", "unpdf"],
  // the assistant reads the legal corpus from disk at runtime; standalone tracing cannot see a computed path
  outputFileTracingIncludes: { "/api/assistant/**": ["./data/legal/**"] },
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

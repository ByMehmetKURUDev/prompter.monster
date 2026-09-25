import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Opt-in: expose Cloudflare bindings (KV etc.) during `next dev` by running
//   OPENNEXT_DEV_BINDINGS=1 npm run dev
// It starts the local Workers runtime (workerd), which needs macOS 13.5+ or Linux.
// Without the flag the app runs with in-memory fallbacks — fine for UI work.
if (process.env.OPENNEXT_DEV_BINDINGS === "1") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

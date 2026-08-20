import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Turbopack walks up and finds a stray
  // package.json in the home directory and warns on every build.
  turbopack: { root: __dirname },

  images: {
    // AVIF first, WebP as the fallback — screenshots are the heaviest assets on
    // the case-study routes and AVIF typically halves them again over WebP.
    formats: ["image/avif", "image/webp"],
  },

  // Long-lived immutable caching is handled by Vercel; these are the headers
  // that are not, and that a security review would flag.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

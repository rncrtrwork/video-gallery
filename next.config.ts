import type { NextConfig } from "next";

const scriptSources = process.env.NODE_ENV === "development"
  ? "'self' 'unsafe-inline' 'unsafe-eval' https://upload-widget.cloudinary.com"
  : "'self' 'unsafe-inline' https://upload-widget.cloudinary.com";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com; media-src 'self' blob: https://res.cloudinary.com https://*.cloudinary.com; connect-src 'self' https://api.cloudinary.com https://*.cloudinary.com; frame-src https://widget.cloudinary.com https://upload-widget.cloudinary.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

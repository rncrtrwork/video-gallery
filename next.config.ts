import type { NextConfig } from "next";

const scriptSources = process.env.NODE_ENV === "development"
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

function configuredUrl(value?: string) {
  try { return value ? new URL(value) : null; } catch { return null; }
}

const storageEndpoint = configuredUrl(process.env.B2_ENDPOINT);
const publicMediaBase = configuredUrl(process.env.B2_PUBLIC_BASE_URL);
const storageOrigins = [...new Set([storageEndpoint?.origin, publicMediaBase?.origin].filter(Boolean))].join(" ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: publicMediaBase ? [{ protocol: "https", hostname: publicMediaBase.hostname, port: publicMediaBase.port }] : [],
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
            value: `default-src 'self'; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${storageOrigins}; media-src 'self' blob: ${storageOrigins}; connect-src 'self' ${storageOrigins}; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

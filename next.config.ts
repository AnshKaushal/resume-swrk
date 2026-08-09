import type { NextConfig } from "next"

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.swrk.in https://*.razorpay.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://assets.swrk.in https://img.clerk.com https://github.com https://avatars.githubusercontent.com https://*.razorpay.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk.swrk.in https://api.iconify.design https://api.unisvg.com https://*.razorpay.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.swrk.in https://*.razorpay.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "nodemailer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.swrk.in",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig

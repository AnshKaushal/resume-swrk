import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/analyses/",
          "/billing/",
          "/checkout/",
          "/fix/",
          "/analyse/",
        ],
      },
    ],
    sitemap: `${APP_URL.replace(/\/$/, "")}/sitemap.xml`,
  }
}

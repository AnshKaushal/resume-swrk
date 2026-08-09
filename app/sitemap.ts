import type { MetadataRoute } from "next"
import db from "@/lib/db"
import BlogModel from "@/lib/models/blog"

export const dynamic = "force-dynamic"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = APP_URL.replace(/\/$/, "")

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/analyse`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  let blogRoutes: MetadataRoute.Sitemap = []
  try {
    await db()
    const posts = await BlogModel.find({ published: true })
      .select("slug updatedAt")
      .lean()
    blogRoutes = posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {
    // DB unreachable; publish static routes only
  }

  return [...staticRoutes, ...blogRoutes]
}

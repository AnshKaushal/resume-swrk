import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import db from "@/lib/db"
import BlogModel from "@/lib/models/blog"
import { Container } from "@/components/container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MarkdownContent } from "@/components/markdown-content"
import { JsonLd } from "@/components/json-ld"
import { ArrowLeft } from "lucide-react"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export const dynamic = "force-dynamic"

async function getPost(slug: string) {
  await db()
  return BlogModel.findOne({ slug, published: true }).lean()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Post not found | SWRK" }
  const image = post.coverImage || "/analysis-light.png"
  return {
    title: `${post.title} | SWRK`,
    description:
      post.excerpt ||
      "Practical advice on resumes, ATS systems, and landing the interview from the SWRK team.",
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      type: "article",
      siteName: "SWRK",
      locale: "en_US",
      url: `/blog/${slug}`,
      title: `${post.title} | SWRK`,
      description:
        post.excerpt ||
        "Practical advice on resumes, ATS systems, and landing the interview from the SWRK team.",
      images: [{ url: image }],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      authors: [post.author || "SWRK"],
      tags: post.tags ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | SWRK`,
      description:
        post.excerpt ||
        "Practical advice on resumes, ATS systems, and landing the interview from the SWRK team.",
      images: [image],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const date = new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(
    undefined,
    { month: "long", day: "numeric", year: "numeric" },
  )

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || `${APP_URL}/analysis-light.png`,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : undefined,
    author: {
      "@type": "Organization",
      name: post.author || "SWRK",
      url: APP_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "SWRK",
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/logo-dark.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${APP_URL}/blog/${post.slug}`,
    },
  }

  return (
    <Container className="w-full">
      <article className="flex flex-col gap-8 px-4 py-12 sm:px-6 border-x">
        <JsonLd data={articleJsonLd} />
        <div className="flex flex-col gap-4 max-w-prose mx-auto">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="w-fit"
            render={<Link href="/blog" />}
          >
            <ArrowLeft className="size-4" />
            All posts
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {(post.tags ?? []).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {post.author} · {date}
          </p>
          {post.excerpt && (
            <p className="max-w-2xl text-base text-muted-foreground">
              {post.excerpt}
            </p>
          )}
        </div>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="aspect-auto max-w-prose mx-auto border border-border object-cover"
          />
        )}

        <div className="max-w-prose mx-auto">
          <MarkdownContent content={post.content ?? ""} />
        </div>
      </article>
    </Container>
  )
}

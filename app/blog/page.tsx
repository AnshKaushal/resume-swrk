import Link from "next/link"
import type { Metadata } from "next"
import db from "@/lib/db"
import BlogModel from "@/lib/models/blog"
import { Container } from "@/components/container"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Resume and ATS Tips Blog | SWRK",
  description:
    "Practical advice on resumes, ATS systems, keywords, and landing more interviews from the SWRK team.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    siteName: "SWRK",
    locale: "en_US",
    url: "/blog",
    title: "Resume and ATS Tips Blog | SWRK",
    description:
      "Practical advice on resumes, ATS systems, keywords, and landing more interviews from the SWRK team.",
    images: [
      {
        url: "/analysis-light.png",
        width: 2944,
        height: 1921,
        alt: "SWRK AI resume analysis results",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume and ATS Tips Blog | SWRK",
    description:
      "Practical advice on resumes, ATS systems, keywords, and landing more interviews from the SWRK team.",
    images: ["/analysis-light.png"],
  },
}

export const dynamic = "force-dynamic"

async function getPosts() {
  await db()
  return BlogModel.find({ published: true })
    .sort({ publishedAt: -1 })
    .limit(50)
    .lean()
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <Container className="w-full">
      <section className="flex flex-col min-h-[calc(100vh-15rem)] gap-8 px-4 py-12 sm:px-6 border-x">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            The SWRK blog
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Practical advice on resumes, ATS systems, and landing the interview.
          </p>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No posts yet - check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post._id.toString()} href={`/blog/${post.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/50 pt-0">
                  <CardContent className="flex h-full flex-col gap-3 p-0">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="aspect-auto w-full border-b border-border object-contain h-full"
                      />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center border-b border-border bg-muted/50 text-2xl font-heading">
                        SWRK
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        {post.title}
                      </h2>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <span className="mt-auto pt-2 text-xs text-muted-foreground">
                        {new Date(
                          post.publishedAt ?? post.createdAt,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}

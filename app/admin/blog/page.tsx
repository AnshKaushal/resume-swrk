"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string
  published: boolean
  publishedAt: string | null
  updatedAt: string
  tags: string[]
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch("/api/admin/blog")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load posts")
        return res.json()
      })
      .then((json) => setPosts(json.posts))
      .catch((e) => toast.error(e.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const togglePublished = async (post: Post) => {
    setBusy(post.id)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Update failed")
      toast.success(post.published ? "Unpublished" : "Published")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusy(null)
    }
  }

  const remove = async (post: Post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`))
      return
    setBusy(post.id)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Delete failed")
      toast.success("Post deleted")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Blog posts
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and publish articles.
          </p>
        </div>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/blog/new" />}
        >
          <Plus className="size-4" />
          New post
        </Button>
      </div>

      {!posts ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm text-muted-foreground">No posts yet.</p>
          <Button size="sm" onClick={() => router.push("/admin/blog/new")}>
            Write your first post
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {post.title}
                    </span>
                    {post.published ? (
                      <Badge variant="outline" className="shrink-0">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    /blog/{post.slug} · updated{" "}
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </span>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => togglePublished(post)}
                    disabled={busy === post.id}
                    aria-label={post.published ? "Unpublish" : "Publish"}
                  >
                    {busy === post.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : post.published ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    nativeButton={false}
                    render={<Link href={`/admin/blog/${post.id}`} />}
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => remove(post)}
                    aria-label="Delete"
                    className="text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

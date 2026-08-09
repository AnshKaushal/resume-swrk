"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { BlogEditor, type BlogPostInput } from "@/components/admin/blog-editor"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<BlogPostInput | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load post")
        return res.json()
      })
      .then(setPost)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!post) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Edit post
        </h1>
        <p className="text-sm text-muted-foreground">
          Write in markdown - preview updates live.
        </p>
      </div>
      <BlogEditor postId={id} initial={post} />
    </div>
  )
}

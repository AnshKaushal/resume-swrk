"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImageUp, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownContent } from "@/components/markdown-content"

export type BlogPostInput = {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string[]
  published: boolean
  author: string
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function BlogEditor({
  postId,
  initial,
}: {
  postId?: string
  initial?: Partial<BlogPostInput>
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug))
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
  const [content, setContent] = useState(initial?.content ?? "")
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "")
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [published, setPublished] = useState(Boolean(initial?.published))
  const [author, setAuthor] = useState(initial?.author ?? "SWRK")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current
    if (!el) {
      setContent((c) => c + text)
      return
    }
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    const next = content.slice(0, start) + text + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + text.length
      el.setSelectionRange(pos, pos)
    })
  }

  const uploadAndInsert = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed")
      insertAtCursor(`\n![blog image](${json.url})\n`)
      toast.success("Image uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const uploadCover = async (file: File) => {
    setCoverUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed")
      setCoverImage(json.url)
      toast.success("Cover image uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setCoverUploading(false)
    }
  }

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "")
    if (!tag) return
    setTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev
        : [...prev, tag],
    )
    setTagInput("")
  }

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (tagInput.trim()) addTag(tagInput)
    } else if (e.key === "Backspace" && !tagInput) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) void uploadAndInsert(file)
        return
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) void uploadAndInsert(file)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const save = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)
    try {
      const body: BlogPostInput = {
        title: title.trim(),
        slug: slug.trim() || slugify(title) || `post-${Date.now()}`,
        excerpt: excerpt.trim(),
        content,
        coverImage: coverImage.trim(),
        tags: tags
          .map((t) => t.trim())
          .filter(Boolean)
          .filter((t, i, arr) => arr.indexOf(t) === i),
        published,
        author: author.trim() || "SWRK",
      }
      const res = await fetch(postId ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
        method: postId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Save failed")
      toast.success(postId ? "Post updated" : "Post created")
      router.push("/admin/blog")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="How to beat the ATS in 2026"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Slug
          </label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="how-to-beat-the-ats"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Excerpt
        </label>
        <Textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Short summary shown on the blog listing."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cover image
          </label>
          {coverImage ? (
            <div className="flex items-center gap-3 border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-20 w-32 shrink-0 border border-border object-cover"
              />
              <div className="flex flex-col gap-2">
                <span className="max-w-[16rem] truncate text-xs text-muted-foreground">
                  {coverImage}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={coverUploading}
                  >
                    {coverUploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ImageUp className="size-3.5" />
                    )}
                    Replace
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCoverImage("")}
                  >
                    <X className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="h-24 border-dashed"
              onClick={() => coverFileRef.current?.click()}
              disabled={coverUploading}
            >
              {coverUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              Upload cover image
            </Button>
          )}
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadCover(file)
              e.target.value = ""
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tags
          </label>
          <div className="flex min-h-10 flex-wrap items-center gap-1.5 border border-border bg-transparent px-2 py-1.5 focus-within:border-primary">
            {tags.map((tag, i) => (
              <span
                key={tag}
                className="flex items-center gap-1 border border-border bg-muted px-2 py-0.5 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (tagInput.trim()) addTag(tagInput)
              }}
              placeholder={tags.length === 0 ? "Type a tag and press Enter" : ""}
              className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Press Enter to add a tag. Backspace removes the last one.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="size-4 accent-(--primary)"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Author</span>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="h-8 w-40"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageUp className="size-4" />
            )}
            Insert image
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadAndInsert(file)
              e.target.value = ""
            }}
          />
          <span className="text-xs text-muted-foreground">
            Paste or drag &amp; drop an image into the editor to insert it at
            the cursor.
          </span>
        </div>
      </div>

      <div className="grid min-h-[60vh] grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Markdown
          </label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            placeholder={"# Heading\n\nWrite **markdown** here…"}
            className="min-h-[60vh] w-full flex-1 resize-none rounded-none border border-border bg-transparent p-3 font-mono text-sm outline-none focus-visible:border-primary"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preview
          </label>
          <div className="min-h-[60vh] w-full flex-1 overflow-auto rounded-none border border-border bg-muted/30 p-4">
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Preview appears here as you type.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button variant="outline" onClick={() => router.push("/admin/blog")}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {postId ? "Update post" : "Create post"}
        </Button>
      </div>
    </div>
  )
}

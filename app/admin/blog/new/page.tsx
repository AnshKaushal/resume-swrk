import { BlogEditor } from "@/components/admin/blog-editor"

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          New post
        </h1>
        <p className="text-sm text-muted-foreground">
          Write in markdown - preview updates live.
        </p>
      </div>
      <BlogEditor />
    </div>
  )
}

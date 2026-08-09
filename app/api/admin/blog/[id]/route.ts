import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import db from "@/lib/db";
import BlogModel from "@/lib/models/blog";
import { deleteFromR2, keyFromUrl } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/blog/[id]">) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();
    const { id } = await ctx.params;
    const post = await BlogModel.findById(id).lean();
    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    return Response.json({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      coverImage: post.coverImage ?? "",
      tags: post.tags ?? [],
      published: post.published ?? false,
      publishedAt: post.publishedAt ?? null,
      author: post.author ?? "SWRK",
    });
  } catch (error) {
    console.error("Blog get error:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/blog/[id]">) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();
    const { id } = await ctx.params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) {
      update.title = body.title.trim();
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      update.slug = body.slug.trim().toLowerCase();
    }
    if (typeof body.excerpt === "string") update.excerpt = body.excerpt;
    if (typeof body.content === "string") update.content = body.content;
    if (typeof body.coverImage === "string") update.coverImage = body.coverImage;
    if (typeof body.author === "string" && body.author.trim()) {
      update.author = body.author.trim();
    }
    if (Array.isArray(body.tags)) {
      update.tags = body.tags
        .map((t: unknown) => (t as string)?.trim())
        .filter(Boolean);
    }
    if (typeof body.published === "boolean") {
      const post = await BlogModel.findById(id).lean();
      update.published = body.published;
      if (body.published && !post?.publishedAt) {
        update.publishedAt = new Date();
      }
      if (!body.published) update.publishedAt = null;
    }

    const post = await BlogModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    return Response.json({ ok: true, id: post._id.toString() });
  } catch (error) {
    console.error("Blog update error:", error);
    if ((error as { code?: number })?.code === 11000) {
      return Response.json(
        { error: "A post with this slug already exists." },
        { status: 409 }
      );
    }
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/blog/[id]">) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();
    const { id } = await ctx.params;
    const post = await BlogModel.findByIdAndDelete(id).lean();
    if (!post) {
      return Response.json({ error: "Post not found." }, { status: 404 });
    }
    const coverKey = keyFromUrl(post.coverImage ?? "");
    if (coverKey) await deleteFromR2(coverKey);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

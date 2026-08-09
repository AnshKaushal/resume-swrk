import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import db from "@/lib/db";
import BlogModel from "@/lib/models/blog";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();
    const posts = await BlogModel.find().sort({ createdAt: -1 }).lean();
    return Response.json({
      posts: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt ?? "",
        coverImage: p.coverImage ?? "",
        tags: p.tags ?? [],
        published: p.published ?? false,
        publishedAt: p.publishedAt ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Blog list error:", error);
    return Response.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();

    const body = await request.json();
    const title = (body?.title ?? "").toString().trim();
    if (!title) {
      return Response.json({ error: "Title is required." }, { status: 400 });
    }

    let slug = (body?.slug ?? "").toString().trim().toLowerCase();
    if (!slug) slug = slugify(title);
    if (!slug) slug = `post-${Date.now()}`;

    const content = (body?.content ?? "").toString();
    const doc = await BlogModel.create({
      title,
      slug,
      excerpt: (body?.excerpt ?? "").toString(),
      content,
      coverImage: (body?.coverImage ?? "").toString(),
      tags: Array.isArray(body?.tags)
        ? body.tags
            .map((t: unknown) => String(t).trim())
            .filter(Boolean)
        : [],
      published: Boolean(body?.published),
      publishedAt: body?.published ? new Date() : null,
      author: (body?.author ?? "SWRK").toString(),
    });

    return Response.json({ ok: true, id: doc._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Blog create error:", error);
    if (
      (error as { code?: number })?.code === 11000
    ) {
      return Response.json(
        { error: "A post with this slug already exists." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

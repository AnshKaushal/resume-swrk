import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE = 5 * 1024 * 1024;

const EXT_TO_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

function matchesMagic(buffer: Buffer, magic: number[]): boolean {
  if (buffer.byteLength < magic.length) return false
  return magic.every((b, i) => buffer[i] === b)
}

function matchesMagicAt(buffer: Buffer, magic: number[], offset: number): boolean {
  if (buffer.byteLength < offset + magic.length) return false
  return magic.every((b, i) => buffer[offset + i] === b)
}

/** WebP is RIFF with a WEBP chunk type at offset 8. */
function isWebp(buffer: Buffer): boolean {
  return (
    matchesMagic(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    matchesMagicAt(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  )
}

/** AVIF is an ISO-BMFF file: "ftyp" box with the "avif"/"avis" brand. */
function isAvif(buffer: Buffer): boolean {
  return (
    matchesMagicAt(buffer, [0x66, 0x74, 0x79, 0x70], 4) &&
    (matchesMagicAt(buffer, [0x61, 0x76, 0x69, 0x66], 8) ||
      matchesMagicAt(buffer, [0x61, 0x76, 0x69, 0x73], 8))
  )
}

function isRecognisedImage(buffer: Buffer): boolean {
  return (
    matchesMagic(buffer, [0x89, 0x50, 0x4e, 0x47]) || // png
    matchesMagic(buffer, [0xff, 0xd8, 0xff]) || // jpeg
    matchesMagic(buffer, [0x47, 0x49, 0x46, 0x38]) || // gif
    isWebp(buffer) ||
    isAvif(buffer)
  )
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }

    // Same-origin guard: admin uploads come from the admin UI, so a cross-site
    // form can't CSRF the endpoint even if a stray cookie is sent. Clerk auth
    // already protects this, this is defense in depth.
    const origin = request.headers.get("origin");
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
    if (appUrl && origin && origin.replace(/\/+$/, "") !== appUrl) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No image provided." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: "Image must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    const extMatch = /\.([a-z0-9]+)$/i.exec(file.name);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";
    const contentType = file.type || EXT_TO_TYPE[ext];
    // SVG is excluded: its content is executable markup, not a raster image,
    // and uploading it would let an attacker ship scriptable assets to the blog.
    if (!contentType || !contentType.startsWith("image/")) {
      return Response.json(
        { error: "Only PNG, JPG, GIF, WEBP, and AVIF images are allowed." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // The Content-Type header is client-controlled; verify the actual bytes so
    // a renamed script can't be stored as an image.
    if (!isRecognisedImage(buffer)) {
      return Response.json(
        { error: "The file content does not match a supported image type." },
        { status: 400 }
      );
    }

    const key = `blog/${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase()}`;
    const url = await uploadToR2(key, buffer, contentType);

    return Response.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "Something went wrong uploading the image." },
      { status: 500 }
    );
  }
}

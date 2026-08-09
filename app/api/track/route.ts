import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createHmac } from "node:crypto";
import db from "@/lib/db";
import PageViewModel from "@/lib/models/pageview";

export const runtime = "nodejs";

const IGNORED_PATHS = ["/api/track"];

/** Max ~10 view events per minute per IP; returns whether the call is allowed. */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
/** Bound the in-memory rate table so a flood of distinct IPs can't grow it unboundedly. */
const RATE_TABLE_MAX = 10_000;
const rateHits = new Map<string, { count: number; resetAt: number }>();

function rateLimitOk(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateHits.get(ipHash);
  if (!entry || entry.resetAt <= now) {
    rateHits.set(ipHash, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    entry.count += 1;
    if (entry.count > RATE_MAX) return false;
  }

  if (rateHits.size > RATE_TABLE_MAX) {
    // Evict expired buckets; if that isn't enough, drop the oldest entries.
    for (const [key, value] of rateHits) {
      if (value.resetAt <= now) rateHits.delete(key);
    }
    if (rateHits.size > RATE_TABLE_MAX) {
      const oldest = [...rateHits.entries()].sort(
        (a, b) => a[1].resetAt - b[1].resetAt,
      );
      for (const [key] of oldest.slice(0, rateHits.size - RATE_TABLE_MAX)) {
        rateHits.delete(key);
      }
    }
  }
  return true;
}

/**
 * The client can prepend arbitrary values to X-Forwarded-For, so the FIRST
 * entry is attacker-controlled and unusable for rate limiting. Behind a
 * trusted proxy (e.g. Vercel/nginx) the rightmost entry is the one the proxy
 * appended and reflects the true connecting client, so it wins. Private
 * ranges (proxy-internal hops) are skipped over.
 */
function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const entries = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (let i = entries.length - 1; i >= 0; i--) {
      const candidate = entries[i];
      if (candidate && !isPrivateIp(candidate)) return candidate;
    }
    if (entries.length > 0) return entries[entries.length - 1];
  }
  return request.headers.get("x-real-ip") ?? "";
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  const v4 = ip.includes(".") ? ip : "";
  if (v4) {
    const parts = v4.split(".").map(Number);
    if (parts.length === 4) {
      return (
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        parts[0] === 169
      );
    }
  }
  return /^fc|^fe8|^fd/.test(ip) || ip === "::1";
}

export async function POST(request: NextRequest) {
  try {
    // Reject oversized bodies before they are buffered into memory.
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 4096) {
      return Response.json({ error: "Payload too large." }, { status: 413 });
    }
    const body = await request.json();
    const path = (body?.path ?? "").toString();
    if (!path || IGNORED_PATHS.includes(path)) {
      return Response.json({ ok: true });
    }

    const ip = clientIp(request);
    // HMAC (with a server secret) instead of a plain SHA-256 hash: an
    // unsalted digest of an IP is trivially reversable by brute force.
    const ipHash = ip
      ? createHmac("sha256", process.env.TRACK_HMAC_SECRET ?? "swrk-track")
          .update(ip)
          .digest("hex")
      : "";

    if (!ipHash || !rateLimitOk(ipHash)) {
      return Response.json(
        { error: "Too many requests." },
        { status: 429 },
      );
    }

    let clerkId: string | null = null;
    try {
      const { isAuthenticated, userId } = await auth();
      if (isAuthenticated && userId) clerkId = userId;
    } catch {
      // signed-out visitors still get tracked
    }

    await db();
    await PageViewModel.create({
      path: path.slice(0, 500),
      referrer: (body?.referrer ?? "").toString().slice(0, 500),
      ua: (body?.ua ?? "").toString().slice(0, 300),
      ipHash: ipHash.slice(0, 64),
      clerkId,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return Response.json({ ok: true });
  }
}

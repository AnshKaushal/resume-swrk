import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { optimiseResume, type Check, type SectionKey } from "@/lib/analyse"
import { isRateLimitError } from "@/lib/analyse"
import { getEntitlement, getAnalysisForUser } from "@/lib/analysis-store"
import { isCheckLockedOnFree } from "@/lib/plan-gates"

export const runtime = "nodejs"
export const maxDuration = 60

const VALID_SECTIONS = new Set<SectionKey>([
  "ats",
  "contentQuality",
  "impactAchievements",
  "jobMatch",
  "presentationReadability",
])

// Per-user rate limit for the LLM-backed rewrite endpoint. Unlike /api/analyse,
// optimise has no quota to consume, so without a limiter a free user could loop
// requests and burn unbounded Groq tokens. The limit is generous enough for
// normal use (a user legitimately fixes several sections) while capping abuse.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 20
const rateHits = new Map<string, { count: number; resetAt: number }>()

function rateLimitOk(userId: string): boolean {
  const now = Date.now()
  const entry = rateHits.get(userId)
  if (!entry || entry.resetAt <= now) {
    rateHits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_MAX
}

function isValidSection(value: unknown): value is SectionKey {
  return typeof value === "string" && VALID_SECTIONS.has(value as SectionKey)
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return Response.json(
        { error: "Please sign in to generate fixes." },
        { status: 401 }
      );
    }

    if (!rateLimitOk(userId)) {
      return Response.json(
        {
          error:
            "Too many fix requests. Please wait a moment and try again.",
        },
        { status: 429, headers: { "Retry-After": "60" } },
      )
    }

    const entitlement = await getEntitlement(userId, {});

    const body = await request.json();
    const resumeText: unknown = body?.resumeText;
    const targetRole: unknown = body?.targetRole;
    const jobDescription: unknown = body?.jobDescription;
    const analysisId: unknown = body?.analysisId;
    const failedChecks: unknown = body?.failedChecks;

    if (typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return Response.json(
        { error: "Resume text is required for optimisation." },
        { status: 400 }
      );
    }

    if (resumeText.length > 50_000) {
      return Response.json(
        { error: "Resume text is too long to optimise." },
        { status: 400 }
      );
    }

    if (!Array.isArray(failedChecks) || failedChecks.length === 0) {
      return Response.json(
        { error: "No failed checks to fix." },
        { status: 400 }
      );
    }

    if (failedChecks.length > 30) {
      return Response.json(
        { error: "Too many failed checks in one request." },
        { status: 400 }
      );
    }

    const checks: Check[] = failedChecks.filter(
      (c): c is Check =>
        !!c &&
        typeof c === "object" &&
        typeof (c as { label?: unknown }).label === "string" &&
        typeof (c as { feedback?: unknown }).feedback === "string" &&
        isValidSection((c as { section?: unknown }).section),
    );

    if (checks.length === 0) {
      return Response.json(
        { error: "No valid failed checks to fix." },
        { status: 400 }
      );
    }

    // Paid plans and ₹199-unlocked analyses get fixes for everything.
    let unlocked = entitlement.plan !== "free";
    if (!unlocked && typeof analysisId === "string" && analysisId) {
      const owned = await getAnalysisForUser(userId, analysisId);
      unlocked = !!owned?.unlocked;
    }

    const allowedChecks = unlocked
      ? checks
      : checks.filter((c) => !isCheckLockedOnFree(c.section, c.label));

    if (allowedChecks.length === 0) {
      return Response.json({ fixes: [], allLocked: true });
    }

    const result = await optimiseResume(resumeText, allowedChecks, {
      targetRole:
        typeof targetRole === "string" && targetRole.trim()
          ? targetRole.trim()
          : undefined,
      jobDescription:
        typeof jobDescription === "string" && jobDescription.trim()
          ? jobDescription.trim()
          : undefined,
    });

    return Response.json(result);
  } catch (error) {
    if (isRateLimitError(error)) {
      console.error("Optimise rate limited:", error);
      return Response.json(
        {
          error:
            "Daily AI rewrite limit reached. Please try again in a few minutes.",
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    console.error("Optimise error:", error);
    return Response.json(
      {
        error:
          "Something went wrong while generating fixes. Please try again.",
      },
      { status: 500 }
    );
  }
}

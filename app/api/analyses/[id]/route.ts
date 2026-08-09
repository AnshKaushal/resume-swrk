import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  deleteAnalysisForUser,
  getAnalysisForUser,
  setAnalysisAppliedFixes,
} from "@/lib/analysis-store";
import { sanitizeAnalysisForFree, lockedInsightCounts } from "@/lib/plan-gates";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/analyses/[id]">
) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Please sign in." }, { status: 401 });
    }
    const { id } = await ctx.params;
    const analysis = await getAnalysisForUser(userId, id);
    if (!analysis) {
      return Response.json({ error: "Analysis not found." }, { status: 404 });
    }
    if (!analysis.unlocked) {
      return Response.json({
        ...analysis,
        analysis: sanitizeAnalysisForFree(analysis.analysis),
        lockedStrengthsCount: lockedInsightCounts(analysis.analysis).strengths,
        lockedWeaknessesCount:
          lockedInsightCounts(analysis.analysis).weaknesses,
      });
    }
    return Response.json(analysis);
  } catch (error) {
    console.error("Get analysis error:", error);
    return Response.json(
      { error: "Something went wrong while loading the analysis." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/analyses/[id]">
) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Please sign in." }, { status: 401 });
    }
    const { id } = await ctx.params;
    const deleted = await deleteAnalysisForUser(userId, id);
    if (!deleted) {
      return Response.json({ error: "Analysis not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Delete analysis error:", error);
    return Response.json(
      { error: "Something went wrong while deleting the analysis." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/analyses/[id]">
) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Please sign in." }, { status: 401 });
    }
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const appliedFixes = body?.appliedFixes;
    if (
      !Array.isArray(appliedFixes) ||
      !appliedFixes.every((l) => typeof l === "string")
    ) {
      return Response.json(
        { error: "appliedFixes must be an array of strings." },
        { status: 400 }
      );
    }
    const updated = await setAnalysisAppliedFixes(userId, id, appliedFixes);
    if (!updated) {
      return Response.json({ error: "Analysis not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Update analysis error:", error);
    return Response.json(
      { error: "Something went wrong while updating the analysis." },
      { status: 500 }
    );
  }
}

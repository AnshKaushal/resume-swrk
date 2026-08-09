import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { parseResume } from "@/lib/resume-parser"
import { analyseResume, isRateLimitError, type AiContext } from "@/lib/analyse"
import {
  consumeAnalysisQuota,
  getEntitlement,
  getOrCreateUser,
  refundAnalysisQuota,
  saveAnalysisForUser,
} from "@/lib/analysis-store"
import AnalysisModel from "@/lib/models/analysis"
import { sanitizeAnalysisForFree, lockedInsightCounts } from "@/lib/plan-gates"
import { sendWelcomeAnalysisEmail } from "@/lib/mail"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      return Response.json(
        { error: "Please sign in to analyse your resume." },
        { status: 401 },
      )
    }

    const entitlement = await getEntitlement(userId, {})
    if (entitlement.remaining !== null && entitlement.remaining <= 0) {
      return Response.json(
        {
          error:
            "You've reached your plan's analysis limit. Upgrade to Pro for unlimited analyses.",
          limitReached: true,
          plan: entitlement.plan,
          remaining: entitlement.remaining,
        },
        { status: 402 },
      )
    }

    // Reject oversized uploads before formData() buffers the whole body into
    // memory. The 5 MB file check alone happens too late: the body arrives
    // fully buffered before we can read the file out of it.
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 6 * 1024 * 1024) {
      return Response.json(
        {
          error: "The uploaded file is too large. Maximum size is 5 MB.",
        },
        { status: 413 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const targetRole = formData.get("targetRole")
    const jobDescription = formData.get("jobDescription")

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Please upload a resume file (PDF, DOCX, or TXT)." },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseResume(buffer, file.name)

    if (parsed.text.length < 50) {
      return Response.json(
        {
          error:
            "Could not extract enough text from the file. It may be an image-based PDF.",
        },
        { status: 422 },
      )
    }

    const targetRoleStr =
      typeof targetRole === "string" && targetRole.trim()
        ? targetRole.trim().slice(0, 200)
        : ""
    const jobDescriptionStr =
      typeof jobDescription === "string" && jobDescription.trim()
        ? jobDescription.trim().slice(0, 8_000)
        : undefined

    const aiContext = readAiContext(formData)

    const unlocked = entitlement.plan !== "free"

    // Reserve quota BEFORE calling the model, not after. The pre-check above
    // is TOCTOU-racy, so without this a burst of concurrent requests could
    // each pass the check and then all hit Gemini before any quota is consumed
    // (free token burn). If the AI call fails, the credit is refunded.
    const reserved = await consumeAnalysisQuota(userId, {})
    if (!reserved && !unlocked) {
      return Response.json(
        {
          error:
            "You've reached your plan's analysis limit. Upgrade to Pro for unlimited analyses.",
          limitReached: true,
          plan: entitlement.plan,
          remaining: 0,
        },
        { status: 402 },
      )
    }

    let analysis: Awaited<ReturnType<typeof analyseResume>>
    try {
      analysis = await analyseResume(parsed.text, {
        targetRole: targetRoleStr || undefined,
        jobDescription: jobDescriptionStr,
        aiContext,
      })
    } catch (error) {
      // The AI call failed, so nothing was produced - give the credit back.
      if (reserved) await refundAnalysisQuota(userId, {})
      throw error
    }

    const payload = {
      fileName: parsed.fileName,
      fileType: parsed.fileType,
      targetRole: targetRoleStr,
      resumeText: parsed.text.slice(0, 50_000),
      analysis,
    }

    const user = await getOrCreateUser(userId, {})
    const isFirstAnalysis =
      (await AnalysisModel.countDocuments({ userId: user._id })) === 0
    const id = await saveAnalysisForUser(
      userId,
      {},
      payload,
      jobDescriptionStr,
      unlocked,
    )

    if (isFirstAnalysis && user.email) {
      const appUrl = (
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      ).replace(/\/+$/, "")
      void sendWelcomeAnalysisEmail({
        to: user.email,
        firstName: user.firstName ?? undefined,
        score: analysis.scores.value,
        passed: analysis.scores.passed,
        majorScores: analysis.majorScores,
        topStrengths: analysis.aiInsights.topStrengths ?? [],
        biggestWeaknesses: analysis.aiInsights.biggestWeaknesses ?? [],
        targetRole: targetRoleStr,
        analysisUrl: `${appUrl}/analyse/${id}`,
      }).catch((e) => console.error("Welcome email failed:", e))
    }

    const responsePayload = unlocked
      ? payload
      : { ...payload, analysis: sanitizeAnalysisForFree(analysis) }

    return Response.json({
      id,
      ...responsePayload,
      plan: entitlement.plan,
      unlocked,
      ...(unlocked
        ? {}
        : lockedInsightCounts(analysis)),
    })
  } catch (error) {
    if (isRateLimitError(error)) {
      console.error("Analyse rate limited:", error)
      return Response.json(
        {
          error:
            "Daily AI analysis limit reached. Please try again in a few minutes.",
        },
        { status: 429, headers: { "Retry-After": "60" } },
      )
    }
    console.error("Analyse error:", error)
    return Response.json(
      {
        error:
          "Something went wrong while analysing the resume. Please try again.",
      },
      { status: 500 },
    )
  }
}

function readAiContext(formData: FormData): AiContext | undefined {
  const strField = (key: string) => {
    const value = formData.get(key)
    return typeof value === "string" && value.trim() ? value.trim() : ""
  }

  const skillsRaw = strField("skillsToHighlight")
  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const context: AiContext = {
    primaryGoal: strField("primaryGoal") || undefined,
    yearsOfExperience: strField("yearsOfExperience") || undefined,
    targetCompanyType: strField("targetCompanyType") || undefined,
    additionalContext: strField("additionalContext") || undefined,
    skillsToHighlight: skills.length ? skills : undefined,
  }

  return Object.values(context).some((v) => v !== undefined)
    ? context
    : undefined
}

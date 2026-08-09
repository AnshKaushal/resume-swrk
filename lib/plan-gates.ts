import type {
  AiInsights,
  AnalysisResult,
  Check,
  SectionKey,
} from "./analyse"
import { normalizeLabel } from "./analyse"

/**
 * Free-plan paywall. Locked items are served DUMMY placeholder content by the
 * server (not just blurred on the client), so stripping the CSS blur reveals
 * nothing real. Real content arrives only after the ₹199 per-analysis unlock.
 */

/** One whole section locked on free as the conversion hook. */
export const LOCKED_SECTION: SectionKey = "jobMatch"

/** A couple of prominent checks locked per remaining section (jobMatch handled by LOCKED_SECTION). */
export const LOCKED_CHECK_LABELS: Record<Exclude<SectionKey, "jobMatch">, string[]> = {
  ats: [
    "ATS-friendly formatting (no tables, text boxes, complex layouts)",
    "Recruiter searchability score",
  ],
  contentQuality: [
    "Strong professional summary",
    "Weak wording (responsible for, helped)",
  ],
  impactAchievements: [
    "Quantified achievements (numbers, %, $, users)",
    "STAR/CAR style achievement writing",
  ],
  presentationReadability: [
    "Resume length appropriate (1-2 pages)",
    "Reading level",
  ],
}

/** Actionable AI insight cards locked on free (top strengths / biggest weaknesses stay partially visible). */
export const LOCKED_INSIGHTS = {
  skillGapAnalysis: true,
  suggestedKeywords: true,
  rewriteSuggestions: true,
  sectionSuggestions: true,
} as const

/** Of the 5 top strengths / biggest weaknesses the AI returns, free shows the first N; the rest are full-analysis only. */
export const VISIBLE_STRENGTHS_COUNT = 2

export const UNLOCK_PRICE = 199

export const DUMMY_LOCKED_CHECK_FEEDBACK =
  "This check is part of the full analysis. Unlock it for ₹199 to reveal the score and tailored feedback."

export const DUMMY_LOCKED_INSIGHT =
  "Unlock the full analysis to reveal the AI's tailored recommendation for this insight."

export function isCheckLockedOnFree(section: SectionKey, label: string): boolean {
  if (section === LOCKED_SECTION) return true
  const locked = LOCKED_CHECK_LABELS[section as Exclude<SectionKey, "jobMatch">]
  if (!locked) return false
  const target = normalizeLabel(label)
  return locked.some((l) => normalizeLabel(l) === target)
}

export function sanitizeCheckForFree(check: Check): Check {
  if (!isCheckLockedOnFree(check.section, check.label)) {
    return { ...check, locked: false }
  }
  // Paywall only failing checks. A passing check reveals its real score and
  // feedback - there is nothing to fix, so locking it just frustrates users.
  if (check.passed) {
    return { ...check, locked: false }
  }
  return {
    ...check,
    score: null,
    passed: false,
    feedback: DUMMY_LOCKED_CHECK_FEEDBACK,
    locked: true,
  }
}

export function sanitizeAnalysisForFree(analysis: AnalysisResult): AnalysisResult {
  const checks: Check[] = analysis.checks.map(sanitizeCheckForFree)

  const aiInsights: AiInsights = { ...analysis.aiInsights }
  if (LOCKED_INSIGHTS.skillGapAnalysis) {
    aiInsights.skillGapAnalysis = [DUMMY_LOCKED_INSIGHT]
  }
  if (LOCKED_INSIGHTS.suggestedKeywords) {
    aiInsights.suggestedKeywords = [DUMMY_LOCKED_INSIGHT]
  }
  if (LOCKED_INSIGHTS.rewriteSuggestions) {
    aiInsights.rewriteSuggestions = DUMMY_LOCKED_INSIGHT
  }
  if (LOCKED_INSIGHTS.sectionSuggestions) {
    aiInsights.sectionSuggestions = [DUMMY_LOCKED_INSIGHT]
  }
  // Hide all but the first N strengths/weaknesses on free; the first N stay visible.
  aiInsights.topStrengths = analysis.aiInsights.topStrengths.slice(
    0,
    VISIBLE_STRENGTHS_COUNT,
  )
  aiInsights.biggestWeaknesses = analysis.aiInsights.biggestWeaknesses.slice(
    0,
    VISIBLE_STRENGTHS_COUNT,
  )

  return {
    ...analysis,
    scores: { ...analysis.scores },
    majorScores: { ...analysis.majorScores },
    checks,
    aiInsights,
  }
}

/** How many strengths/weaknesses were hidden for the free plan (0 when unlocked). */
export function lockedInsightCounts(analysis: AnalysisResult): {
  strengths: number
  weaknesses: number
} {
  return {
    strengths: Math.max(
      0,
      (analysis.aiInsights.topStrengths?.length ?? 0) - VISIBLE_STRENGTHS_COUNT,
    ),
    weaknesses: Math.max(
      0,
      (analysis.aiInsights.biggestWeaknesses?.length ?? 0) -
        VISIBLE_STRENGTHS_COUNT,
    ),
  }
}

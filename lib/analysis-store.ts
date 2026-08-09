import db from "./db"
import UserModel from "./models/user"
import AnalysisModel from "./models/analysis"
import type { AnalyseResponse } from "./analyse"
import { PLAN_CONFIG, type PlanId } from "./plans"
import { sanitizeCheckForFree } from "./plan-gates"
import { isAdminUser } from "./admin"

export type UserInfo = {
  email?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

export type Entitlement = {
  plan: PlanId
  /** remaining analyses; null = unlimited */
  remaining: number | null
  /** monthly reset date (free/pro) */
  resetAt: Date | null
}

export function getDefaultPlan(): PlanId {
  return "free"
}

const FREE_LIMIT = PLAN_CONFIG.free.analysesLimit ?? 2

async function resolveVerifiedEmail(): Promise<string | undefined> {
  try {
    const { currentUser } = await import("@clerk/nextjs/server")
    const cu = await currentUser()
    if (!cu) return undefined
    // Only a verified email can reclaim a prior account. An attacker who
    // registers with someone else's (unverified) email address must not be
    // able to take over that account's analyses and purchases.
    const verified = cu.emailAddresses?.find(
      (e) =>
        e.verification?.status === "verified" ||
        e.verification?.strategy === "from_oauth",
    )
    return verified?.emailAddress ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Reclaims an existing account for a user re-signing up with the same email
 * after deleting their Clerk account (anti-spam: blocks free-plan churn).
 *
 * The old record is REPOINTED to the new Clerk identity (not deleted) so a
 * second delete/recreate cycle finds nothing new. Plan is reverted to free:
 * - ex-Pro accounts get the standard free allowance only.
 * - ex-Free / ex-One-time accounts keep exactly the free analyses left
 *   (unused one-time credits are dropped). No extra, no less.
 */
async function reclaimPriorAccount(
  clerkId: string,
  email: string,
  info: UserInfo,
): Promise<boolean> {
  const prior = await UserModel.findOne({ email })
  if (!prior) return false

  const remaining = prior.analysesRemaining ?? 0
  const paid = prior.paidAnalysesRemaining ?? 0

  let freeRemaining: number
  if (prior.plan === "pro") {
    freeRemaining = FREE_LIMIT
  } else {
    freeRemaining = Math.min(Math.max(0, remaining - paid), FREE_LIMIT)
  }

  await UserModel.updateOne(
    { _id: prior._id },
    {
      $set: {
        clerkId,
        plan: "free",
        analysesRemaining: freeRemaining,
        paidAnalysesRemaining: 0,
        planResetAt: new Date(Date.now() + MONTH_MS),
        oneTimePurchasedAt: null,
        razorpayOrderId: null,
        razorpayAnalysisId: null,
        razorpaySubscriptionId: null,
        email,
        firstName: info.firstName ?? prior.firstName,
        lastName: info.lastName ?? prior.lastName,
        avatarUrl: info.avatarUrl ?? prior.avatarUrl,
      },
    },
  )
  return true
}

export async function getOrCreateUser(clerkId: string, info: UserInfo) {
  await db()
  let user = await UserModel.findOne({ clerkId })
  if (user) return user

  const email = (await resolveVerifiedEmail())?.toLowerCase().trim()

  if (email && (await reclaimPriorAccount(clerkId, email, info))) {
    return (await UserModel.findOne({ clerkId }))!
  }

  try {
    user = await UserModel.create({
      clerkId,
      email: email ?? `${clerkId}@clerk.dev`,
      firstName: info.firstName,
      lastName: info.lastName,
      avatarUrl: info.avatarUrl,
      plan: "free",
      analysesRemaining: FREE_LIMIT,
      planResetAt: new Date(Date.now() + MONTH_MS),
    })
    return user
  } catch (err) {
    // Same-email race (or a record created a moment ago) → reclaim instead.
    if (
      email &&
      (err as { code?: number })?.code === 11000 &&
      (await reclaimPriorAccount(clerkId, email, info))
    ) {
      return (await UserModel.findOne({ clerkId }))!
    }
    throw err
  }
}

function monthlyResetNeeded(user: {
  plan: string
  planResetAt?: Date | null
}): boolean {
  if (user.plan === "one-time") return false
  if (!user.planResetAt) return true
  return user.planResetAt.getTime() <= Date.now()
}

export async function getEntitlement(
  clerkId: string,
  info: UserInfo,
): Promise<Entitlement> {
  const user = await getOrCreateUser(clerkId, info)
  if (isAdminUser(user.clerkId, user.email)) {
    return { plan: "pro", remaining: null, resetAt: null }
  }
  const plan = (
    PLAN_CONFIG[user.plan as PlanId] ? user.plan : getDefaultPlan()
  ) as PlanId

  if (monthlyResetNeeded(user)) {
    await UserModel.updateOne(
      { _id: user._id },
      {
        analysesRemaining: PLAN_CONFIG[plan].analysesLimit,
        paidAnalysesRemaining: 0,
        planResetAt: new Date(Date.now() + MONTH_MS),
      },
    )
    const resetUser = await UserModel.findById(user._id)
    return {
      plan,
      remaining:
        PLAN_CONFIG[plan].analysesLimit === null
          ? null
          : (resetUser?.analysesRemaining ?? 0),
      resetAt: resetUser?.planResetAt ?? null,
    }
  }

  return {
    plan,
    remaining:
      PLAN_CONFIG[plan].analysesLimit === null
        ? null
        : (user.analysesRemaining ?? 0),
    resetAt: user.planResetAt ?? null,
  }
}

/**
 * Attempts to consume one analysis against the user's quota.
 * Returns false when the user has no allowance left (or an invalid plan).
 * Pro (unlimited) always returns true.
 */
export async function consumeAnalysisQuota(
  clerkId: string,
  info: UserInfo,
): Promise<boolean> {
  const user = await getOrCreateUser(clerkId, info)
  if (isAdminUser(user.clerkId, user.email)) return true
  const plan = (
    PLAN_CONFIG[user.plan as PlanId] ? user.plan : getDefaultPlan()
  ) as PlanId

  if (PLAN_CONFIG[plan].analysesLimit === null) return true

  if (monthlyResetNeeded(user)) {
    await UserModel.updateOne(
      { _id: user._id },
      {
        analysesRemaining: PLAN_CONFIG[plan].analysesLimit,
        paidAnalysesRemaining: 0,
        planResetAt: new Date(Date.now() + MONTH_MS),
      },
    )
  }

  // Drains paid (one-time) credits first; free analyses are used only after.
  const result = await UserModel.findOneAndUpdate(
    {
      _id: user._id,
      analysesRemaining: { $gt: 0 },
    },
    [
      {
        $set: {
          analysesRemaining: { $subtract: ["$analysesRemaining", 1] },
          paidAnalysesRemaining: {
            $max: [{ $subtract: ["$paidAnalysesRemaining", 1] }, 0],
          },
        },
      },
    ],
    { updatePipeline: true },
  ).lean()

  return !!result
}

/**
 * Restores one analysis credit after a failed AI call. Called only when quota
 * was reserved (consumed) before the model call but the call then threw, so a
 * user isn't charged a credit for an analysis that never completed. Pro,
 * admin, and other unlimited plans are no-ops.
 */
export async function refundAnalysisQuota(
  clerkId: string,
  info: UserInfo,
): Promise<void> {
  await db()
  const user = await getOrCreateUser(clerkId, info)
  if (isAdminUser(user.clerkId, user.email)) return
  const plan = (
    PLAN_CONFIG[user.plan as PlanId] ? user.plan : getDefaultPlan()
  ) as PlanId
  if (PLAN_CONFIG[plan].analysesLimit === null) return
  await UserModel.updateOne(
    { _id: user._id },
    { $inc: { analysesRemaining: 1 } },
  )
}

export async function grantPlan(
  clerkId: string,
  info: UserInfo,
  planId: PlanId,
  orderId?: string,
): Promise<void> {
  await db()
  const user = await getOrCreateUser(clerkId, info)
  const config = PLAN_CONFIG[planId]
  const now = Date.now()
  await UserModel.updateOne(
    { _id: user._id },
    {
      plan: planId,
      analysesRemaining: config.analysesLimit ?? null,
      paidAnalysesRemaining: 0,
      planResetAt: planId === "one-time" ? null : new Date(now + MONTH_MS),
      oneTimePurchasedAt:
        planId === "one-time" ? new Date(now) : user.oneTimePurchasedAt,
      razorpayOrderId: orderId ?? user.razorpayOrderId,
    },
  )
}

/**
 * Applies a one-time pack purchase. Always ADDS to the user's existing
 * quota (e.g. 2 free remaining + 5 pack = 7; 5 pack + 5 pack = 10) instead
 * of resetting it. Pro is unlimited, so its plan/quota are left untouched.
 */
export async function applyOneTimePack(
  clerkId: string,
  info: UserInfo,
  amount: number,
): Promise<void> {
  await db()
  const user = await getOrCreateUser(clerkId, info)
  if (user.plan === "pro") {
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { oneTimePurchasedAt: new Date() } },
    )
    return
  }
  await UserModel.updateOne(
    { _id: user._id },
    {
      $inc: { analysesRemaining: amount, paidAnalysesRemaining: amount },
      $set: {
        plan: "one-time",
        oneTimePurchasedAt: new Date(),
        planResetAt: null,
      },
    },
  )
}

export async function saveAnalysisForUser(
  clerkId: string,
  info: UserInfo,
  payload: AnalyseResponse,
  jobDescription?: string,
  unlocked: boolean = true,
): Promise<string> {
  const user = await getOrCreateUser(clerkId, info)
  const doc = await AnalysisModel.create({
    userId: user._id,
    fileName: payload.fileName,
    fileType: payload.fileType,
    resumeText: payload.resumeText,
    targetRole: payload.targetRole,
    jobDescription,
    scores: payload.analysis.scores,
    majorScores: payload.analysis.majorScores,
    checks: payload.analysis.checks,
    aiInsights: payload.analysis.aiInsights,
    unlocked,
    appliedFixes: payload.appliedFixes ?? [],
  })
  return doc._id.toString()
}

/** Effectively unlocked when the account has a paid plan, the doc was ₹199-unlocked, or it's the admin. */
export function effectiveUnlocked(
  plan: string,
  docUnlocked: boolean | undefined,
  adminUser: boolean = false,
): boolean {
  return adminUser || plan !== "free" || docUnlocked === true
}

/** Marks an analysis as unlocked after the ₹199 payment. Ownership-checked. */
export async function unlockAnalysis(
  clerkId: string,
  info: UserInfo,
  analysisId: string,
): Promise<boolean> {
  await db()
  const user = await getOrCreateUser(clerkId, info)
  const result = await AnalysisModel.updateOne(
    { _id: analysisId, userId: user._id },
    { $set: { unlocked: true } },
  )
  return result.matchedCount > 0
}

export async function listAnalysesForUser(clerkId: string) {
  await db()
  const user = await UserModel.findOne({ clerkId })
  if (!user) return []
  const docs = await AnalysisModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
  return docs.map((d) => {
    const unlocked = effectiveUnlocked(
      user.plan,
      d.unlocked,
      isAdminUser(user.clerkId, user.email),
    )
    return {
      id: d._id.toString(),
      fileName: d.fileName ?? "",
      fileType: d.fileType ?? "",
      targetRole: d.targetRole ?? "",
      score: d.scores?.value ?? 0,
      passed: d.scores?.passed ?? false,
      createdAt: d.createdAt,
      majorScores: d.majorScores ?? {},
      checks: unlocked
        ? (d.checks ?? [])
        : (d.checks ?? []).map((c) =>
            sanitizeCheckForFree(c as unknown as import("./analyse").Check),
          ),
      appliedFixes: d.appliedFixes ?? [],
      unlocked,
    }
  })
}

export async function getAnalysisForUser(clerkId: string, id: string) {
  await db()
  const user = await UserModel.findOne({ clerkId })
  if (!user) return null
  const doc = await AnalysisModel.findOne({ _id: id, userId: user._id }).lean()
  if (!doc) return null
  const unlocked = effectiveUnlocked(
    user.plan,
    doc.unlocked,
    isAdminUser(user.clerkId, user.email),
  )
  return {
    id: doc._id.toString(),
    fileName: doc.fileName ?? "",
    fileType: doc.fileType ?? "",
    resumeText: doc.resumeText ?? "",
    targetRole: doc.targetRole ?? "",
    unlocked,
    appliedFixes: doc.appliedFixes ?? [],
    analysis: {
      scores: {
        value: doc.scores?.value ?? 0,
        passed: doc.scores?.passed ?? false,
        feedback: doc.scores?.feedback ?? "",
      },
      majorScores: {
        ats: doc.majorScores?.ats ?? 0,
        contentQuality: doc.majorScores?.contentQuality ?? 0,
        impactAchievements: doc.majorScores?.impactAchievements ?? 0,
        jobMatch: doc.majorScores?.jobMatch ?? 0,
        presentationReadability: doc.majorScores?.presentationReadability ?? 0,
      },
      checks: doc.checks ?? [],
      aiInsights: doc.aiInsights ?? {},
    } as AnalyseResponse["analysis"],
  }
}

export async function deleteAnalysisForUser(clerkId: string, id: string) {
  await db()
  const user = await UserModel.findOne({ clerkId })
  if (!user) return false
  const result = await AnalysisModel.deleteOne({ _id: id, userId: user._id })
  return result.deletedCount > 0
}

export async function setAnalysisAppliedFixes(
  clerkId: string,
  id: string,
  appliedFixes: string[],
): Promise<boolean> {
  await db()
  const user = await UserModel.findOne({ clerkId })
  if (!user) return false
  const result = await AnalysisModel.updateOne(
    { _id: id, userId: user._id },
    { $set: { appliedFixes } },
  )
  return result.matchedCount > 0
}

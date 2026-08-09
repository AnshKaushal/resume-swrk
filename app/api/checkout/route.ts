import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PLAN_CONFIG, FULL_ANALYSIS_UNLOCK, type PlanId } from "@/lib/plans"
import { createCheckoutSession, getRazorpay } from "@/lib/razorpay"
import { getOrCreateUser } from "@/lib/analysis-store"
import UserModel from "@/lib/models/user"
import AnalysisModel from "@/lib/models/analysis"

export const runtime = "nodejs"

/**
 * Returns the user's still-pending Razorpay session if one exists and matches
 * the requested checkout kind. A pending order is reused (so a refresh of the
 * checkout page resumes the same payment) and is never silently overwritten -
 * otherwise a user could pay for an orphaned order and receive nothing.
 *
 * A pending full-analysis unlock order (razorpayAnalysisId set) is NOT a plain
 * order: it must never be reused for a plan purchase or treated as a conflict
 * against subscriptions - the unlock path handles its own reuse.
 */
async function findPending(
  user: {
    razorpayOrderId?: string | null
    razorpayAnalysisId?: string | null
    razorpaySubscriptionId?: string | null
  },
  kind: "order" | "subscription",
) {
  if (kind === "order" && user.razorpayOrderId && !user.razorpayAnalysisId) {
    return { kind: "order" as const, id: user.razorpayOrderId }
  }
  if (kind === "subscription" && user.razorpaySubscriptionId) {
    return { kind: "subscription" as const, id: user.razorpaySubscriptionId }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      return Response.json(
        { error: "Please sign in to purchase a plan." },
        { status: 401 },
      )
    }

    const body = await request.json()
    const planId = body?.planId as string | undefined

    if (planId === "full-analysis") {
      return startFullAnalysisUnlock(body, userId)
    }

    if (!planId || !PLAN_CONFIG[planId as PlanId] || planId === "free") {
      return Response.json({ error: "Invalid plan." }, { status: 400 })
    }

    const user = await getOrCreateUser(userId, {})
    const sessionKind = planId === "pro" ? "subscription" : "order"

    // Reuse an in-flight checkout of the same kind instead of overwriting it.
    const pending = await findPending(user, sessionKind)
    if (pending) {
      return Response.json({
        planId,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: PLAN_CONFIG[planId as PlanId].amountPaise,
        orderId: pending.kind === "order" ? pending.id : null,
        subscriptionId:
          pending.kind === "subscription" ? pending.id : null,
      })
    }

    // A different checkout kind is still pending - reject rather than orphan it.
    const otherPending = await findPending(
      user,
      sessionKind === "order" ? "subscription" : "order",
    )

    // A subscription conflict is either a live Pro subscription (plan already
    // pro - never touch it) or an abandoned subscription checkout that was
    // never charged (Pro is only granted on subscription.charged). The latter
    // is cleared so the user isn't permanently blocked.
    if (otherPending?.kind === "subscription") {
      if (user.plan === "pro") {
        return Response.json(
          {
            error:
              "You already have a payment in progress. Complete or cancel it before starting a new one.",
          },
          { status: 409 },
        )
      }
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { razorpaySubscriptionId: null } },
      )
    }

    // A pending order of a different kind (one-time pack, or a full-analysis
    // unlock) also blocks a plan purchase, since creating a new order would
    // overwrite (orphan) that unlock. Only a provably-paid order is still "in
    // progress"; an abandoned one (modal dismissed before cancel cleanup
    // existed) is cleared so the user can start a new checkout.
    const orderConflict =
      otherPending?.kind === "order"
        ? otherPending.id
        : user.razorpayOrderId && user.razorpayAnalysisId
          ? user.razorpayOrderId
          : null

    if (orderConflict) {
      let paid = false
      try {
        const order = await getRazorpay().orders.fetch(orderConflict)
        paid = (order as { status?: string }).status === "paid"
      } catch {
        paid = true // can't verify - assume live rather than orphan a payment
      }
      if (paid) {
        return Response.json(
          {
            error:
              "You already have a payment in progress. Complete or cancel it before starting a new one.",
          },
          { status: 409 },
        )
      }
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { razorpayOrderId: null, razorpayAnalysisId: null } },
      )
    }

    const receipt = `swrk-${userId.slice(-8)}-${Date.now()}`
    const session = await createCheckoutSession(
      planId as PlanId,
      receipt,
      { planId, clerkId: userId },
    )

    if (session.kind === "order") {
      await UserModel.updateOne(
        { _id: user._id },
        {
          razorpayOrderId: session.id,
          razorpayAnalysisId: null,
          razorpaySubscriptionId: null,
        },
      )
    } else {
      await UserModel.updateOne(
        { _id: user._id },
        {
          razorpaySubscriptionId: session.id,
          razorpayOrderId: null,
          razorpayAnalysisId: null,
        },
      )
    }

    return Response.json({
      planId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: session.amount,
      orderId: session.kind === "order" ? session.id : null,
      subscriptionId: session.kind === "subscription" ? session.id : null,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return Response.json(
      {
        error:
          "Something went wrong while starting checkout. Please try again.",
      },
      { status: 500 },
    )
  }
}

async function startFullAnalysisUnlock(
  body: Record<string, unknown>,
  userId: string,
): Promise<Response> {
  const analysisId = body?.analysisId as string | undefined
  if (typeof analysisId !== "string" || !analysisId.trim()) {
    return Response.json(
      { error: "An analysis id is required to unlock it." },
      { status: 400 },
    )
  }

  const user = await getOrCreateUser(userId, {})
  const owned = await AnalysisModel.exists({
    _id: analysisId,
    userId: user._id,
  })
  if (!owned) {
    return Response.json(
      { error: "Analysis not found or does not belong to you." },
      { status: 404 },
    )
  }

  // Reuse an in-flight unlock for the SAME analysis.
  if (user.razorpayOrderId && user.razorpayAnalysisId === analysisId) {
    return Response.json({
      planId: "full-analysis",
      analysisId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: FULL_ANALYSIS_UNLOCK.amountPaise,
      orderId: user.razorpayOrderId,
      subscriptionId: null,
    })
  }

  // A different checkout is pending - don't orphan it. Only a provably-paid
  // order is still "in progress"; abandoned unpaid sessions (modal dismissed
  // before cancel cleanup existed) are cleared so the user isn't blocked.
  if (user.razorpayOrderId) {
    let paid = false
    try {
      const order = await getRazorpay().orders.fetch(user.razorpayOrderId)
      paid = (order as { status?: string }).status === "paid"
    } catch {
      paid = true // can't verify - assume live rather than orphan a payment
    }
    if (paid) {
      return Response.json(
        {
          error:
            "You already have a payment in progress. Complete or cancel it before unlocking this analysis.",
        },
        { status: 409 },
      )
    }
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { razorpayOrderId: null, razorpayAnalysisId: null } },
    )
  }

  if (user.razorpaySubscriptionId) {
    if (user.plan === "pro") {
      return Response.json(
        {
          error:
            "You already have a payment in progress. Complete or cancel it before unlocking this analysis.",
        },
        { status: 409 },
      )
    }
    // Abandoned subscription checkout that was never charged.
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { razorpaySubscriptionId: null } },
    )
  }

  const receipt = `swrk-${userId.slice(-8)}-${Date.now()}`
  const session = await createCheckoutSession(
    "full-analysis",
    receipt,
    { planId: "full-analysis", clerkId: userId, analysisId },
  )

  await UserModel.updateOne(
    { _id: user._id },
    {
      razorpayOrderId: session.id,
      razorpayAnalysisId: analysisId,
      razorpaySubscriptionId: null,
    },
  )

  return Response.json({
    planId: "full-analysis",
    analysisId,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: session.amount,
    orderId: session.id,
    subscriptionId: null,
  })
}

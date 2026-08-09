import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { verifyPayment } from "@/lib/razorpay"
import {
  applyOneTimePack,
  getEntitlement,
  grantPlan,
  unlockAnalysis,
} from "@/lib/analysis-store"
import UserModel from "@/lib/models/user"
import { PLAN_CONFIG, FULL_ANALYSIS_UNLOCK } from "@/lib/plans"
import { recordPayment } from "@/lib/payments"

export const runtime = "nodejs"

/**
 * Instantly applies a purchase after the Razorpay handler success callback.
 * Idempotent: if the webhook already applied the grant (order id cleared),
 * this responds "already-processed" so the client can still refresh UI.
 */
export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Please sign in." }, { status: 401 })
    }

    const body = await request.json()
    const paymentId = body?.paymentId as string | undefined
    const orderId = body?.orderId as string | undefined
    const subscriptionId = body?.subscriptionId as string | undefined

    if (typeof paymentId !== "string") {
      return Response.json(
        { error: "Payment id is required." },
        { status: 400 },
      )
    }

    // Pro subscription purchases are matched by subscription id.
    if (typeof subscriptionId === "string" && subscriptionId) {
      const subUser = await UserModel.findOne({
        clerkId: userId,
        razorpaySubscriptionId: subscriptionId,
      })
      if (!subUser) {
        const entitlement = await getEntitlement(userId, {})
        return Response.json({
          ok: true,
          kind: "already-processed",
          entitlement,
        })
      }
      if (subUser.plan === "pro") {
        const entitlement = await getEntitlement(userId, {})
        return Response.json({ ok: true, kind: "pro", entitlement })
      }
      const payment = await verifyPayment(
        paymentId,
        "subscription",
        subscriptionId,
      )
      if (!payment) {
        return Response.json(
          { error: "Payment could not be verified." },
          { status: 400 },
        )
      }
      // A captured subscription payment must actually be for the Pro amount,
      // otherwise a random captured payment id could grant Pro.
      if (payment.amount !== PLAN_CONFIG.pro.amountPaise) {
        return Response.json(
          { error: "Payment amount does not match the Pro plan." },
          { status: 400 },
        )
      }
      await grantPlan(userId, {}, "pro", undefined)
      await recordPayment({
        clerkId: userId,
        kind: "pro",
        amount: PLAN_CONFIG.pro.price,
        orderId,
        paymentId,
        subscriptionId,
      })
      const entitlement = await getEntitlement(userId, {})
      return Response.json({ ok: true, kind: "pro", entitlement })
    }

    if (typeof orderId !== "string") {
      return Response.json({ error: "Order id is required." }, { status: 400 })
    }

    // Read-only lookup to learn which purchase this order maps to.
    const user = await UserModel.findOne({
      clerkId: userId,
      razorpayOrderId: orderId,
    })

    // Already granted (webhook beat us) or an unknown order - nothing to do.
    if (!user) {
      const entitlement = await getEntitlement(userId, {})
      return Response.json({ ok: true, kind: "already-processed", entitlement })
    }

    const payment = await verifyPayment(paymentId, orderId)
    if (!payment) {
      return Response.json(
        { error: "Payment could not be verified." },
        { status: 400 },
      )
    }

    const analysisId: string | undefined = user.razorpayAnalysisId ?? undefined

    // The payment must be for the expected amount of the purchase being granted.
    const expectedAmountPaise = analysisId
      ? FULL_ANALYSIS_UNLOCK.amountPaise
      : PLAN_CONFIG["one-time"].amountPaise
    if (payment.amount !== expectedAmountPaise) {
      return Response.json(
        { error: "Payment amount does not match the purchase." },
        { status: 400 },
      )
    }

    // Atomic claim: clear razorpayOrderId while matching it, so the confirm
    // handler and the payment.captured webhook can never both pass the check
    // and double-grant. Only the request that clears the order id proceeds.
    const claimed = await UserModel.findOneAndUpdate(
      { _id: user._id, razorpayOrderId: orderId },
      { $set: { razorpayOrderId: null } },
      { new: false },
    )
    if (!claimed) {
      const entitlement = await getEntitlement(userId, {})
      return Response.json({ ok: true, kind: "already-processed", entitlement })
    }

    if (analysisId) {
      await unlockAnalysis(userId, {}, analysisId)
      await UserModel.updateOne(
        { _id: user._id },
        { razorpayAnalysisId: null },
      )
      await recordPayment({
        clerkId: userId,
        kind: "unlock",
        amount: FULL_ANALYSIS_UNLOCK.price,
        orderId,
        paymentId,
        analysisId,
      })
      const entitlement = await getEntitlement(userId, {})
      return Response.json({
        ok: true,
        kind: "unlock",
        analysisId,
        entitlement,
      })
    }

    await applyOneTimePack(userId, {}, PLAN_CONFIG["one-time"].analysesLimit!)
    await recordPayment({
      clerkId: userId,
      kind: "one-time",
      amount: PLAN_CONFIG["one-time"].price,
      orderId,
      paymentId,
    })

    const entitlement = await getEntitlement(userId, {})
    return Response.json({ ok: true, kind: "one-time", entitlement })
  } catch (error) {
    console.error("Payment confirm error:", error)
    return Response.json(
      {
        error:
          "Something went wrong while confirming your payment. Please try again.",
      },
      { status: 500 },
    )
  }
}

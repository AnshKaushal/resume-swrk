import { NextRequest } from "next/server"
import { verifyWebhookSignature } from "@/lib/razorpay"
import {
  applyOneTimePack,
  grantPlan,
  unlockAnalysis,
} from "@/lib/analysis-store"
import UserModel from "@/lib/models/user"
import { PLAN_CONFIG, FULL_ANALYSIS_UNLOCK } from "@/lib/plans"
import { recordPayment, revokePayment } from "@/lib/payments"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature || !verifyWebhookSignature(body, signature)) {
      return Response.json({ error: "Invalid signature." }, { status: 400 })
    }

    const event = JSON.parse(body)
    const entity =
      event?.payload?.[event?.event?.split(".")[0]]?.entity ?? null

    if (!entity) {
      return Response.json({ received: true })
    }

    if (event.event === "payment.captured") {
      const orderId: string | undefined = entity.order_id
      const paymentId: string | undefined = entity.id

      if (orderId) {
        // Atomic claim: clear razorpayOrderId while matching it so confirm and
        // webhook can never both pass and double-grant.
        const claimed = await UserModel.findOneAndUpdate(
          { razorpayOrderId: orderId },
          { $set: { razorpayOrderId: null } },
          { new: false },
        )
        if (claimed) {
          const analysisId: string | undefined =
            claimed.razorpayAnalysisId ?? undefined
          if (analysisId) {
            await unlockAnalysis(claimed.clerkId, {}, analysisId)
            await UserModel.updateOne(
              { _id: claimed._id },
              { razorpayAnalysisId: null },
            )
            await recordPayment({
              clerkId: claimed.clerkId,
              kind: "unlock",
              amount: FULL_ANALYSIS_UNLOCK.price,
              orderId,
              paymentId,
              analysisId,
            })
          } else {
            await applyOneTimePack(
              claimed.clerkId,
              {},
              PLAN_CONFIG["one-time"].analysesLimit!,
            )
            await recordPayment({
              clerkId: claimed.clerkId,
              kind: "one-time",
              amount: PLAN_CONFIG["one-time"].price,
              orderId,
              paymentId,
            })
          }
        }
      }
    }

    if (event.event === "payment.refunded") {
      // Revoke whatever the refunded payment granted. The refunded entity's
      // `id` is the original payment id, not the refund id, so it matches the
      // payment we recorded at grant time. Idempotent via the refunded flag.
      const paymentId: string | undefined = entity.id
      if (paymentId) {
        await revokePayment(paymentId)
      }
    }

    // Only subscription.charged grants Pro: that's the event that confirms a
    // payment was actually captured. subscription.activated fires on the same
    // first charge, so handling both would double-grant, and relying on it
    // alone could grant Pro from a state that never produced a charge.
    if (event.event === "subscription.charged") {
      // For this event the primary entity is the subscription (its `id` is
      // the subscription id). Fall back to a nested payment entity's
      // subscription_id defensively in case a different Razorpay payload shape
      // is delivered, so a renewal can never be mis-routed or dropped.
      const subscriptionId: string | undefined =
        entity?.id ?? entity?.subscription_id
      const paymentEntity =
        event?.payload?.payment?.entity ?? null
      const paymentId: string | undefined =
        paymentEntity?.id ?? entity?.payment_id
      // A captured renewal must actually be for the Pro amount, otherwise a
      // mismatched or replayed charge shouldn't extend the paid entitlement.
      const chargedAmount: number | undefined =
        paymentEntity?.amount ?? entity?.amount
      if (
        subscriptionId &&
        (typeof chargedAmount !== "number" ||
          chargedAmount === PLAN_CONFIG.pro.amountPaise)
      ) {
        const user = await UserModel.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (user) {
          await grantPlan(user.clerkId, {}, "pro", undefined)
          await recordPayment({
            clerkId: user.clerkId,
            kind: "pro",
            amount: PLAN_CONFIG.pro.price,
            paymentId,
            subscriptionId,
          })
        }
      }
    }

    if (event.event === "subscription.cancelled") {
      const subscriptionId: string | undefined =
        entity?.id ?? entity?.subscription_id
      if (subscriptionId) {
        const user = await UserModel.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (user && user.plan === "pro") {
          await grantPlan(user.clerkId, {}, "free", undefined)
          // Clear the subscription ref so a late/duplicate cancellation
          // event can never downgrade a NEW subscription the user buys later.
          await UserModel.updateOne(
            { _id: user._id },
            { razorpaySubscriptionId: null },
          )
        }
      }
    }

    if (
      event.event === "subscription.halted" ||
      event.event === "subscription.completed"
    ) {
      // The subscription stopped auto-renewing (repeated payment failures or
      // the plan ended). Pro is a recurring plan, so without an active
      // subscription the user must drop back to free rather than keep the
      // paid entitlement without being charged.
      const subscriptionId: string | undefined =
        entity?.id ?? entity?.subscription_id
      if (subscriptionId) {
        const user = await UserModel.findOne({
          razorpaySubscriptionId: subscriptionId,
        })
        if (user && user.plan === "pro") {
          await grantPlan(user.clerkId, {}, "free", undefined)
          await UserModel.updateOne(
            { _id: user._id },
            { razorpaySubscriptionId: null },
          )
        }
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    // Return 500 so Razorpay retries; swallowing errors here silently drifts
    // entitlements/revenue from actual charges.
    return Response.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    )
  }
}

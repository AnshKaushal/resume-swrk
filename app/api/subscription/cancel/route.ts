import { auth } from "@clerk/nextjs/server"
import {
  cancelSubscription,
  getSubscriptionStatus,
  isInactiveSubscription,
} from "@/lib/razorpay"
import { getEntitlement, grantPlan } from "@/lib/analysis-store"
import UserModel from "@/lib/models/user"

export const runtime = "nodejs"

/**
 * Cancels the user's Pro subscription immediately on Razorpay, then
 * downgrades them to free locally so the app never sells Pro that isn't
 * actually being billed. Idempotent-ish: cancelling twice (or an already
 * cancelled subscription) still lands on free.
 *
 * If the Razorpay cancel call itself fails, the local downgrade is only
 * applied when Razorpay reports the subscription is already inactive. A
 * transient cancel failure on an ACTIVE subscription keeps Pro + the
 * subscription reference, so the user is never charged while downgraded.
 */
export async function POST() {
  try {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Unauthorized." }, { status: 401 })
    }

    const user = await UserModel.findOne({ clerkId: userId })
    if (!user) {
      return Response.json({ error: "Account not found." }, { status: 404 })
    }

    const subscriptionId = user.razorpaySubscriptionId
    if (!subscriptionId) {
      return Response.json(
        { error: "You don't have an active subscription to cancel." },
        { status: 400 },
      )
    }

    let cancelFailed = false
    try {
      await cancelSubscription(subscriptionId)
    } catch {
      cancelFailed = true
    }

    if (cancelFailed) {
      // Only proceed if Razorpay confirms the subscription is already dead.
      // A network blip shouldn't downgrade a still-billed user.
      const status = await getSubscriptionStatus(subscriptionId)
      if (!isInactiveSubscription(status)) {
        return Response.json(
          {
            error:
              "We couldn't cancel your subscription with Razorpay. Please try again in a moment.",
          },
          { status: 502 },
        )
      }
    }

    await grantPlan(userId, {}, "free", undefined)
    await UserModel.updateOne(
      { _id: user._id },
      { razorpaySubscriptionId: null },
    )

    const entitlement = await getEntitlement(userId, {})
    return Response.json({ ok: true, entitlement })
  } catch (error) {
    console.error("Subscription cancel error:", error)
    return Response.json(
      {
        error:
          "Something went wrong while cancelling your subscription. Please try again.",
      },
      { status: 500 },
    )
  }
}

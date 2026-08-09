import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getOrCreateUser } from "@/lib/analysis-store"
import UserModel from "@/lib/models/user"
import { getRazorpay } from "@/lib/razorpay"

export const runtime = "nodejs"

/**
 * Abandons an in-flight Razorpay session after the user dismisses the checkout
 * modal (or a payment fails). Without this, a cancelled order stays pinned on
 * the user record and /api/checkout rejects every later purchase with "You
 * already have a payment in progress."
 *
 * Safety guards so a real grant is never orphand:
 * - An order that actually got captured is left alone - the confirm/webhook
 *   path still needs razorpayOrderId to match it and apply the grant.
 * - An active Pro subscription keeps its id so renewal/cancel webhooks can
 *   still match it; only a not-yet-active subscription checkout is cleared.
 */
export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Please sign in." }, { status: 401 })
    }

    const body = await request.json()
    const kind = body?.kind as "order" | "subscription" | undefined
    if (kind !== "order" && kind !== "subscription") {
      return Response.json({ error: "Invalid checkout kind." }, { status: 400 })
    }

    const user = await getOrCreateUser(userId, {})

    if (kind === "order") {
      let paid = false
      if (user.razorpayOrderId) {
        try {
          const order = await getRazorpay().orders.fetch(user.razorpayOrderId)
          paid = (order as { status?: string }).status === "paid"
        } catch {
          paid = false
        }
      }
      if (!paid) {
        await UserModel.updateOne(
          { _id: user._id },
          { $set: { razorpayOrderId: null, razorpayAnalysisId: null } },
        )
      }
    } else if (user.plan !== "pro") {
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { razorpaySubscriptionId: null } },
      )
    }

    return Response.json({ ok: true })
  } catch (error) {
    // Never break the checkout UX over a best-effort cleanup call.
    console.error("Cancel checkout error:", error)
    return Response.json({ ok: true })
  }
}

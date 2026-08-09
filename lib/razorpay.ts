import Razorpay from "razorpay"
import { createHmac, timingSafeEqual } from "node:crypto"
import { PLAN_CONFIG, FULL_ANALYSIS_UNLOCK, type PlanId } from "./plans"

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? ""
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? ""

export function getRazorpay(): Razorpay {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay keys are not configured.")
  }
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
}

let cachedProPlanId: string | null = null
let cachedProPlanAmount: number | null = null

async function getOrCreateProPlanId(): Promise<string> {
  const config = PLAN_CONFIG.pro
  if (cachedProPlanId && cachedProPlanAmount === config.amountPaise) {
    return cachedProPlanId
  }
  const rzp = getRazorpay()

  const plans = await rzp.plans.all({ count: 50 })
  const existing = plans.items.find(
    (p) =>
      p.period === "monthly" &&
      p.interval === 1 &&
      p.item?.name === "SWRK Optimizer Pro (Monthly)" &&
      Number(p.item.amount) === config.amountPaise,
  )
  if (existing) {
    cachedProPlanId = existing.id
    cachedProPlanAmount = config.amountPaise
    return existing.id
  }

  // Razorpay plans are immutable, so a same-named plan with a different price
  // than the current config can't be reused - create a fresh one so the amount
  // charged always matches what /api/payments/confirm records.
  const plan = await rzp.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: "SWRK Optimizer Pro (Monthly)",
      amount: config.amountPaise,
      currency: "INR",
      description: "Pro plan - unlimited resume analyses",
    },
  })
  cachedProPlanId = plan.id
  cachedProPlanAmount = config.amountPaise
  return plan.id
}

export type CheckoutPlanId = PlanId | "full-analysis"

export type CheckoutSession =
  | { kind: "order"; id: string; amount: number }
  | { kind: "subscription"; id: string; amount: number }

export async function createCheckoutSession(
  planId: CheckoutPlanId,
  receipt: string,
  notes: Record<string, string | number>,
): Promise<CheckoutSession> {
  if (planId === "full-analysis") {
    const order = await getRazorpay().orders.create({
      amount: FULL_ANALYSIS_UNLOCK.amountPaise,
      currency: "INR",
      receipt,
      notes,
    })
    return { kind: "order", id: order.id, amount: FULL_ANALYSIS_UNLOCK.amountPaise }
  }

  const config = PLAN_CONFIG[planId]
  if (planId === "one-time") {
    const order = await getRazorpay().orders.create({
      amount: config.amountPaise,
      currency: "INR",
      receipt,
      notes,
    })
    return { kind: "order", id: order.id, amount: config.amountPaise }
  }

  if (planId === "pro") {
    const planIdValue = await getOrCreateProPlanId()
    // total_count: 0 = auto-renewing subscription that runs until cancelled.
    // A fixed count (e.g. 12) would silently stop charging after that many
    // cycles, turning the recurring plan into a de-facto one-time charge.
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planIdValue,
      total_count: 0,
      customer_notify: 1,
      notes,
    })
    return {
      kind: "subscription",
      id: subscription.id,
      amount: config.amountPaise,
    }
  }

  throw new Error("This plan cannot be purchased.")
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  try {
    // Compare the HMACs in constant time so an attacker can't learn the
    // secret byte-by-byte through timing side channels.
    const expected = createHmac("sha256", KEY_SECRET)
      .update(body)
      .digest()
    const received = Buffer.from(signature, "hex")
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch {
    return false
  }
}

/**
 * Cancels a subscription immediately on Razorpay's side. Pass false so the
 * subscription stops right away and no further cycles are charged; the caller
 * is responsible for downgrading the user's plan in the app DB.
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await getRazorpay().subscriptions.cancel(subscriptionId, false)
}

/**
 * Fetches a subscription's current status. Used to decide whether a failed
 * cancel request is safe to downgrade: if Razorpay reports a terminal status
 * the subscription is already dead and the local downgrade is correct, but if
 * it's still active a transient cancel failure must NOT downgrade locally
 * (the user would be charged yet left on free).
 */
export async function getSubscriptionStatus(
  subscriptionId: string,
): Promise<string | null> {
  try {
    const sub = await getRazorpay().subscriptions.fetch(subscriptionId)
    return (sub as { status?: string } | null)?.status ?? null
  } catch {
    return null
  }
}

const INACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "cancelled",
  "halted",
  "completed",
  "expired",
  "paused",
])

export function isInactiveSubscription(status: string | null): boolean {
  return !!status && INACTIVE_SUBSCRIPTION_STATUSES.has(status)
}

export type RazorpayPayment = {
  id: string
  status: string
  order_id: string
  amount?: number
  subscription_id?: string
}

/**
 * Fetches a payment from Razorpay server-side and checks it was captured.
 * When `expectedOrderId` is given (and not "subscription"), the payment must
 * also belong to that order. When `expectedOrderId` is "subscription" and
 * `expectedSubscriptionId` is given, the payment must belong to that
 * subscription. Used by /api/payments/confirm for instant grants.
 */
export async function verifyPayment(
  paymentId: string,
  expectedOrderId?: string,
  expectedSubscriptionId?: string,
): Promise<RazorpayPayment | null> {
  try {
    const payment = (await getRazorpay().payments.fetch(
      paymentId,
    )) as unknown as RazorpayPayment
    if (payment?.status !== "captured") return null
    if (expectedOrderId && expectedOrderId !== "subscription") {
      if (payment?.order_id !== expectedOrderId) return null
    }
    // A captured payment must actually belong to this user's subscription,
    // otherwise a replayed payment_id from an old subscription could grant Pro.
    if (expectedSubscriptionId) {
      if (payment?.subscription_id !== expectedSubscriptionId) return null
    }
    return payment
  } catch {
    return null
  }
}

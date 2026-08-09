import db from "./db";
import UserModel from "./models/user";
import AnalysisModel from "./models/analysis";
import PaymentModel from "./models/payment";
import { PLAN_CONFIG } from "./plans";
import { isAdminUser } from "./admin";

export type PaymentKind = "unlock" | "one-time" | "pro";

/**
 * Records a successful payment for revenue analytics. Idempotent per
 * (orderId | paymentId | subscriptionId) so webhook + confirm races
 * don't double-count.
 */
export async function recordPayment(params: {
  clerkId: string;
  kind: PaymentKind;
  amount: number;
  orderId?: string;
  paymentId?: string;
  subscriptionId?: string;
  analysisId?: string;
}): Promise<void> {
  await db();
  const user = await UserModel.findOne({ clerkId: params.clerkId });
  if (!user) return;

  const match: Record<string, string> = {};
  if (params.subscriptionId) match.subscriptionId = params.subscriptionId;
  if (params.orderId) match.orderId = params.orderId;
  if (params.paymentId) match.paymentId = params.paymentId;

  if (Object.keys(match).length > 0) {
    const exists = await PaymentModel.findOne(match);
    if (exists) return;
  }

  try {
    await PaymentModel.create({
      userId: user._id,
      email: user.email,
      kind: params.kind,
      amount: params.amount,
      orderId: params.orderId,
      paymentId: params.paymentId,
      subscriptionId: params.subscriptionId,
      analysisId: params.analysisId,
    });
  } catch (err) {
    // The findOne check above is not atomic: a concurrent webhook + confirm
    // race can both pass it, and the second create hits the unique sparse
    // index (E11000). That is a duplicate, not a failure - the payment was
    // already recorded, so swallow it.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: unknown }).code === 11000
    ) {
      return;
    }
    throw err;
  }
}

/**
 * Revokes the entitlement that a refunded payment granted. Called from the
 * payment.refunded webhook. Idempotent: a payment can only be revoked once
 * (the refunded flag flips before the grant is reverted), so a replayed
 * webhook never double-revokes.
 *
 * - pro: the user drops back to free and the subscription reference is
 *   cleared so a later renewal event can't resurrect Pro.
 * - one-time: the pack's extra analyses are clawed back (never below zero),
 *   and the plan falls back to free if nothing paid remains.
 * - unlock: the analysis is re-locked (and the paid check no longer shows).
 */
export async function revokePayment(
  paymentId: string,
): Promise<boolean> {
  await db();

  // Atomically flip the flag so only the first refund event proceeds.
  const payment = await PaymentModel.findOneAndUpdate(
    { paymentId, refunded: { $ne: true } },
    { $set: { refunded: true } },
    { new: false },
  ).lean();
  if (!payment) return false;

  const user = await UserModel.findOne({ _id: payment.userId });
  if (!user) return true;

  if (payment.kind === "pro") {
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          plan: "free",
          analysesRemaining: PLAN_CONFIG.free.analysesLimit ?? 2,
          paidAnalysesRemaining: 0,
          planResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          razorpaySubscriptionId: null,
        },
      },
    );
    return true;
  }

  if (payment.kind === "one-time") {
    const granted = PLAN_CONFIG["one-time"].analysesLimit ?? 0;
    await UserModel.updateOne(
      { _id: user._id },
      [
        {
          $set: {
            analysesRemaining: {
              $max: [{ $subtract: ["$analysesRemaining", granted] }, 0],
            },
            paidAnalysesRemaining: {
              $max: [
                { $subtract: ["$paidAnalysesRemaining", granted] },
                0,
              ],
            },
          },
        },
      ],
      { updatePipeline: true },
    );
    const fresh = await UserModel.findOne({ _id: user._id }).lean();
    const stillPaid =
      (fresh?.paidAnalysesRemaining ?? 0) > 0 ||
      fresh?.plan === "pro" ||
      isAdminUser(fresh?.clerkId ?? "", fresh?.email ?? "");
    if (!stillPaid) {
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            plan: "free",
            planResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      );
    }
    return true;
  }

  if (payment.kind === "unlock" && payment.analysisId) {
    await AnalysisModel.updateOne(
      { _id: payment.analysisId, userId: user._id },
      { $set: { unlocked: false } },
    );
  }

  return true;
}

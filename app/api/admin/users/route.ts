import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import db from "@/lib/db";
import UserModel from "@/lib/models/user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();

    const users = await UserModel.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return Response.json({
      users: users.map((u) => ({
        id: String(u._id),
        clerkId: u.clerkId,
        email: u.email ?? "",
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        avatarUrl: u.avatarUrl ?? "",
        plan: u.plan,
        analysesRemaining:
          typeof u.analysesRemaining === "number" ? u.analysesRemaining : null,
        paidAnalysesRemaining: u.paidAnalysesRemaining ?? 0,
        planResetAt: u.planResetAt ? u.planResetAt.toISOString() : null,
        oneTimePurchasedAt: u.oneTimePurchasedAt
          ? u.oneTimePurchasedAt.toISOString()
          : null,
        razorpayOrderId: u.razorpayOrderId ?? null,
        razorpaySubscriptionId: u.razorpaySubscriptionId ?? null,
        razorpayAnalysisId: u.razorpayAnalysisId ?? null,
        createdAt: u.createdAt ? u.createdAt.toISOString() : null,
        updatedAt: u.updatedAt ? u.updatedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return Response.json(
      { error: "Something went wrong loading users." },
      { status: 500 }
    );
  }
}

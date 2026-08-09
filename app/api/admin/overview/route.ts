import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import db from "@/lib/db";
import UserModel from "@/lib/models/user";
import AnalysisModel from "@/lib/models/analysis";
import PaymentModel from "@/lib/models/payment";
import PageViewModel from "@/lib/models/pageview";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function dailySeries() {
  const start = new Date(Date.now() - 13 * DAY_MS);

  const [analyses, revenue, views] = await Promise.all([
    AnalysisModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
    PaymentModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    PageViewModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const byDay = (rows: { _id: string; count?: number; amount?: number }[]) =>
    Object.fromEntries(rows.map((r) => [r._id, r]));

  const aMap = byDay(analyses);
  const rMap = byDay(revenue);
  const vMap = byDay(views);

  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10));
  }

  return days.map((day) => ({
    day,
    analyses: aMap[day]?.count ?? 0,
    revenue: rMap[day]?.amount ?? 0,
    views: vMap[day]?.count ?? 0,
  }));
}

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId || !(await isAdmin())) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    await db();

    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

    const [totalUsers, newUsers7d, newUsers30d, planBreakdown] =
      await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        UserModel.aggregate([
          { $group: { _id: "$plan", count: { $sum: 1 } } },
        ]),
      ]);

    const [totalAnalyses, analyses7d, analyses30d, avgScore, scores30d] =
      await Promise.all([
        AnalysisModel.countDocuments(),
        AnalysisModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        AnalysisModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        AnalysisModel.aggregate([
          { $match: { "scores.value": { $gt: 0 } } },
          { $group: { _id: null, avg: { $avg: "$scores.value" } } },
        ]),
        AnalysisModel.find(
          { createdAt: { $gte: thirtyDaysAgo } },
          { "scores.value": 1, createdAt: 1 }
        ).lean(),
      ]);

    const [payments, revenueByKind, revenue30d, revenueTotal, traffic] =
      await Promise.all([
        PaymentModel.find().sort({ createdAt: -1 }).limit(50).lean(),
        PaymentModel.aggregate([
          {
            $group: {
              _id: "$kind",
              amount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
        PaymentModel.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: null, amount: { $sum: "$amount" } } },
        ]),
        PaymentModel.aggregate([
          { $group: { _id: null, amount: { $sum: "$amount" } } },
        ]),
        (async () => {
          const [views30d, unique30d, viewsToday, topPaths] =
            await Promise.all([
              PageViewModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
              PageViewModel.distinct("ipHash", {
                createdAt: { $gte: thirtyDaysAgo },
              }),
              PageViewModel.countDocuments({ createdAt: { $gte: todayStart() } }),
              PageViewModel.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: "$path", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
              ]),
            ]);
          return {
            views30d,
            uniqueVisitors30d: unique30d.length,
            viewsToday,
            topPaths: topPaths.map((t) => ({
              path: t._id,
              count: t.count,
            })),
          };
        })(),
      ]);

    const daily = await dailySeries();

    const scoreTrend = (scores30d as { scores?: { value?: number } }[])
      .map((s) => ({ value: s.scores?.value ?? 0 }))
      .filter((s) => s.value > 0);

    return Response.json({
      users: {
        total: totalUsers,
        new7d: newUsers7d,
        new30d: newUsers30d,
        byPlan: planBreakdown,
      },
      analyses: {
        total: totalAnalyses,
        count7d: analyses7d,
        count30d: analyses30d,
        avgScore: Math.round((avgScore[0]?.avg ?? 0) * 10) / 10,
        scoreTrend,
      },
      revenue: {
        total: revenueTotal[0]?.amount ?? 0,
        last30d: revenue30d[0]?.amount ?? 0,
        byKind: revenueByKind,
        recent: payments.map((p) => ({
          kind: p.kind,
          amount: p.amount ?? 0,
          email: p.email ?? "",
          date: p.createdAt,
        })),
      },
      traffic,
      daily,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return Response.json(
      { error: "Something went wrong loading the dashboard." },
      { status: 500 }
    );
  }
}

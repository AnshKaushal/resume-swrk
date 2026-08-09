import { auth } from "@clerk/nextjs/server";
import { listAnalysesForUser } from "@/lib/analysis-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Please sign in." }, { status: 401 });
    }
    const analyses = await listAnalysesForUser(userId);
    return Response.json({ analyses });
  } catch (error) {
    console.error("List analyses error:", error);
    return Response.json(
      { error: "Something went wrong while loading your analyses." },
      { status: 500 }
    );
  }
}

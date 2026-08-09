import { auth } from "@clerk/nextjs/server"
import { getEntitlement } from "@/lib/analysis-store"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      return Response.json({ error: "Unauthorized." }, { status: 401 })
    }

    const entitlement = await getEntitlement(userId, {})
    return Response.json(entitlement)
  } catch (error) {
    console.error("Entitlement error:", error)
    return Response.json(
      {
        error:
          "Something went wrong while fetching your plan. Please try again.",
      },
      { status: 500 },
    )
  }
}

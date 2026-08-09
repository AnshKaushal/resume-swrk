import { auth } from "@clerk/nextjs/server"
import { isAdmin } from "@/lib/admin"

export const runtime = "nodejs"

export async function GET() {
  const { isAuthenticated, userId } = await auth()
  return Response.json({
    isAdmin: isAuthenticated && userId ? await isAdmin() : false,
  })
}

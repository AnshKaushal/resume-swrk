import { currentUser } from "@clerk/nextjs/server"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase().trim()
const ADMIN_CLERK_USER_ID = process.env.ADMIN_CLERK_USER_ID?.trim()

/** Pure email check (no request context needed). Useful inside data helpers. */
export function isAdminEmail(email?: string | null): boolean {
  if (!ADMIN_EMAIL || !email) return false
  return email.toLowerCase().trim() === ADMIN_EMAIL
}

/**
 * Pure admin check from a stored user (no request context needed). Pinned by
 * the immutable Clerk user id when ADMIN_CLERK_USER_ID is set; the email
 * fallback is only used in setups that haven't pinned a user id yet.
 */
export function isAdminUser(
  clerkId?: string | null,
  email?: string | null,
): boolean {
  if (ADMIN_CLERK_USER_ID) {
    return !!clerkId && clerkId.trim() === ADMIN_CLERK_USER_ID
  }
  return isAdminEmail(email)
}

/**
 * Admin is pinned by the immutable Clerk user id (ADMIN_CLERK_USER_ID) so a
 * user who changes their email to ADMIN_EMAIL can't escalate. The email check
 * is kept as a fallback only for setups that don't set the pinned id yet.
 */
export async function isAdmin(): Promise<boolean> {
  if (!ADMIN_CLERK_USER_ID && !ADMIN_EMAIL) return false
  try {
    const user = await currentUser()
    if (!user) return false
    if (ADMIN_CLERK_USER_ID && user.id === ADMIN_CLERK_USER_ID) return true
    if (!ADMIN_CLERK_USER_ID) {
      const email = (
        user?.primaryEmailAddress?.emailAddress ??
        user?.emailAddresses?.[0]?.emailAddress ??
        ""
      )
        .toLowerCase()
        .trim()
      return email === ADMIN_EMAIL
    }
    return false
  } catch {
    return false
  }
}

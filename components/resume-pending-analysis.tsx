"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"

const PENDING_KEY = "resume-pending-analysis"

export function ResumePendingAnalysis() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (typeof window === "undefined") return
    if (!sessionStorage.getItem(PENDING_KEY)) return
    const pathname = window.location.pathname
    // Never hijack the user off a flow they deliberately navigated to.
    if (
      pathname === "/analyse" ||
      pathname.startsWith("/analyse/") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/billing") ||
      pathname.startsWith("/admin") ||
      pathname === "/fix"
    ) {
      return
    }
    router.push("/analyse")
  }, [isLoaded, isSignedIn, router])

  return null
}

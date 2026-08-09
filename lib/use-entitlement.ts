"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"

export type Entitlement = {
  plan: "free" | "pro" | "one-time"
  /** remaining analyses; null = unlimited (Pro) */
  remaining: number | null
  /** ISO date when the monthly allowance resets; null for one-time packs */
  resetAt: string | null
}

export function useEntitlement() {
  const { isLoaded, isSignedIn } = useAuth()
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false
    fetch("/api/entitlement")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setEntitlement(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, reloadKey])

  return {
    entitlement,
    reload: () => setReloadKey((k) => k + 1),
  }
}

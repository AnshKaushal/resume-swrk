"use client"

import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"

export function useIsAdmin() {
  const { isLoaded } = useAuth()
  const { isSignedIn, user } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const userId = user?.id ?? null

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return
    let cancelled = false
    fetch("/api/admin/check")
      .then(async (res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((json) => {
        if (!cancelled) setIsAdmin(Boolean(json.isAdmin))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, userId])

  return isLoaded && isSignedIn && isAdmin
}

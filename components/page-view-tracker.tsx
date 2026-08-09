"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function PageViewTracker() {
  const pathname = usePathname()
  const lastRef = useRef("")

  useEffect(() => {
    const key = `${pathname}|${Date.now() > 0 ? Math.floor(Date.now() / 60000) : 0}`
    if (lastRef.current === key) return
    lastRef.current = key

    const controller = new AbortController()
    const t = window.setTimeout(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer,
          ua: navigator.userAgent,
        }),
        signal: controller.signal,
        keepalive: true,
      }).catch(() => {})
    }, 1500)

    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [pathname])

  return null
}

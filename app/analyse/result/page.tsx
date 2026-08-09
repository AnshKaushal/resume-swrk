"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function AnalyseResultRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  useEffect(() => {
    if (id) {
      router.replace(`/analyse/${id}`)
      return
    }
    router.replace("/analyse")
  }, [id, router])

  return null
}

export default function AnalyseResultPageWrapper() {
  return (
    <Suspense fallback={<div className="py-24" />}>
      <AnalyseResultRedirect />
    </Suspense>
  )
}

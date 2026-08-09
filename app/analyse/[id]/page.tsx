"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth, useClerk } from "@clerk/nextjs"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/container"
import { DecorIcon } from "@/components/ui/decor-icon"
import { AnalysisResults } from "@/components/analysis-results"
import {
  useAnalysisStorage,
  saveAnalysis,
  clearAnalysis,
} from "@/lib/analysis-storage"
import type { AnalyseResponse } from "@/lib/analyse"

export default function AnalyseIdPageWrapper() {
  return (
    <Suspense fallback={<div className="py-24" />}>
      <AnalyseIdPage />
    </Suspense>
  )
}

function AnalyseIdPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const result = useAnalysisStorage()
  const [fetchState, setFetchState] = useState<{
    id: string
    failed: boolean
  }>({ id: "", failed: false })

  useEffect(() => {
    if (!id || result?.id === id) return
    let cancelled = false
    fetch(`/api/analyses/${id}`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setFetchState({ id, failed: true })
          return
        }
        saveAnalysis({ ...data, id } as AnalyseResponse)
      })
      .catch(() => {
        if (!cancelled) setFetchState({ id, failed: true })
      })
    return () => {
      cancelled = true
    }
  }, [id, result?.id])

  useEffect(() => {
    if (!result?.id || result.unlocked) return
    let cancelled = false
    fetch(`/api/analyses/${result.id}`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.unlocked) return
        saveAnalysis(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [result?.id, result?.unlocked])

  if (!isLoaded) {
    return (
      <Container className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading analysis…</p>
      </Container>
    )
  }

  if (!isSignedIn) {
    return (
      <Container className="flex w-full flex-1 items-center justify-center px-4 py-20">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-none border border-border bg-card p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-none border border-border bg-muted/50">
            <Lock className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">
              Sign in to view this analysis
            </span>
            <span className="text-sm text-muted-foreground">
              Create a free account to see your resume analysis and score.
            </span>
          </div>
          <Button
            onClick={() =>
              redirectToSignIn({
                redirectUrl: "/analyse",
              })
            }
          >
            Sign in
          </Button>
        </div>
      </Container>
    )
  }

  const ready = !!result && result.id === id
  const failed = fetchState.id === id && fetchState.failed

  if (!ready && !failed) {
    return (
      <Container className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading analysis…</p>
      </Container>
    )
  }

  if (failed || !result) {
    return (
      <Container className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">
          No analysis found. Upload a resume to get started.
        </p>
        <Button variant="outline" onClick={() => router.push("/analyse")}>
          Analyse a resume
        </Button>
      </Container>
    )
  }

  return (
    <Container className="w-full">
      <section className="flex w-full flex-1 flex-col gap-8 px-4 py-10 sm:px-6 border-x relative">
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="top-left" />
        <AnalysisResults
          result={result}
          onReset={() => {
            clearAnalysis()
            router.push("/analyse")
          }}
        />
      </section>
    </Container>
  )
}

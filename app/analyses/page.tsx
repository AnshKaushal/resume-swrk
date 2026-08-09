"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth, useClerk } from "@clerk/nextjs"
import {
  FileText,
  Loader2,
  Lock,
  Plus,
  ScanSearch,
  Sparkles,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { computeFixedProjection } from "@/lib/analyse"
import type { AnalysisResult, Check, MajorScores } from "@/lib/analyse"
import {
  useAnalysisStorage,
  saveAnalysis,
  clearAnalysis,
} from "@/lib/analysis-storage"
import { Container } from "@/components/container"
import { PLAN_CONFIG } from "@/lib/plans"
import { useEntitlement } from "@/lib/use-entitlement"

type RecentAnalysis = {
  id: string
  fileName: string
  targetRole: string
  score: number
  passed: boolean
  createdAt: string
  majorScores: Partial<MajorScores>
  checks: Check[]
  appliedFixes?: string[]
}

export default function AnalysesPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const router = useRouter()
  const { entitlement } = useEntitlement()

  const [recent, setRecent] = useState<RecentAnalysis[]>([])
  const stored = useAnalysisStorage()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecentAnalysis | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [error, setError] = useState("")

  const quotaExhausted =
    !!entitlement &&
    entitlement.plan !== "pro" &&
    (entitlement.remaining ?? 0) <= 0

  const onNewAnalysis = () => {
    if (quotaExhausted) {
      setShowUpgradeDialog(true)
      return
    }
    router.push("/analyse")
  }

  const recentWithProjection = useMemo(() => {
    return recent.map((r) => {
      const projection = computeFixedProjection(
        { checks: r.checks, majorScores: r.majorScores } as AnalysisResult,
        new Set(r.appliedFixes ?? []),
      )
      return { ...r, projection }
    })
  }, [recent])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false
    const fetchRecent = async () => {
      try {
        const res = await fetch("/api/analyses")
        if (cancelled) return
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setRecent(data.analyses ?? [])
      } catch {
        // ignore load failures
      }
    }
    fetchRecent()
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn])

  const openRecent = async (id: string) => {
    setError("")
    try {
      const res = await fetch(`/api/analyses/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to load analysis.")
      saveAnalysis(data)
      router.push(`/analyse/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analysis.")
    }
  }

  const deleteRecent = async (id: string) => {
    setDeleteTarget(null)
    setDeletingId(id)
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Failed to delete analysis.")
        return
      }
      setRecent((prev) => prev.filter((r) => r.id !== id))
      if (stored?.id === id) clearAnalysis()
    } catch {
      setError("Failed to delete analysis.")
    } finally {
      setDeletingId(null)
    }
  }

  if (!isLoaded) {
    return (
      <Container className="w-full">
        <section className="border-x relative min-h-[calc(100vh-15rem)]">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
            <header className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Recent analyses
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                View or delete your previous resume analyses. Re-open one to see
                results and continue applying fixes.
              </p>
            </header>
            <Card className="gap-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <ScanSearch className="size-4" />
                    Saved analyses
                  </span>
                  <Button size="sm" onClick={onNewAnalysis}>
                    New analysis
                    <Plus className="size-3.5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>
        </section>
      </Container>
    )
  }

  if (!isSignedIn) {
    redirectToSignIn()
    return null
  }

  return (
    <Container className="w-full">
      <section className="border-x relative min-h-[calc(100vh-15rem)]">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
          <header className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Recent analyses
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              View or delete your previous resume analyses. Re-open one to see
              results and continue applying fixes.
            </p>
          </header>

          {error && (
            <div className="flex items-center gap-2 rounded-none border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <Trash2 className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {entitlement && entitlement.plan !== "pro" && (
            <div className="flex flex-col gap-3 rounded-none border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {entitlement.plan === "one-time"
                    ? `One-time plan · ${entitlement.remaining} analyses left`
                    : `Free plan · ${entitlement.remaining} of ${PLAN_CONFIG[entitlement.plan].analysesLimit} analyses left`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entitlement.plan === "one-time"
                    ? "One-time pack · never expires."
                    : `Resets ${new Date(entitlement.resetAt ?? "").toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`}
                </span>
              </div>
              <Button
                variant="default"
                size="sm"
                nativeButton={false}
                render={<Link href="/billing" />}
                className="shrink-0"
              >
                {entitlement.plan === "one-time" ? "Buy more" : "Upgrade"}
              </Button>
            </div>
          )}

          <Card className="gap-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <ScanSearch className="size-4" />
                  Saved analyses
                </span>
                <Button size="sm" onClick={onNewAnalysis}>
                  New analysis
                  <Plus className="size-3.5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recent.length === 0 && !deletingId ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <FileText className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No analyses yet</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Upload your resume and get scored across 60 ATS, content,
                    impact, and readability checks.
                  </p>
                  <Button onClick={onNewAnalysis}>
                    <Sparkles className="size-4" />
                    Analyse your first resume
                  </Button>
                </div>
              ) : (
                recentWithProjection.map((r) => (
                  <div
                    key={r.id}
                    className="group flex items-center justify-between gap-3 rounded-none border-b border-border/60 py-3 last:border-b-0 transition-colors hover:bg-muted/50"
                  >
                    <button
                      onClick={() => openRecent(r.id)}
                      className="flex flex-1 items-start justify-between gap-3 text-left"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {r.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.targetRole
                            ? `Targeting ${r.targetRole}`
                            : "No target role"}
                          {" · "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                        {r.projection.gained > 0 ? (
                          <>
                            <span className="text-red-400 line-through decoration-muted-foreground/50">
                              {r.projection.baseOverall}
                            </span>
                            <span className="text-2xl">
                              {r.projection.currentOverall}
                            </span>
                          </>
                        ) : (
                          r.projection.baseOverall
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          /100
                        </span>
                      </span>
                    </button>
                    <Button
                      size="xs"
                      variant="ghost"
                      aria-label={`Delete ${r.fileName}`}
                      disabled={deletingId === r.id}
                      onClick={() => setDeleteTarget(r)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {deletingId === r.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="text-base">
              You don&apos;t have any analyses left
            </DialogTitle>
            <DialogDescription>
              Upgrade to Pro for unlimited analyses, or grab a one-time
              5-analysis pack to keep analysing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 px-5 py-4">
            <Button
              nativeButton={false}
              render={<Link href="/billing" />}
              onClick={() => setShowUpgradeDialog(false)}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              Upgrade to Pro · ₹{PLAN_CONFIG.pro.price}/mo
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/billing" />}
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              className="gap-2"
            >
              Get the {PLAN_CONFIG["one-time"].analysesLimit}-analysis pack ·
              ₹{PLAN_CONFIG["one-time"].price}
            </Button>
            <Button variant="ghost" onClick={() => setShowUpgradeDialog(false)}>
              <Lock className="size-3.5" />
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this analysis?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {deleteTarget?.fileName}
              </span>{" "}
              will be permanently removed. Deleting an analysis does not restore
              an analysis credit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => deleteTarget && deleteRecent(deleteTarget.id)}
            >
              {deletingId !== null ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

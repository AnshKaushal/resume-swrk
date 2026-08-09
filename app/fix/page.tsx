"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, useClerk } from "@clerk/nextjs"
import {
  LoaderCircle,
  CircleCheck,
  Lock,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Wrench,
  BadgeIndianRupee,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { computeFixedProjection, resolveCanonicalLabel } from "@/lib/analyse"
import type { AnalyseResponse, Fix, SectionKey } from "@/lib/analyse"
import {
  saveAnalysis,
  setAnalysisAppliedFixes,
} from "@/lib/analysis-storage"
import {
  readFixesCache,
  writeFixesCache,
  fingerprintFor,
} from "@/lib/fix-cache"
import { Container } from "@/components/container"
import { isCheckLockedOnFree } from "@/lib/plan-gates"
import { FULL_ANALYSIS_UNLOCK } from "@/lib/plans"
import { useCheckout } from "@/lib/use-checkout"
import { PurchaseSuccessDialog } from "@/components/purchase-success-dialog"

const SECTIONS: {
  key: SectionKey
  label: string
  weight: number
  color: string
}[] = [
  {
    key: "ats",
    label: "ATS Score",
    weight: 0.25,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "contentQuality",
    label: "Content Quality",
    weight: 0.25,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "impactAchievements",
    label: "Impact & Achievements",
    weight: 0.2,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "jobMatch",
    label: "Job Match",
    weight: 0.2,
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "presentationReadability",
    label: "Presentation & Readability",
    weight: 0.1,
    color: "text-rose-600 dark:text-rose-400",
  },
]

export default function FixPageWrapper() {
  return (
    <Suspense fallback={null}>
      <FixPage />
    </Suspense>
  )
}

function FixPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const { busy, unlockAnalysis, purchase, clearPurchase } = useCheckout()

  const [data, setData] = useState<AnalyseResponse | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem("resume-analysis")
      if (!raw) return null
      return JSON.parse(raw) as AnalyseResponse
    } catch {
      return null
    }
  })

  // The ?section= query param wins (fresh tab / direct link), falling back to
  // the last-visited section stored by the results page.
  const section = useMemo<SectionKey>(() => {
    if (typeof window === "undefined") return "ats"
    try {
      const sec =
        searchParams.get("section") ?? localStorage.getItem("resume-fix-section")
      return SECTIONS.find((s) => s.key === sec)?.key ?? "ats"
    } catch {
      return "ats"
    }
  }, [searchParams])

  const [fixes, setFixes] = useState<Fix[]>(() => {
    if (!data) return []
    const cached = readFixesCache()[section]
    if (cached && cached.fingerprint === fingerprintFor(data, section)) {
      return cached.fixes
    }
    return []
  })
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    () => {
      if (!data) return "idle"
      const cached = readFixesCache()[section]
      if (cached && cached.fingerprint === fingerprintFor(data, section)) {
        return "ready"
      }
      return "loading"
    },
  )
  const [error, setError] = useState("")
  const [applied, setApplied] = useState<string[]>(() => data?.appliedFixes ?? [])
  const checked = useMemo(() => new Set(applied), [applied])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!localStorage.getItem("resume-analysis")) {
      router.replace("/analyse")
    }
  }, [router])

  const unlocked = data?.unlocked ?? true

  const lockedChecks = useMemo(() => {
    if (!data || unlocked) return []
    return data.analysis.checks.filter(
      (c) =>
        c.section === section &&
        !c.passed &&
        isCheckLockedOnFree(c.section, c.label),
    )
  }, [data, section, unlocked])

  const fixableChecks = useMemo(() => {
    if (!data) return []
    const lockedLabels = new Set(lockedChecks.map((c) => c.label))
    return data.analysis.checks.filter(
      (c) => c.section === section && !c.passed && !lockedLabels.has(c.label),
    )
  }, [data, section, lockedChecks])

  const effectiveStatus =
    status === "loading" && fixableChecks.length === 0 ? "ready" : status

  const refetchAfterUnlock = async () => {
    if (!data?.id) return
    try {
      const res = await fetch(`/api/analyses/${data.id}`)
      if (res.ok) {
        const json = await res.json()
        saveAnalysis(json)
        setData(json)
        setFixes([])
        setStatus("loading")
      }
    } catch {
      // ignore; webhook will still unlock it
    }
  }

  useEffect(() => {
    if (!data?.id || unlocked) return
    let cancelled = false
    fetch(`/api/analyses/${data.id}`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.unlocked) return
        saveAnalysis(json)
        setData(json)
      })
      .catch(() => {
        // ignore; user may be signed out or analysis was deleted
      })
    return () => {
      cancelled = true
    }
  }, [data?.id, unlocked])

  useEffect(() => {
    if (!data || status !== "loading") return
    if (fixableChecks.length === 0) return
    let cancelled = false
    fetch("/api/optimise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: data.resumeText,
        targetRole: data.targetRole || undefined,
        jobDescription: undefined,
        analysisId: data.id,
        failedChecks: fixableChecks,
      }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(json.error ?? "Failed to generate fixes.")
        setFixes(json.fixes ?? [])
        setStatus("ready")
        writeFixesCache(
          section,
          json.fixes ?? [],
          fingerprintFor(data, section),
        )
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to generate fixes.")
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [data, status, fixableChecks, section])

  const retry = () => {
    setError("")
    setStatus("loading")
  }

  const persistAppliedFixes = (labels: string[]) => {
    if (!data) return
    setAnalysisAppliedFixes(data, labels)
    if (data.id) {
      fetch(`/api/analyses/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliedFixes: labels }),
      }).catch(() => {
        // ignore persistence failures; local storage still reflects the change
      })
    }
  }

  const toggle = (checkLabel: string) => {
    const next = applied.includes(checkLabel)
      ? applied.filter((l) => l !== checkLabel)
      : [...applied, checkLabel]
    setApplied(next)
    persistAppliedFixes(next)
  }

  const checkLabelFor = (rawLabel: string) =>
    resolveCanonicalLabel(rawLabel, data?.analysis.checks ?? [])

  const { baseOverall, currentOverall, sectionBase, sectionCurrent, gained } =
    useMemo(() => {
      if (!data)
        return {
          baseOverall: 0,
          currentOverall: 0,
          sectionBase: 0,
          sectionCurrent: 0,
          gained: 0,
        }
      const projection = computeFixedProjection(data.analysis, checked)
      return {
        baseOverall: projection.baseOverall,
        currentOverall: projection.currentOverall,
        sectionBase: Math.round(projection.sectionBase[section]),
        sectionCurrent: Math.round(projection.sectionCurrent[section]),
        gained: projection.gained,
      }
    }, [data, checked, section])

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <Container className="flex w-full flex-1 items-center justify-center px-4 py-20">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-none border border-border bg-card p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-none border border-border bg-muted/50">
            <Lock className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">
              Sign in to generate fixes
            </span>
            <span className="text-sm text-muted-foreground">
              Create a free account to get AI-powered rewrites for your resume.
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

  if (!data) return null

  const sectionMeta = SECTIONS.find((s) => s.key === section)!

  if (effectiveStatus === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-3 px-4 py-24">
        <LoaderCircle className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Generating suggested fixes for {sectionMeta.label}...
        </p>
      </div>
    )
  }

  const passedFixes = fixes.filter((f) =>
    checked.has(checkLabelFor(f.check)),
  ).length

  return (
    <Container className="w-full">
      <section className="py-10 border-x relative min-h-[calc(100vh-15rem)]">
        <div className="flex w-full flex-1 flex-col gap-6 px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 gap-1"
                onClick={() =>
                  router.push(data.id ? `/analyse/${data.id}` : "/analyse")
                }
              >
                <ArrowLeft className="size-3.5" />
                Back to analysis
              </Button>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Fix errors - {sectionMeta.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                {data.fileName}
                {data.targetRole ? ` · targeting ${data.targetRole}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!unlocked && lockedChecks.length > 0 ? (
                <Button
                  size="sm"
                  onClick={() =>
                    data.id &&
                    unlockAnalysis(data.id, { onSuccess: refetchAfterUnlock })
                  }
                  disabled={busy}
                  className="gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Unlock fixes · ₹{FULL_ANALYSIS_UNLOCK.price}
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-none border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs text-primary">
                  <Lock className="size-3.5" />
                  Premium feature
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="items-center justify-center p-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Overall score
                </span>
                {checked.size === 0 ? (
                  <>
                    <span className="font-heading text-5xl font-bold tabular-nums text-muted-foreground/50">
                      --
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Check fixes to reveal your score
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground line-through">
                        {baseOverall}
                      </span>
                      <Sparkles className="size-4 text-amber-500" />
                      <span className="font-heading text-5xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {currentOverall}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      out of 100
                    </span>
                    <div className="mt-1 h-2 w-32 bg-muted">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${currentOverall}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
            <Card className="items-center justify-center p-6">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-widest",
                    sectionMeta.color,
                  )}
                >
                  {sectionMeta.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">
                    {sectionBase}
                  </span>
                  <span className="font-heading text-4xl font-bold tabular-nums text-foreground">
                    {sectionCurrent}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  section score · {Math.round(sectionMeta.weight * 100)}% of
                  overall
                </span>
              </div>
            </Card>
            <Card className="items-center justify-center p-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Fixes applied
                </span>
                <span className="font-heading text-5xl font-bold tabular-nums">
                  {passedFixes}
                  <span className="text-lg text-muted-foreground">
                    /{fixes.length}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  +{gained} points earned so far
                </span>
              </div>
            </Card>
          </div>

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-none border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <span>{error}</span>
              <Button variant="outline" size="xs" onClick={retry}>
                <RefreshCw className="size-3" />
                Retry
              </Button>
            </div>
          )}

          {effectiveStatus === "ready" &&
          fixes.length === 0 &&
          lockedChecks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <CircleCheck className="size-8 text-emerald-500" />
                <p className="text-sm font-medium">
                  No failed checks to fix here
                </p>
                <p className="text-xs text-muted-foreground">
                  This section already passed all its checks.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {lockedChecks.length > 0 && (
                <div className="flex flex-col gap-4">
                  <Card className="gap-4 border-dashed border-primary/40 bg-primary/5 p-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Lock className="size-4" />
                          {lockedChecks.length} locked fix
                          {lockedChecks.length > 1 ? "es" : ""} in{" "}
                          {sectionMeta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Premium rewrites for these checks unlock with the full
                          analysis.
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          data.id &&
                          unlockAnalysis(data.id, {
                            onSuccess: refetchAfterUnlock,
                          })
                        }
                        disabled={busy}
                        className="shrink-0"
                      >
                        <Sparkles className="size-3.5" />
                        Unlock full analysis · ₹{FULL_ANALYSIS_UNLOCK.price}
                      </Button>
                    </div>
                  </Card>
                  {lockedChecks.map((c, i) => (
                    <Card
                      key={i}
                      className="gap-4 border-dashed border-primary/40"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Lock className="size-4 text-primary" />
                          {c.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">
                          {c.feedback}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <BadgeIndianRupee className="size-3.5" />
                          Payment required to view the premium rewrite.
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {effectiveStatus === "ready" &&
                fixes.map((fix, i) => {
                  const canonicalCheck = checkLabelFor(fix.check)
                  const isChecked = checked.has(canonicalCheck)
                  return (
                    <Card
                      key={i}
                      className={cn(
                        "gap-4",
                        isChecked &&
                          "ring-emerald-600/50 dark:ring-emerald-400/50",
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggle(canonicalCheck)}
                                className="size-4 accent-emerald-600"
                              />
                              <Wrench
                                className={cn(
                                  "size-4",
                                  isChecked
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground",
                                )}
                              />
                              <CardTitle className="text-sm">
                                {fix.check}
                              </CardTitle>
                            </label>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {fix.issue && (
                          <p className="text-xs text-muted-foreground">
                            {fix.issue}
                          </p>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5 border border-border/60 bg-muted/30 p-3">
                            <span className="text-[11px] font-medium uppercase tracking-widest text-rose-600 dark:text-rose-400">
                              Before
                            </span>
                            <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                              {fix.original ||
                                "(nothing to fix here - add this)"}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1.5 border border-emerald-600/40 bg-emerald-500/5 p-3">
                            <span className="text-[11px] font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                              After
                            </span>
                            <p className="whitespace-pre-wrap text-xs">
                              {fix.improved}
                            </p>
                          </div>
                        </div>
                        {fix.explanation && (
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            <span className="font-medium">Why: </span>
                            {fix.explanation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      </section>

      {purchase && purchase.kind === "unlock" && (
        <PurchaseSuccessDialog purchase={purchase} onClose={clearPurchase} />
      )}
    </Container>
  )
}

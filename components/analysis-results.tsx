"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  CircleCheck,
  CircleX,
  Gauge,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  ListChecks,
  RefreshCw,
  Wrench,
  Download,
  ArrowLeftRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  computeFixedProjection,
  filterResolvedInsights,
  filterResolvedSentences,
  resolveCanonicalLabel,
  FIXED_CHECK_SCORE,
} from "@/lib/analyse"
import type { AnalyseResponse, SectionKey } from "@/lib/analyse"
import { saveAnalysis } from "@/lib/analysis-storage"
import { readSectionFixes } from "@/lib/fix-cache"
import { useCheckout } from "@/lib/use-checkout"
import { PurchaseSuccessDialog } from "@/components/purchase-success-dialog"
import { FULL_ANALYSIS_UNLOCK } from "@/lib/plans"
import { exportAnalysisAsPdf } from "@/lib/export-analysis-pdf"

type AnalysisData = AnalyseResponse

const MAJOR_SCORES = [
  {
    key: "ats",
    label: "ATS Score",
    weight: "25%",
    color: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-600 dark:bg-blue-400",
  },
  {
    key: "contentQuality",
    label: "Content Quality",
    weight: "25%",
    color: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-600 dark:bg-emerald-400",
  },
  {
    key: "impactAchievements",
    label: "Impact & Achievements",
    weight: "20%",
    color: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-600 dark:bg-amber-400",
  },
  {
    key: "jobMatch",
    label: "Job Match",
    weight: "20%",
    color: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-600 dark:bg-violet-400",
  },
  {
    key: "presentationReadability",
    label: "Presentation & Readability",
    weight: "10%",
    color: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-600 dark:bg-rose-400",
  },
] as const

export function AnalysisResults({
  result,
  onReset,
}: {
  result: AnalysisData
  onReset: () => void
}) {
  const router = useRouter()
  const a = result.analysis
  const unlocked = result.unlocked ?? true
  const { busy, unlockAnalysis, purchase, clearPurchase } = useCheckout()
  const fixedChecks = useMemo(
    () => new Set(result.appliedFixes ?? []),
    [result.appliedFixes],
  )
  const projection = useMemo(
    () => computeFixedProjection(a, fixedChecks),
    [a, fixedChecks],
  )
  const displayChecks = a.checks.map((c) =>
    fixedChecks.has(c.label)
      ? { ...c, score: FIXED_CHECK_SCORE, passed: true }
      : c,
  )
  const fixedCheckObjects = useMemo(
    () => a.checks.filter((c) => fixedChecks.has(c.label)),
    [a.checks, fixedChecks],
  )
  const remainingStrengths = useMemo(
    () => a.aiInsights.topStrengths,
    [a.aiInsights.topStrengths],
  )
  const remainingWeaknesses = useMemo(
    () =>
      filterResolvedInsights(a.aiInsights.biggestWeaknesses, fixedCheckObjects),
    [a.aiInsights.biggestWeaknesses, fixedCheckObjects],
  )
  const remainingSkillGaps = useMemo(
    () =>
      filterResolvedInsights(a.aiInsights.skillGapAnalysis, fixedCheckObjects),
    [a.aiInsights.skillGapAnalysis, fixedCheckObjects],
  )
  const remainingKeywords = useMemo(
    () =>
      filterResolvedInsights(a.aiInsights.suggestedKeywords, fixedCheckObjects),
    [a.aiInsights.suggestedKeywords, fixedCheckObjects],
  )
  const remainingRewrite = useMemo(
    () =>
      filterResolvedSentences(
        a.aiInsights.rewriteSuggestions,
        fixedCheckObjects,
      ),
    [a.aiInsights.rewriteSuggestions, fixedCheckObjects],
  )
  const remainingSectionSuggestions = useMemo(
    () =>
      filterResolvedInsights(
        a.aiInsights.sectionSuggestions,
        fixedCheckObjects,
      ),
    [a.aiInsights.sectionSuggestions, fixedCheckObjects],
  )
  const visibleChecks = useMemo(
    () => displayChecks.filter((c) => !c.locked),
    [displayChecks],
  )
  const lockedCount = displayChecks.filter((c) => c.locked).length
  const passedCount = visibleChecks.filter((c) => c.passed).length
  const [noErrorsSection, setNoErrorsSection] = useState<string | null>(null)
  const [diffSection, setDiffSection] = useState<SectionKey | null>(null)

  const sectionFixes = useMemo(() => {
    if (!result || !diffSection) return []
    return readSectionFixes(result, diffSection)
  }, [result, diffSection])

  const diffSectionLabel = diffSection
    ? MAJOR_SCORES.find((m) => m.key === diffSection)?.label
    : null

  const refetchAfterUnlock = async () => {
    if (!result.id) return
    try {
      const res = await fetch(`/api/analyses/${result.id}`)
      if (!res.ok) return
      const data = await res.json()
      saveAnalysis(data)
    } catch {
      // ignore refetch failures; webhook will still unlock it
    }
  }

  const startUnlock = () => {
    if (!result.id) return
    unlockAnalysis(result.id, { onSuccess: refetchAfterUnlock })
  }

  const openFixSection = (data: AnalysisData, section: string) => {
    const sectionChecks = data.analysis.checks.filter(
      (c) => c.section === section,
    )
    const hasErrors = sectionChecks.some((c) => !c.passed)
    if (!hasErrors) {
      setNoErrorsSection(section)
      return
    }
    saveAnalysis(data)
    try {
      localStorage.setItem("resume-fix-section", section)
    } catch {
      // ignore storage failures
    }
    router.push(`/fix?section=${section}`)
  }

  const noErrorsSectionLabel = noErrorsSection
    ? MAJOR_SCORES.find((m) => m.key === noErrorsSection)?.label
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">
            {result.fileName}
            {result.targetRole ? ` · targeting ${result.targetRole}` : ""}
          </div>
          <h2 className="font-heading text-xl font-semibold">
            Analysis results
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => exportAnalysisAsPdf(result)}>
            <Download className="size-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="size-4" />
            Analyse another resume
          </Button>
        </div>
      </div>

      {!unlocked && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-none border border-primary/40 bg-primary/5 p-5 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="size-4" />
              You&apos;re seeing part of this analysis
            </span>
            <span className="text-xs text-muted-foreground">
              {lockedCount > 0
                ? `${lockedCount} failing ${
                    lockedCount === 1 ? "check" : "checks"
                  } and key insights are locked. `
                : "Key insights are locked. "}
              Unlock the full report to reveal scores, tailored feedback and
              premium fixes.
            </span>
          </div>
          <Button onClick={startUnlock} disabled={busy} className="shrink-0">
            <Sparkles className="size-3.5" />
            Unlock full analysis · ₹{FULL_ANALYSIS_UNLOCK.price}
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <ScoreGauge
          value={projection.currentOverall}
          gained={projection.gained}
        />
        <div className="flex flex-col gap-3 lg:col-span-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="size-4" />
                Major scores
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {MAJOR_SCORES.map((m) => {
                const base = Math.round(projection.sectionBase[m.key])
                const value = Math.round(projection.sectionCurrent[m.key])
                const improved = value > base
                return (
                  <div key={m.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {m.label}
                        <span className="ml-1.5 text-muted-foreground">
                          · {m.weight}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-semibold",
                            improved
                              ? "text-emerald-600 dark:text-emerald-400"
                              : m.color,
                          )}
                        >
                          {improved && (
                            <span className="mr-1 text-muted-foreground line-through">
                              {base}
                            </span>
                          )}
                          {value}/100
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted">
                      <div
                        className={cn("h-full transition-all", m.bar)}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsCard
          title="Top strengths"
          items={remainingStrengths}
          accent="emerald"
          lockedCount={!unlocked ? (result.lockedStrengthsCount ?? 0) : 0}
        />
        <InsightsCard
          title="Biggest weaknesses"
          items={remainingWeaknesses}
          accent="rose"
          lockedCount={!unlocked ? (result.lockedWeaknessesCount ?? 0) : 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4" />
            Checks by section
            <span className="text-xs font-normal text-muted-foreground">
              {passedCount} / {visibleChecks.length} passed
              {lockedCount > 0 && ` · ${lockedCount} locked`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <Accordion multiple defaultValue={[MAJOR_SCORES[0].key]}>
            {MAJOR_SCORES.map((m) => {
              const sectionChecks = displayChecks.filter(
                (c) => c.section === m.key,
              )
              if (sectionChecks.length === 0) return null
              const scored = sectionChecks.filter((c) => c.score !== null)
              const sectionPassed = sectionChecks.filter(
                (c) => c.passed && !c.locked,
              ).length
              const sectionAvg = Math.round(
                scored.reduce((sum, c) => sum + (c.score ?? 0), 0) /
                  scored.length,
              )
              return (
                <AccordionItem key={m.key} value={m.key}>
                  <AccordionTrigger className="items-center">
                    <span className={cn("text-sm font-semibold", m.color)}>
                      {m.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                          {sectionPassed}/{sectionChecks.length} passed
                        </span>
                        <span>· {m.weight}</span>
                        <span>· avg {scored.length ? sectionAvg : "--"}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          className="w-fit"
                          onClick={() => openFixSection(result, m.key)}
                        >
                          <Wrench className="size-3" />
                          Fix errors
                        </Button>
                        {readSectionFixes(result, m.key).length > 0 && (
                          <Button
                            size="xs"
                            variant="outline"
                            className="w-fit"
                            onClick={() => setDiffSection(m.key)}
                          >
                            <ArrowLeftRight className="size-3" />
                            View fixes ({readSectionFixes(result, m.key).length}
                            )
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {sectionChecks.map((c, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex flex-col gap-1 border-b border-border/60 py-3 last:border-b-0",
                              !c.passed && "bg-rose-500/5 px-2",
                              c.locked &&
                                "border-dashed border-primary/40 bg-primary/5",
                            )}
                          >
                            <div
                              className={cn(
                                c.locked &&
                                  "pointer-events-none select-none blur-[2px]",
                                "flex items-start justify-between gap-3",
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {c.locked ? (
                                  <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                                ) : c.passed ? (
                                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <CircleX className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                )}
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium">
                                    {c.label}
                                  </span>
                                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {c.category}
                                    {c.locked && " · locked"}
                                  </span>
                                </div>
                              </div>
                              <span className="shrink-0 text-xs font-semibold tabular-nums">
                                {c.locked ? (
                                  <Lock className="size-3.5 text-primary" />
                                ) : (
                                  c.score
                                )}
                              </span>
                            </div>
                            {c.locked ? (
                              <p className="pl-6 text-xs italic text-muted-foreground">
                                {c.feedback}
                              </p>
                            ) : c.passed ? (
                              c.feedback && (
                                <p className="pl-6 text-xs text-muted-foreground">
                                  {c.feedback}
                                </p>
                              )
                            ) : (
                              <div className="pl-6">
                                {c.feedback ? (
                                  <p className="text-xs text-rose-700 dark:text-rose-400">
                                    {c.feedback}
                                  </p>
                                ) : (
                                  <p className="text-xs italic text-muted-foreground">
                                    Missing in resume - add this here.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {!unlocked ? (
          <LockedInsightCard
            title="Skill gap analysis"
            icon={<TrendingUp className="size-4" />}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" />
                Skill gap analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {remainingSkillGaps.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No skill gaps detected.
                </p>
              ) : (
                remainingSkillGaps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {s}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
        {!unlocked ? (
          <LockedInsightCard
            title="Suggested keywords"
            icon={<Target className="size-4" />}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4" />
                Suggested keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {remainingKeywords.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add a job description to get keyword suggestions.
                </p>
              ) : (
                remainingKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="rounded-none border border-border bg-muted px-2 py-1 text-xs"
                  >
                    {k}
                  </span>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {!unlocked ? (
        <LockedInsightCard
          title="How to improve"
          icon={<Sparkles className="size-4" />}
          wide
        />
      ) : (
        remainingRewrite && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" />
                How to improve
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {remainingRewrite}
              </p>
              {remainingSectionSuggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  {remainingSectionSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      )}

      <CardFooter className="justify-center border-t-0 py-4">
        <p className="text-center text-xs text-muted-foreground">
          Score based on a weighted model: ATS 25% · Content 25% · Impact 20% ·
          Job Match 20% · Readability 10%.
        </p>
      </CardFooter>

      <Dialog
        open={noErrorsSection !== null}
        onOpenChange={(open) => {
          if (!open) setNoErrorsSection(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No errors in {noErrorsSectionLabel}</DialogTitle>
            <DialogDescription>
              This section has no failing checks, so there is nothing to fix
              right now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog
        open={diffSection !== null}
        onOpenChange={(open) => {
          if (!open) setDiffSection(null)
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-3xl!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="size-4" />
              Fixes applied · {diffSectionLabel}
            </DialogTitle>
            <DialogDescription>
              Before/after changes generated to improve this section. Applied
              fixes are marked with a green check.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {sectionFixes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No generated fixes yet. Open &quot;Fix errors&quot; for this
                section to generate them.
              </p>
            ) : (
              sectionFixes.map((fix, i) => {
                const canonicalCheck = resolveCanonicalLabel(
                  fix.check,
                  result.analysis.checks,
                )
                const applied = fixedChecks.has(canonicalCheck)
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-none border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{fix.check}</span>
                      {applied ? (
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CircleCheck className="size-3.5" />
                          Applied
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          Not applied
                        </span>
                      )}
                    </div>
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
                          {fix.original || "(nothing to fix here - add this)"}
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
                  </div>
                )
              })
            )}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {purchase && purchase.kind === "unlock" && (
        <PurchaseSuccessDialog purchase={purchase} onClose={clearPurchase} />
      )}
    </div>
  )
}

function LockedInsightCard({
  title,
  icon,
  wide,
}: {
  title: string
  icon: ReactNode
  wide?: boolean
}) {
  return (
    <Card className={wide ? "lg:col-span-2" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="pointer-events-none select-none opacity-60 blur-[2px]">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-3.5 w-full bg-muted" />
            ))}
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3" />
          Part of the full analysis
        </p>
      </CardContent>
    </Card>
  )
}

function InsightsCard({
  title,
  items,
  accent,
  lockedCount = 0,
}: {
  title: string
  items: string[]
  accent: "emerald" | "rose"
  lockedCount?: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">None identified.</p>
        ) : (
          items.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span
                className={cn(
                  "mt-1 size-1.5 shrink-0",
                  accent === "emerald" ? "bg-emerald-500" : "bg-rose-500",
                )}
              />
              {s}
            </div>
          ))
        )}
        {lockedCount > 0 && (
          <div className="mt-1 flex items-center justify-between gap-2 rounded-none border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="size-3" />
              {lockedCount} more locked
            </span>
            <span className="text-[11px] font-medium text-primary">
              Unlock full analysis
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ScoreGauge({ value, gained }: { value: number; gained?: number }) {
  const color =
    value >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : value >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400"

  return (
    <Card className="items-center justify-center gap-2 p-6">
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Overall score
        </span>
        <div className="flex items-center gap-2">
          {gained && gained > 0 ? (
            <span className="text-xl text-muted-foreground line-through">
              {value - gained}
            </span>
          ) : null}
          <span
            className={cn(
              "font-heading text-6xl font-bold tabular-nums",
              color,
            )}
          >
            {value}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">out of 100</span>
        <div className="mt-1 h-2 w-32 bg-muted">
          <div
            className={cn(
              "h-full",
              value >= 80
                ? "bg-emerald-500"
                : value >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500",
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        {gained && gained > 0 ? (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            +{gained} from applied fixes
          </span>
        ) : (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground">
            {value >= 70
              ? "Strong · interviews likely"
              : value >= 50
                ? "Room for improvement"
                : "Needs significant work"}
          </div>
        )}
      </div>
    </Card>
  )
}

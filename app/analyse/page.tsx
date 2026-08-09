"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth, SignIn } from "@clerk/nextjs"
import { gsap } from "gsap"
import {
  Upload,
  FileText,
  LoaderCircle,
  CircleCheck,
  CircleX,
  Sparkles,
  ArrowRight,
  X,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAnalysisStorage,
  saveAnalysis,
  clearAnalysis,
} from "@/lib/analysis-storage"
import { useEntitlement } from "@/lib/use-entitlement"
import { Container } from "@/components/container"
import { AnalysisLoader } from "@/components/analysis-loader"
import { PLAN_CONFIG } from "@/lib/plans"

type AiContextForm = {
  primaryGoal: string
  yearsOfExperience: string
  targetCompanyType: string
  additionalContext: string
  additionalOther: string
  skillsToHighlight: string[]
}

const LOADING_STEPS = [
  { key: "uploading", label: "Uploading resume" },
  { key: "parsing", label: "Parsing resume" },
  { key: "extracting", label: "Extracting text & sections" },
  { key: "scoring", label: "Running 60 AI checks" },
  { key: "analysing", label: "Analysing content quality" },
  { key: "matching", label: "Scoring keyword & job match" },
  { key: "insights", label: "Generating insights & rewrites" },
  { key: "finalising", label: "Preparing your report" },
] as const

type Progress = (typeof LOADING_STEPS)[number]["key"]

const PENDING_KEY = "resume-pending-analysis"

const STEP_COUNT = 8

const EMPTY_AI_CONTEXT: AiContextForm = {
  primaryGoal: "",
  yearsOfExperience: "",
  targetCompanyType: "",
  additionalContext: "",
  additionalOther: "",
  skillsToHighlight: [],
}

const STEPS = [
  {
    badge: "Required",
    badgeVariant: "default",
    title: "Upload your resume",
    description: "Upload your resume to begin your AI analysis.",
  },
  {
    badge: "Recommended",
    badgeVariant: "outline",
    title: "Target role",
    description:
      "Help the AI tailor the analysis for the role you're applying for.",
  },
  {
    badge: "Recommended",
    badgeVariant: "outline",
    title: "Job description",
    description:
      "Paste the job description for precise keyword & job-match scoring.",
  },
  {
    badge: "Optional",
    badgeVariant: "secondary",
    title: "Primary goal",
    description: "Let the AI know what you want to achieve with this resume.",
  },
  {
    badge: "Optional",
    badgeVariant: "secondary",
    title: "Years of experience",
    description: "Tell the AI your experience level so scoring is fair.",
  },
  {
    badge: "Optional",
    badgeVariant: "secondary",
    title: "Target company type",
    description:
      "Help the AI match your resume to the companies you're applying to.",
  },
  {
    badge: "Optional",
    badgeVariant: "secondary",
    title: "Additional context",
    description:
      "Share anything about your situation the AI can't infer from the resume.",
  },
  {
    badge: "Optional",
    badgeVariant: "secondary",
    title: "Skills to highlight",
    description: "List the skills you want the AI to look for and emphasise.",
  },
] as const

const GOAL_OPTIONS = [
  "Get more interview calls",
  "Improve ATS score",
  "Switch careers",
  "Land my first internship",
  "Get into FAANG",
  "Find remote jobs",
  "Improve resume quality",
  "Everything",
]

const EXPERIENCE_OPTIONS = [
  "Student",
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–8 years",
  "8+ years",
]

const COMPANY_TYPE_OPTIONS = [
  "Startup",
  "Product Company",
  "FAANG",
  "Enterprise",
  "Consulting",
  "Government",
  "Remote-first",
  "No preference",
]

const ADDITIONAL_CONTEXT_OPTIONS = [
  "Career change",
  "Recently laid off",
  "Career break",
  "Returning after higher studies",
  "Looking for remote jobs",
  "Applying internationally",
  "Fresher",
  "Other",
]

type PendingAnalysis = {
  fileName: string
  fileType: string
  dataUrl: string
  targetRole: string
  jobDescription: string
  aiContext?: AiContextForm
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function dataUrlToFile(
  dataUrl: string,
  name: string,
  type: string,
): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], name, { type })
}

function readPendingAnalysis(): PendingAnalysis | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingAnalysis
  } catch {
    return null
  }
}

function clearPendingAnalysis() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore storage failures
  }
}

export default function AnalysePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [targetRole, setTargetRole] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [aiContext, setAiContext] = useState<AiContextForm>(EMPTY_AI_CONTEXT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState<Progress>("uploading")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const { entitlement } = useEntitlement()
  const quotaExhausted =
    !!entitlement &&
    entitlement.plan !== "pro" &&
    (entitlement.remaining ?? 0) <= 0
  const [step, setStep] = useState(0)
  const [outgoing, setOutgoing] = useState<number | null>(null)
  const [furthestAdvanced, setFurthestAdvanced] = useState(-1)
  const [progressValue, setProgressValue] = useState(0)
  const result = useAnalysisStorage()
  const inputRef = useRef<HTMLInputElement>(null)
  const signedInRef = useRef(isSignedIn)
  const currentCardRef = useRef<HTMLDivElement>(null)
  const outgoingCardRef = useRef<HTMLDivElement>(null)
  const otherTextRef = useRef<HTMLDivElement>(null)
  const progressProxy = useRef({ value: 0 })
  const animatingRef = useRef(false)
  const analyzingRef = useRef(false)

  // ?new=1 forces a fresh analysis: clear any stored result so the
  // auto-redirect below never bounces the user back to old results.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!window.location.search.includes("new=1")) return
    clearAnalysis()
    router.replace("/analyse", { scroll: false })
  }, [router])

  useEffect(() => {
    signedInRef.current = isSignedIn
  }, [isSignedIn])

  useEffect(() => {
    const currentCard = currentCardRef.current
    const outgoingCard = outgoingCardRef.current
    const otherText = otherTextRef.current
    const progressTarget = progressProxy.current
    return () => {
      gsap.killTweensOf(
        [currentCard, outgoingCard, otherText, progressTarget].filter(Boolean),
      )
    }
  }, [])

  useEffect(() => {
    const el = otherTextRef.current
    if (!el) return
    if (aiContext.additionalContext === "Other") {
      gsap.to(el, {
        height: "auto",
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      })
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }, [aiContext.additionalContext, step])

  const handleFileSelect = useCallback(
    (next: File | null) => {
      setFile(next)
      if (next && quotaExhausted && entitlement) {
        setShowUpgradeDialog(true)
      }
    },
    [quotaExhausted, entitlement],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const dropped = e.dataTransfer.files?.[0]
      if (dropped) handleFileSelect(dropped)
    },
    [handleFileSelect],
  )

  const setContextField = useCallback(
    <K extends keyof AiContextForm>(key: K, value: AiContextForm[K]) => {
      setAiContext((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const animateProgress = useCallback((target: number) => {
    gsap.to(progressProxy.current, {
      value: target,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: () => setProgressValue(Math.round(progressProxy.current.value)),
    })
  }, [])

  useEffect(() => {
    let filled = -1
    if (file) filled = 0
    if (targetRole.trim()) filled = Math.max(filled, 1)
    if (jobDescription.trim()) filled = Math.max(filled, 2)
    if (aiContext.primaryGoal.trim()) filled = Math.max(filled, 3)
    if (aiContext.yearsOfExperience.trim()) filled = Math.max(filled, 4)
    if (aiContext.targetCompanyType.trim()) filled = Math.max(filled, 5)
    if (
      aiContext.additionalContext.trim() ||
      aiContext.additionalOther.trim()
    ) {
      filled = Math.max(filled, 6)
    }
    if (aiContext.skillsToHighlight.length) filled = Math.max(filled, 7)

    const target = ((Math.max(filled, furthestAdvanced) + 1) / STEP_COUNT) * 100
    if (target <= progressProxy.current.value) return
    animateProgress(target)
  }, [
    file,
    targetRole,
    jobDescription,
    aiContext,
    furthestAdvanced,
    animateProgress,
  ])

  const go = useCallback(
    (next: number, dir: 1 | -1) => {
      if (animatingRef.current) return
      if (next < 0 || next >= STEP_COUNT) return

      animatingRef.current = true
      setOutgoing(step)
      setStep(next)
      if (dir === 1) {
        setFurthestAdvanced((prev) => Math.max(prev, step))
      }

      requestAnimationFrame(() => {
        const current = currentCardRef.current
        if (current) {
          gsap.fromTo(
            current,
            { opacity: 0, x: dir === 1 ? -40 : 40, scale: 0.98 },
            { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: "power3.out" },
          )
        }
        const outgoingEl = outgoingCardRef.current
        const finish = () => {
          setOutgoing(null)
          animatingRef.current = false
        }
        if (outgoingEl) {
          gsap.to(outgoingEl, {
            opacity: 0,
            x: dir === 1 ? 40 : -40,
            scale: 0.98,
            duration: 0.45,
            ease: "power3.out",
            onComplete: finish,
          })
        } else {
          finish()
        }
      })
    },
    [step],
  )

  const persistPendingAnalysis = useCallback(() => {
    if (!file) return
    fileToDataUrl(file)
      .then((dataUrl) => {
        const pending: PendingAnalysis = {
          fileName: file.name,
          fileType: file.type,
          dataUrl,
          targetRole,
          jobDescription,
          aiContext,
        }
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
      })
      .catch(() => {
        // if the file can't be stored, the user can re-upload after sign-in
      })
  }, [file, targetRole, jobDescription, aiContext])

  const analyze = async (
    fileArg?: File,
    roleArg?: string,
    jdArg?: string,
    contextArg?: AiContextForm,
  ) => {
    const f = fileArg ?? file
    const role = roleArg ?? targetRole
    const jd = jdArg ?? jobDescription
    const ctx = contextArg ?? aiContext
    if (!f) return
    if (!isLoaded) return
    if (analyzingRef.current) return
    analyzingRef.current = true

    setLoading(true)
    setError("")
    clearAnalysis()
    setProgress("uploading")
    const progressTimers = [
      setTimeout(() => setProgress("parsing"), 600),
      setTimeout(() => setProgress("extracting"), 1200),
      setTimeout(() => setProgress("scoring"), 1800),
      setTimeout(() => setProgress("analysing"), 2400),
      setTimeout(() => setProgress("matching"), 3000),
      setTimeout(() => setProgress("insights"), 3600),
      setTimeout(() => setProgress("finalising"), 4200),
    ]

    try {
      const dataUrl = await fileToDataUrl(f)
      const pending: PendingAnalysis = {
        fileName: f.name,
        fileType: f.type,
        dataUrl,
        targetRole: role,
        jobDescription: jd,
        aiContext: ctx,
      }
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    } catch {
      // if the file can't be stored, the analysis still proceeds
    }

    try {
      const formData = new FormData()
      formData.append("file", f)
      if (role.trim()) formData.append("targetRole", role.trim())
      if (jd.trim()) formData.append("jobDescription", jd.trim())
      if (ctx.primaryGoal.trim())
        formData.append("primaryGoal", ctx.primaryGoal.trim())
      if (ctx.yearsOfExperience.trim())
        formData.append("yearsOfExperience", ctx.yearsOfExperience.trim())
      if (ctx.targetCompanyType.trim())
        formData.append("targetCompanyType", ctx.targetCompanyType.trim())
      if (ctx.additionalContext.trim()) {
        formData.append(
          "additionalContext",
          ctx.additionalContext === "Other"
            ? ctx.additionalOther.trim() || "Other"
            : ctx.additionalContext.trim(),
        )
      }
      if (ctx.skillsToHighlight.length) {
        formData.append("skillsToHighlight", ctx.skillsToHighlight.join(", "))
      }

      const res = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.limitReached) {
          setShowUpgradeDialog(true)
          return
        }
        if (res.status === 401) {
          setShowAuthDialog(true)
        }
        throw new Error(data.error ?? "Analysis failed.")
      }
      saveAnalysis(data)
      clearPendingAnalysis()
      if (signedInRef.current) {
        router.push(data.id ? `/analyse/${data.id}` : "/analyse/result")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.")
    } finally {
      analyzingRef.current = false
      progressTimers.forEach(clearTimeout)
      setLoading(false)
    }
  }

  const handleAnalyseClick = () => {
    if (!file || loading) return
    if (quotaExhausted) {
      setShowUpgradeDialog(true)
      return
    }
    if (!signedInRef.current) {
      persistPendingAnalysis()
      setShowAuthDialog(true)
      return
    }
    analyze()
  }

  const handlePrimaryClick = () => {
    if (loading) return
    if (quotaExhausted) {
      setShowUpgradeDialog(true)
      return
    }
    if (step < STEP_COUNT - 1) {
      if (step === 0 && !file) return
      go(step + 1, 1)
    } else {
      handleAnalyseClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    const target = e.target as HTMLElement
    if (
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("[data-skill-input]")
    ) {
      return
    }
    e.preventDefault()
    handlePrimaryClick()
  }

  useEffect(() => {
    if (isLoaded && isSignedIn && result && !loading) {
      const forcingNew =
        typeof window !== "undefined" &&
        window.location.search.includes("new=1")
      if (forcingNew) return
      router.push(result.id ? `/analyse/${result.id}` : "/analyse/result")
    }
  }, [isLoaded, isSignedIn, result, loading, router])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (analyzingRef.current) return

    const pending = readPendingAnalysis()
    if (!pending) return

    const restoredContext = pending.aiContext ?? EMPTY_AI_CONTEXT
    dataUrlToFile(pending.dataUrl, pending.fileName, pending.fileType)
      .then((f) => {
        setFile(f)
        setTargetRole(pending.targetRole)
        setJobDescription(pending.jobDescription)
        setAiContext(restoredContext)
        analyze(f, pending.targetRole, pending.jobDescription, restoredContext)
      })
      .catch(() => {
        setTargetRole(pending.targetRole)
        setJobDescription(pending.jobDescription)
        setAiContext(restoredContext)
        setError(
          "We couldn't restore your file after sign-in. Please re-upload it.",
        )
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  if (isLoaded && !isSignedIn && !showAuthDialog && readPendingAnalysis()) {
    setShowAuthDialog(true)
  }

  if (!isLoaded) {
    return (
      <Container className="w-full">
        <section className="border-x py-10">
          <div className="flex max-w-3xl mx-auto flex-col gap-8">
            <header className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 mx-auto max-w-3xl w-full">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  Analyse your resume
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Upload your resume and get scored across 60 ATS, content,
                  impact, and readability checks. Add a target role and job
                  description for precise job-match scoring.
                </p>
              </div>
            </header>
            <Card className="gap-6">
              <CardContent className="flex flex-col gap-5">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </section>
      </Container>
    )
  }

  const renderStepContent = (stepIndex: number) => {
    if (stepIndex === 0) {
      return (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed px-6 py-14 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/60 hover:bg-muted/50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <FileText className="size-10 text-primary" />
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(file.size / 1024)} KB · click to replace
              </div>
            </>
          ) : (
            <>
              <Upload className="size-10 text-muted-foreground" />
              <div className="text-sm font-medium">
                Drag & drop your resume here, or{" "}
                <span className="text-primary underline">browse</span>
              </div>
              <div className="text-xs text-muted-foreground">
                PDF, DOCX, or TXT · up to 10 MB
              </div>
            </>
          )}
        </label>
      )
    }

    if (stepIndex === 1) {
      return (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Target role</span>
          <Input
            placeholder="e.g. Senior Frontend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </label>
      )
    }

    if (stepIndex === 2) {
      return (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Job description</span>
          <Textarea
            placeholder="Paste the job description for precise keyword & job-match scoring..."
            className="min-h-28 max-h-54"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </label>
      )
    }

    if (stepIndex === 3) {
      return (
        <ContextSelect
          label="Primary goal"
          value={aiContext.primaryGoal}
          placeholder="Select your main goal"
          options={GOAL_OPTIONS}
          onChange={(value) => setContextField("primaryGoal", value)}
        />
      )
    }

    if (stepIndex === 4) {
      return (
        <ContextSelect
          label="Years of experience"
          value={aiContext.yearsOfExperience}
          placeholder="Select your experience level"
          options={EXPERIENCE_OPTIONS}
          onChange={(value) => setContextField("yearsOfExperience", value)}
        />
      )
    }

    if (stepIndex === 5) {
      return (
        <ContextSelect
          label="Target company type"
          value={aiContext.targetCompanyType}
          placeholder="Select a company type"
          options={COMPANY_TYPE_OPTIONS}
          onChange={(value) => setContextField("targetCompanyType", value)}
        />
      )
    }

    if (stepIndex === 6) {
      return (
        <>
          <ContextSelect
            label="Additional context"
            value={aiContext.additionalContext}
            placeholder="Select an option"
            options={ADDITIONAL_CONTEXT_OPTIONS}
            onChange={(value) => setContextField("additionalContext", value)}
          />
          <div
            ref={otherTextRef}
            className="overflow-hidden"
            style={{ height: 0, opacity: 0 }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Tell us more</span>
              <Textarea
                placeholder="Tell us anything you'd like the AI to know..."
                className="min-h-24"
                value={aiContext.additionalOther}
                onChange={(e) =>
                  setContextField("additionalOther", e.target.value)
                }
              />
            </label>
          </div>
        </>
      )
    }

    return (
      <div className="flex flex-col gap-1.5" data-skill-input>
        <span className="text-xs font-medium">Skills to highlight</span>
        <SkillsInput
          value={aiContext.skillsToHighlight}
          onChange={(next) => setContextField("skillsToHighlight", next)}
        />
      </div>
    )
  }

  const renderCardChrome = (stepIndex: number, content: React.ReactNode) => {
    const config = STEPS[stepIndex]
    const isLast = stepIndex === STEP_COUNT - 1
    return (
      <>
        <div className="px-4 pt-1">
          <Progress value={progressValue} />
        </div>
        <CardHeader>
          <Badge variant={config.badgeVariant}>{config.badge}</Badge>
          <CardTitle className="text-base">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {content}
          {error && (
            <div className="flex items-center gap-2 rounded-none border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <CircleX className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between gap-3">
          <Button
            variant="outline"
            size="lg"
            disabled={stepIndex === 0}
            onClick={() => go(stepIndex - 1, -1)}
          >
            Previous
          </Button>
          <Button
            size="lg"
            disabled={stepIndex === 0 && !file}
            onClick={isLast ? handleAnalyseClick : handlePrimaryClick}
            className="gap-2"
          >
            {isLast ? (
              <>
                <Sparkles className="size-4" />
                Analyse Resume
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </>
    )
  }

  return (
    <Container className="flex w-full flex-col">
      <section className="relative flex min-h-[calc(100vh-15rem)] w-full flex-1 flex-col gap-8 py-10 border-x">
        {loading ? (
          <div className="flex flex-1 items-center justify-center mx-auto max-w-3xl">
            <div className="flex flex-col items-center gap-6 py-16">
              <AnalysisLoader className="h-56 w-64 sm:h-64 sm:w-72" />
              <div className="flex w-full max-w-sm flex-col gap-3">
                {LOADING_STEPS.map((step, i) => {
                  const currentIdx = LOADING_STEPS.findIndex(
                    (s) => s.key === progress,
                  )
                  return (
                    <ProgressStep
                      key={step.key}
                      active={i === currentIdx}
                      done={i < currentIdx}
                      label={step.label}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                This can take up to a minute.{" "}
                {!isSignedIn && "You can sign in while we work."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 mx-auto max-w-3xl w-full">
              <div className="flex items-center justify-between gap-3">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">
                  Analyse your resume
                </h1>
                <PlanBadge />
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Upload your resume and get scored across 60 ATS, content,
                impact, and readability checks. Add a target role and job
                description for precise job-match scoring.
              </p>
            </div>

            <div className="mx-auto w-full max-w-3xl">
              <div className="relative">
                {outgoing !== null && (
                  <div
                    ref={outgoingCardRef}
                    className="absolute inset-0 z-10"
                    aria-hidden
                  >
                    <Card className="h-full w-full">
                      {renderCardChrome(outgoing, renderStepContent(outgoing))}
                    </Card>
                  </div>
                )}
                <Card
                  ref={currentCardRef}
                  onKeyDown={handleKeyDown}
                  tabIndex={-1}
                  className="w-full outline-none"
                >
                  {renderCardChrome(step, renderStepContent(step))}
                </Card>
              </div>
            </div>
          </>
        )}

        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle className="text-base">
                You don&apos;t have any analyses left
              </DialogTitle>
              <DialogDescription>
                {entitlement?.plan === "one-time"
                  ? "Your one-time pack is used up."
                  : "Your free analyses for this month are used up."}{" "}
                Upgrade to Pro for unlimited analyses, or grab a one-time
                5-analysis pack.
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
              <Button
                variant="ghost"
                onClick={() => setShowUpgradeDialog(false)}
              >
                <Lock className="size-3.5" />
                Maybe later
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showAuthDialog && isLoaded && !isSignedIn}
          disablePointerDismissal
          onOpenChange={() => {}}
        >
          <DialogContent
            showCloseButton={false}
            className="gap-0 overflow-hidden p-0 sm:max-w-md"
          >
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle className="text-base">
                Sign in to analyse your resume
              </DialogTitle>
              <DialogDescription>
                A free account is required to run and save your analysis. You
                get 2 free analyses per month.
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 py-4">
              <SignIn
                routing="hash"
                forceRedirectUrl="/analyse"
                signUpForceRedirectUrl="/analyse"
                fallbackRedirectUrl="/analyse"
                appearance={{
                  variables: {
                    borderRadius: "0",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "w-full max-w-full shadow-none",
                  },
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </Container>
  )
}

function ContextSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <Select value={value || null} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full justify-between">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

function SkillsInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  const add = () => {
    const skill = draft.trim()
    if (!skill) return
    if (!value.includes(skill)) onChange([...value, skill])
    setDraft("")
  }
  const remove = (skill: string) => onChange(value.filter((s) => s !== skill))
  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 rounded-none border border-border bg-muted/50 px-2 py-0.5 text-xs"
            >
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => remove(skill)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        placeholder="Type a skill and press Enter, e.g. React, AWS, System Design"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            add()
          }
        }}
        onBlur={add}
      />
    </div>
  )
}

function ProgressStep({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CircleCheck className="size-4 shrink-0 text-emerald-500" />
      ) : active ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" />
      ) : (
        <span className="size-4 shrink-0 rounded-full border border-border" />
      )}
      <span
        className={cn(
          "text-sm",
          done && "text-muted-foreground",
          active && "font-medium",
        )}
      >
        {label}
      </span>
    </div>
  )
}

function PlanBadge() {
  const { isLoaded, isSignedIn } = useAuth()
  const { entitlement } = useEntitlement()

  if (!isLoaded || !isSignedIn || !entitlement) return null

  if (entitlement.plan === "pro") return null

  const label = `${entitlement.remaining ?? 0} left`

  return (
    <span className="shrink-0 rounded-none border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
      {label}
    </span>
  )
}

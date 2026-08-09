import { CheckIcon, InfoIcon, XIcon } from "lucide-react"
import { Container } from "@/components/container"
import { DecorIcon } from "@/components/ui/decor-icon"
import { FullWidthDivider } from "@/components/ui/full-width-divider"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import React from "react"

type Row = {
  feature: string
  description: string
  swrk: boolean
  others: boolean
}

const ROWS: Row[] = [
  {
    feature: "60-point AI analysis",
    description:
      "SWRK evaluates your resume against 60 data points across content, structure, and impact to surface exactly what's holding you back.",
    swrk: true,
    others: false,
  },
  {
    feature: "Job-match scoring",
    description:
      "Get a clear score showing how well your resume matches the specific job description you're applying for.",
    swrk: true,
    others: false,
  },
  {
    feature: "Actionable rewrites",
    description:
      "Receive line-by-line suggestions you can apply instantly; not vague tips like 'add more detail'.",
    swrk: true,
    others: false,
  },
  {
    feature: "ATS compatibility check",
    description:
      "Both tools verify your resume parses cleanly through applicant tracking systems, so you're never silently filtered out.",
    swrk: true,
    others: true,
  },
  {
    feature: "Impact tracking per edit",
    description:
      "See exactly how each change moves your match score, so every edit counts toward a better outcome.",
    swrk: true,
    others: false,
  },
  {
    feature: "Role-specific rewrites",
    description:
      "Tailored phrasing for your target role instead of generic, one-size-fits-all language.",
    swrk: true,
    others: false,
  },
  {
    feature: "Grammar & spell check only",
    description:
      "Basic corrections with no feedback on whether your content actually lands the interview.",
    swrk: false,
    others: true,
  },
  {
    feature: "Keyword density alone",
    description:
      "Fixes focused purely on keyword repetition, ignoring readability and real impact.",
    swrk: false,
    others: true,
  },
]

function StatusIcon({
  on,
  tone = "muted",
  circleClassName = "h-8 w-8",
  iconClassName = "size-4",
}: {
  on: boolean
  tone?: "primary" | "emerald" | "muted"
  circleClassName?: string
  iconClassName?: string
}) {
  if (on) {
    return (
      <span
        className={cn(
          "mx-auto flex shrink-0 items-center justify-center rounded-full",
          circleClassName,
          tone === "primary" ? "bg-primary/10" : "bg-emerald-500/10",
        )}
      >
        <CheckIcon
          className={cn(
            iconClassName,
            tone === "primary" ? "text-primary" : "text-emerald-500",
          )}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        "mx-auto flex shrink-0 items-center justify-center rounded-full bg-muted",
        circleClassName,
      )}
    >
      <XIcon className={cn(iconClassName, "text-muted-foreground")} />
    </span>
  )
}

function FeatureLabel({ row }: { row: Row }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="min-w-0">{row.feature}</span>
      <Tooltip>
        <TooltipTrigger>
          <div
            aria-label={`More about ${row.feature}`}
            className="inline-flex shrink-0 cursor-help items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <InfoIcon className="size-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {row.description}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default function WhySwrk() {
  return (
    <Container className="w-full">
      <section id="why-swrk" className="relative py-16 md:py-24 *:border-0">
        <FullWidthDivider className="-top-px" />
        <FullWidthDivider className="-bottom-px" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-1 size-full overflow-hidden"
        >
          <div
            className={cn(
              "absolute -inset-x-20 inset-y-0 z-0 rounded-full",
              "bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.1),transparent,transparent)]",
              "blur-[50px]",
            )}
          />
          <div className="absolute inset-y-0 left-0 w-px bg-border" />
          <div className="absolute inset-y-0 right-0 w-px bg-border" />
        </div>

        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />

        <div className="why-heading mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-medium text-2xl md:text-4xl lg:text-5xl">
            <span className="why-word inline-block will-change-transform">
              Why Choose
            </span>
            {` `}
            <span className="why-word inline-block will-change-transform text-primary">
              SWRK
            </span>
            ?
          </h2>
          <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
            Built for getting interviews, not just higher scores. Compare what
            actually matters when optimizing your resume.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          {/* Desktop / tablet table */}
          <div className="hidden overflow-hidden border! border-border! backdrop-blur-2xl sm:block">
            <div className="grid grid-cols-[minmax(220px,1fr)_160px_160px] border-b border-border">
              <div className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Feature
              </div>

              <div className="border-x border-primary/20 bg-primary/5 px-6 py-5 text-center text-xl font-bold uppercase tracking-[0.25em] text-primary">
                SWRK
              </div>

              <div className="px-6 py-5 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Traditional ATS
              </div>
            </div>

            {ROWS.map((row, index) => (
              <div
                key={row.feature}
                className={cn(
                  "grid grid-cols-[minmax(220px,1fr)_160px_160px] items-center",
                  index !== ROWS.length - 1 && "border-b border-border",
                  "hover:bg-muted/20",
                )}
              >
                <div className="px-6 py-6 text-[15px] font-medium tracking-tight">
                  <FeatureLabel row={row} />
                </div>

                <div className="border-x border-primary/20 bg-primary/5 px-6 py-6">
                  <StatusIcon
                    on={row.swrk}
                    tone={row.swrk ? "primary" : "muted"}
                  />
                </div>

                <div className="px-6 py-6">
                  <StatusIcon
                    on={row.others}
                    tone={row.others ? "emerald" : "muted"}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border border! border-border! backdrop-blur-2xl sm:hidden">
            {ROWS.map((row) => (
              <div key={row.feature} className="px-4 py-4">
                <div className="text-[15px] font-medium tracking-tight">
                  <FeatureLabel row={row} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5",
                      row.swrk ? "bg-primary/5" : "bg-muted",
                    )}
                  >
                    <StatusIcon
                      on={row.swrk}
                      tone={row.swrk ? "primary" : "muted"}
                      circleClassName="h-6 w-6"
                      iconClassName="size-3.5"
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        row.swrk ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      SWRK
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5",
                      row.others ? "bg-emerald-500/5" : "bg-muted",
                    )}
                  >
                    <StatusIcon
                      on={row.others}
                      tone={row.others ? "emerald" : "muted"}
                      circleClassName="h-6 w-6"
                      iconClassName="size-3.5"
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        row.others
                          ? "text-emerald-500"
                          : "text-muted-foreground",
                      )}
                    >
                      Traditional
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Container>
  )
}

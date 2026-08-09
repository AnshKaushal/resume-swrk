import {
  Gauge,
  Target,
  Sparkles,
  ShieldCheck,
  Pencil,
  LineChart,
} from "lucide-react"
import { GridPattern } from "@/components/ui/grid-pattern"
import { Container } from "@/components/container"
import { DecorIcon } from "@/components/ui/decor-icon"
import { FullWidthDivider } from "@/components/ui/full-width-divider"
import { cn } from "@/lib/utils"

type FeatureType = {
  title: string
  icon: React.ReactNode
  description: string
}

export default function Features() {
  return (
    <Container className="w-full">
      <section id="features" className="relative py-16 space-y-8 md:py-24 border-x">
        <FullWidthDivider className="-top-px" />
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />

        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-2xl font-medium md:text-4xl lg:text-5xl">
            Your Resume Isn&apos;t Bad. <br /> It Just Isn&apos;t{" "}
            <span className="text-primary">Optimized.</span>
          </h2>
          <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
            Most recruiters spend only a few seconds on a resume. Most resumes
            get screened out before even reaching a recruiter. Make every second
            count.
          </p>
        </div>

        <div className="overflow-hidden border border-border dark:border-x-transparent">
          <div className="features-grid grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard feature={feature} key={feature.title} />
            ))}
          </div>
        </div>
      </section>
    </Container>
  )
}

export function FeatureCard({
  feature,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  feature: FeatureType
}) {
  return (
    <div
      className={cn(
        "features-card relative overflow-hidden bg-background p-6",
        className,
      )}
      {...props}
    >
      <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
        <GridPattern
          className="absolute inset-0 size-full stroke-foreground/20"
          height={40}
          width={40}
          x={20}
        />
      </div>
      <div className="[&_svg]:size-6 [&_svg]:text-primary">{feature.icon}</div>
      <h3 className="mt-10 text-base md:text-lg">{feature.title}</h3>
      <p className="relative z-20 mt-2 font-light text-muted-foreground text-base">
        {feature.description}
      </p>
    </div>
  )
}

const features: FeatureType[] = [
  {
    title: "60-point AI analysis",
    icon: <Gauge />,
    description:
      "Scored across ATS, keywords, summary, experience, skills, formatting, grammar, readability, consistency, impact, and more.",
  },
  {
    title: "Job-match scoring",
    icon: <Target />,
    description:
      "Paste a job description and get keyword matches, skill-gap analysis, and a tailored match score for your target role.",
  },
  {
    title: "Actionable rewrites",
    icon: <Pencil />,
    description:
      "Real section-by-section edits that rewrite weak bullets into stronger, metric-driven statements recruiters want to read.",
  },
  {
    title: "ATS compatibility",
    icon: <ShieldCheck />,
    description:
      "Check recruiter searchability, ATS-friendly formatting, and the first-impression score a recruiter sees in 6 seconds.",
  },
  {
    title: "Impact tracking",
    icon: <LineChart />,
    description:
      "See exactly how each change moves your score, so you know what's working and what to fix before you apply.",
  },
  {
    title: "Built for AI",
    icon: <Sparkles />,
    description:
      "Tailored rewrites for your exact role and industry, backed by modern AI that understands how screening works.",
  },
]

import { Container } from "@/components/container"
import { Button } from "@/components/ui/button"
import { DecorIcon } from "@/components/ui/decor-icon"
import { FullWidthDivider } from "@/components/ui/full-width-divider"
import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

export default function Cta() {
  return (
    <Container>
      <section className="relative flex w-full border-x flex-col justify-between gap-y-4 px-4 py-16 md:py-24 dark:bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.08),transparent)]">
        <FullWidthDivider className="-top-px" />
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />

        <h2 className="text-center font-semibold text-xl md:text-3xl">
          Ready to land more interviews?
        </h2>
        <p className="text-balance text-center font-medium text-muted-foreground text-sm md:text-base">
          Upload your resume and get your first analysis free; no card required.
          Start today and see exactly what&apos;s holding your application back.
        </p>

        <div className="flex items-center justify-center gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/#pricing" />}>
            View pricing
          </Button>
          <Button nativeButton={false} render={<Link href="/analyse" />}>
            Analyse my resume <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>
    </Container>
  )
}

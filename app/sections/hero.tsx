import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RocketIcon, ArrowRightIcon } from "lucide-react"
import { DecorIcon } from "@/components/ui/decor-icon"
import { FullWidthDivider } from "@/components/ui/full-width-divider"
import { Container } from "@/components/container"

export default function Hero() {
  return (
    <Container className="w-full">
      <div className="relative flex flex-col items-center justify-center gap-5 py-12 md:py-24 lg:py-28">
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
          <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-border to-border md:left-0" />
          <div className="absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-border to-border md:right-0" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/75 to-border/75 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/75 to-border/75 md:right-12" />
        </div>

        <div className="relative flex flex-col items-center justify-center gap-5 pt-32 pb-30 w-full">
          <Link
            className={cn(
              "group mx-auto flex w-fit items-center gap-3 rounded-full border bg-card px-3 py-1 shadow",
              "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out",
            )}
            href="/blog"
          >
            <RocketIcon className="size-3 text-muted-foreground" />
            <span className="text-xs">AI resume optimizer. Now live.</span>
            <span className="block h-5 border-l" />

            <ArrowRightIcon className="size-3 duration-150 ease-out group-hover:translate-x-1" />
          </Link>

          <h1
            className={cn(
              "fade-in slide-in-from-bottom-10 animate-in text-balance fill-mode-backwards text-center text-4xl tracking-tight delay-100 duration-500 ease-out md:text-5xl lg:text-6xl font-bold",
              "text-shadow-[0_0px_50px_theme(--color-foreground/.2)]",
            )}
          >
            Get your resume ready for <br />{" "}
            <span className="text-primary">robots and recruiters</span>
          </h1>

          <p className="fade-in slide-in-from-bottom-10 mx-auto max-w-xl animate-in fill-mode-backwards text-center text-base text-foreground/80 tracking-wider delay-200 duration-500 ease-out sm:text-lg md:text-xl">
            Upload your resume, get scored across 60 ATS, content, impact, and
            readability checks, then apply AI rewrites that raise your score.
          </p>

          <div className="fade-in slide-in-from-bottom-10 flex animate-in flex-row flex-wrap items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
            <Button
              size="lg"
              variant="outline"
              className="text-md"
              nativeButton={false}
              render={<Link href="/analyse" />}
            >
              Analyse my resume
            </Button>
            <Button
              size="lg"
              className="text-md"
              nativeButton={false}
              render={<Link href="/#features" />}
            >
              See Features <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <div className="overflow-hidden *:aspect-auto">
          <img
            alt="light app screen"
            className="dark:hidden"
            height="auto"
            src="/analysis-light.png"
            width="auto"
          />
          <img
            alt="dark app screen"
            className="hidden dark:block"
            height="auto"
            src="/analysis-dark.png"
            width="auto"
          />
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </Container>
  )
}

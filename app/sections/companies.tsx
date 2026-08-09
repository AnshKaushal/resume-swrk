import { Container } from "@/components/container"
import { LogoCloud } from "@/components/logo-cloud"
import { DecorIcon } from "@/components/ui/decor-icon"
import { cn } from "@/lib/utils"

export default function Companies() {
  return (
    <Container className="w-full">
      <section className="relative py-16 md:py-24 *:border-0">
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
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
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-medium text-2xl md:text-4xl lg:text-5xl">
            Optimised for the way{" "}
            <span className="text-primary">companies hire</span>
          </h2>
          <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
            From global enterprises to ambitious startups, our rewrites are
            built to clear real-world ATS screens and recruiter reviews.
          </p>
        </div>
        <div className="relative *:border-y-0">
          <div className="mask-[linear-gradient(to_right,transparent,black,transparent)] mx-auto my-5 h-px max-w-lg bg-border" />
          <div className="mx-auto">
            <LogoCloud />
          </div>
          <div className="mask-[linear-gradient(to_right,transparent,black,transparent)] mt-5 h-px bg-border" />
        </div>
      </section>
    </Container>
  )
}

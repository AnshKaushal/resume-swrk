"use client"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StarIcon, CheckCircleIcon } from "lucide-react"
import { Container } from "@/components/container"
import { DecorIcon } from "@/components/ui/decor-icon"
import { PLAN_CONFIG, PLAN_LIST, type PlanId } from "@/lib/plans"

export default function Pricing() {
  return (
    <Container className="w-full">
      <section id="pricing" className="relative flex w-full flex-col items-center justify-center border-x space-y-8 h-full py-16 md:py-24">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <div className="mx-auto max-w-xl space-y-2">
          <h2 className="text-center font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground text-sm md:text-base">
            Choose the plan that fits your job search. Start free, pay only when
            you need more.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
          {PLAN_LIST.map((plan) => (
            <PricingCard key={plan.id} planId={plan.id} />
          ))}
        </div>
      </section>
    </Container>
  )
}

type PricingCardProps = React.ComponentProps<"div"> & {
  planId: PlanId
}

export function PricingCard({
  planId,
  className,
  ...props
}: PricingCardProps) {
  const plan = PLAN_CONFIG[planId]
  const router = useRouter()

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden border shadow-xs",
        plan.highlighted && "scale-105",
        className,
      )}
      key={plan.name}
      {...props}
    >
      <div
        className={cn(
          "border-b p-4",
          plan.highlighted && "bg-card dark:bg-card/80",
        )}
      >
        {plan.highlighted && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs">
              <StarIcon className="size-3 fill-current" />
              Popular
            </div>
          </div>
        )}

        <div className="font-medium text-lg">{plan.name}</div>
        <p className="font-normal text-muted-foreground text-sm">{plan.info}</p>
        <h3 className="mt-6 mb-1 flex w-max items-end gap-1">
          {plan.price === 0 ? (
            <span className="font-extrabold text-3xl">Free</span>
          ) : (
            <NumberFlow
              className="font-extrabold text-3xl [&::part(suffix)]:font-normal [&::part(suffix)]:text-base [&::part(suffix)]:text-muted-foreground"
              format={{
                style: "currency",
                currency: "INR",
                notation: "compact",
              }}
              suffix={plan.suffix}
              value={plan.price}
            />
          )}
        </h3>
        <p className="mb-2 font-normal text-muted-foreground text-xs">
          {plan.billingNote}
        </p>
      </div>
      <div
        className={cn(
          "space-y-3 px-4 pt-6 pb-8 text-muted-foreground text-sm",
          plan.highlighted && "bg-muted/10",
        )}
      >
        {plan.features.map((feature) => (
          <div className="flex items-center gap-2" key={feature}>
            <CheckCircleIcon className="size-3.5 text-foreground" />
            <p>{feature}</p>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "mt-auto w-full border-t p-3",
          plan.highlighted && "bg-card dark:bg-card/80",
        )}
      >
        <Button
          onClick={() =>
            planId === "free"
              ? router.push("/analyse")
              : router.push(`/checkout?plan=${planId}`)
          }
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
        >
          {plan.checkoutLabel}
        </Button>
      </div>
    </div>
  )
}

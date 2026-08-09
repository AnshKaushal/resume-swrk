"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, useClerk } from "@clerk/nextjs"
import {
  ArrowLeft,
  CheckCircle,
  LoaderCircle,
  Lock,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Container } from "@/components/container"
import { PLAN_CONFIG, PAID_PLANS, type PlanId } from "@/lib/plans"
import { useCheckout } from "@/lib/use-checkout"
import { PurchaseSuccessDialog } from "@/components/purchase-success-dialog"

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPage />
    </Suspense>
  )
}

function CheckoutSkeleton() {
  return (
    <Container className="w-full">
      <section className="border-x relative min-h-[calc(100vh-15rem)]">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-72 w-full" />
        </div>
      </section>
    </Container>
  )
}

function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")
  const planId = PAID_PLANS.includes(planParam as PlanId)
    ? (planParam as PlanId)
    : null
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const { busy, startCheckout, purchase, clearPurchase } = useCheckout()

  if (!isLoaded) return <CheckoutSkeleton />

  if (!planId) {
    return (
      <Container className="w-full">
        <section className="border-x relative min-h-[calc(100vh-15rem)]">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:px-6">
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t find that plan.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/#pricing" />}
            >
              <ArrowLeft className="size-4" />
              Back to pricing
            </Button>
          </div>
        </section>
      </Container>
    )
  }

  const plan = PLAN_CONFIG[planId]

  if (!isSignedIn) {
    return (
      <Container className="w-full">
        <section className="border-x relative min-h-[calc(100vh-15rem)]">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
            <header className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Checkout
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                You need an account to purchase a plan.
              </p>
            </header>
            <Card className="gap-6">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-none border border-border bg-muted/50">
                  <Lock className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold">
                    Sign in to continue
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Create a free account to buy the {plan.name} plan.
                  </span>
                </div>
                <Button
                  onClick={() =>
                    redirectToSignIn({
                      redirectUrl: `/checkout?plan=${planId}`,
                    })
                  }
                >
                  Sign in
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </Container>
    )
  }

  return (
    <Container className="w-full">
      <section className="border-x relative min-h-[calc(100vh-15rem)]">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
          <header className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              nativeButton={false}
              render={<Link href="/#pricing" />}
            >
              <ArrowLeft className="size-4" />
              Back to pricing
            </Button>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Checkout
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review your plan and continue to secure payment by Razorpay.
            </p>
          </header>

          <Card className="gap-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" />
                Order summary
              </CardTitle>
              <CardDescription>
                You&apos;re buying the {plan.name} plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 rounded-none border border-border/60 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold">
                      {plan.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {plan.billingNote}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 text-right">
                    <span className="font-heading text-2xl font-bold">
                      ₹{plan.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {plan.suffix}
                    </span>
                  </div>
                </div>
                <div className="border-t border-border/60 pt-3">
                  {plan.features.map((feature) => (
                    <div
                      className="flex items-center gap-2 py-0.5 text-sm text-muted-foreground"
                      key={feature}
                    >
                      <CheckCircle className="size-3.5 shrink-0 text-foreground" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                disabled={busy}
                onClick={() => startCheckout(planId)}
                className="w-full gap-2"
              >
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                {busy
                  ? "Preparing payment..."
                  : `Pay ₹${plan.price.toLocaleString("en-IN")} with Razorpay`}
              </Button>

              <div className="flex items-center gap-2 rounded-none border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                Payments are processed securely by Razorpay. You will be
                redirected to Razorpay to complete the payment.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {purchase && purchase.kind === "plan" && (
        <PurchaseSuccessDialog
          purchase={purchase}
          onClose={() => {
            clearPurchase()
            router.push("/analyse")
          }}
        />
      )}
    </Container>
  )
}

"use client"

import { useState } from "react"
import { useAuth, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { toast } from "sonner"
import {
  CheckCircle,
  CreditCard,
  LoaderCircle,
  Lock,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Container } from "@/components/container"
import { PLAN_CONFIG, PAID_PLANS } from "@/lib/plans"
import { useEntitlement } from "@/lib/use-entitlement"
import { useCheckout } from "@/lib/use-checkout"
import { PurchaseSuccessDialog } from "@/components/purchase-success-dialog"

function formatResetDate(iso: string | null): string {
  if (!iso) return "never expires"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function BillingPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const { entitlement, reload } = useEntitlement()
  const { busy, startCheckout, purchase, clearPurchase } = useCheckout()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  if (!isLoaded) {
    return (
      <Container className="w-full">
        <section className="border-x relative min-h-[calc(100vh-15rem)]">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
            <header className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Billing
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Manage your plan and resume analysis quota.
              </p>
            </header>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </section>
      </Container>
    )
  }

  if (!isSignedIn) {
    redirectToSignIn()
    return null
  }

  const plan = entitlement ? PLAN_CONFIG[entitlement.plan] : null
  const remaining = entitlement?.remaining ?? null

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? "Could not cancel.")
      setCancelOpen(false)
      toast.success("Subscription cancelled.")
      reload()
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Something went wrong while cancelling your subscription.",
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Container className="w-full">
      <section className="border-x relative min-h-[calc(100vh-15rem)]">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
          <header className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Billing
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage your plan and resume analysis quota.
            </p>
          </header>

          <Card className="gap-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4" />
                Current plan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!entitlement ? (
                <>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-56" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-semibold">
                        {plan?.name ?? "Free"}
                      </span>
                      {entitlement.plan !== "pro" && (
                        <span className="text-xs text-muted-foreground">
                          {remaining === null
                            ? "Unlimited analyses"
                            : `${remaining} analysis${remaining === 1 ? "" : "es"} remaining`}
                        </span>
                      )}
                    </div>
                    {entitlement.plan !== "pro" && (
                      <span className="rounded-none border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                        {entitlement.plan === "one-time"
                          ? "One-time pack"
                          : "Free"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entitlement.plan === "pro"
                      ? "Your Pro subscription includes unlimited analyses and all premium features."
                      : entitlement.plan === "one-time"
                        ? "Your one-time pack includes full 60-point analyses and never expires. Buy another pack to top up your quota."
                        : `Free plan includes 2 analyses per month. Resets on ${formatResetDate(entitlement.resetAt)}.`}
                  </p>
                  {entitlement.plan === "pro" && (
                    <div className="border-t border-border/60 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setCancelOpen(true)}
                      >
                        <Lock className="size-3.5" />
                        Cancel subscription
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Upgrade or buy more
              </h2>
              <p className="text-sm text-muted-foreground">
                Upgrade for unlimited analyses, or top up your quota with a
                one-time pack.
              </p>
            </div>

            {PAID_PLANS.map((planId) => {
              const config = PLAN_CONFIG[planId]
              const isCurrent = entitlement?.plan === planId
              return (
                <Card key={planId} className="gap-6">
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {config.name}
                        {isCurrent && (
                          <span className="flex items-center gap-1 rounded-none border border-emerald-600/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="size-3" />
                            Current
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ₹{config.price}
                        {config.suffix} · {config.billingNote}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {config.analysesLimit === null
                          ? "Unlimited analyses"
                          : `${config.analysesLimit} analyses`}{" "}
                        · full 60-point analysis · job-match scoring
                      </span>
                    </div>
                    <Button
                      variant={config.highlighted ? "default" : "outline"}
                      className="shrink-0"
                      disabled={busy || (isCurrent && planId === "pro")}
                      onClick={() =>
                        startCheckout(planId, { onSuccess: reload })
                      }
                    >
                      {busy ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : planId === "pro" ? (
                        isCurrent ? (
                          <>
                            <CheckCircle className="size-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4" />
                            Upgrade to Pro
                          </>
                        )
                      ) : isCurrent ? (
                        <>
                          <Sparkles className="size-4" />
                          Buy another pack
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Buy once
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex items-center gap-2 rounded-none border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />
            Payments are processed securely by Razorpay. Premium fixes require a
            paid plan.
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link href="/analyse" className="text-primary hover:underline">
              Back to analysis
            </Link>
            <span aria-hidden>·</span>
            <Link href="/analyses" className="text-primary hover:underline">
              Recent analyses
            </Link>
          </div>
        </div>
      </section>

      {purchase && purchase.kind === "plan" && (
        <PurchaseSuccessDialog purchase={purchase} onClose={clearPurchase} />
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your Pro access ends immediately and you&apos;ll be downgraded to
              the Free plan. You can resubscribe anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Pro</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  )
}

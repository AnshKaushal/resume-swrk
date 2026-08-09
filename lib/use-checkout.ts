"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { PLAN_CONFIG, FULL_ANALYSIS_UNLOCK, type PlanId } from "@/lib/plans"

export type PurchaseInfo =
  | { kind: "plan"; planId: "pro" | "one-time" }
  | { kind: "unlock"; analysisId: string }

type CheckoutData = {
  keyId: string
  amount: number
  orderId: string | null
  subscriptionId: string | null
}

type RazorpayResponse = {
  razorpay_payment_id?: string
  razorpay_order_id?: string
  razorpay_subscription_id?: string
  razorpay_signature?: string
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, callback: (response: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load payment gateway."))
    document.body.appendChild(script)
  })
}

async function confirmPayment(
  response: RazorpayResponse,
  data: CheckoutData,
): Promise<{ kind?: string }> {
  const body: Record<string, string> = {
    paymentId: response.razorpay_payment_id ?? "",
  }
  if (data.orderId) body.orderId = data.orderId
  if (data.subscriptionId) body.subscriptionId = data.subscriptionId
  if (!body.paymentId) throw new Error("Payment was not completed.")

  const res = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const result = await res.json()
  if (!res.ok) {
    throw new Error(result.error ?? "Could not confirm your payment.")
  }
  return result
}

export function useCheckout() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [busy, setBusy] = useState(false)
  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null)

  const openRazorpay = useCallback(
    async ({
      description,
      data,
      purchaseInfo,
      onSuccess,
    }: {
      description: string
      data: CheckoutData
      purchaseInfo: PurchaseInfo
      onSuccess: () => void
    }) => {
      await loadRazorpayScript()
      if (!window.Razorpay) throw new Error("Payment gateway failed to load.")

      const options: Record<string, unknown> = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "SWRK Optimizer™",
        description,
        prefill: { email: user?.primaryEmailAddress?.emailAddress ?? "" },
        theme: { color: "#0069a8" },
        handler: async (raw: unknown) => {
          const response = raw as RazorpayResponse
          try {
            await confirmPayment(response, data)
            setBusy(false)
            setPurchase(purchaseInfo)
            onSuccess()
          } catch (e) {
            setBusy(false)
            toast.error(
              e instanceof Error
                ? e.message
                : "Payment received, but we could not apply it instantly. It will be applied shortly.",
            )
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false)
            toast.info("Payment was cancelled!")
          },
        },
      }

      if (data.orderId) {
        options.order_id = data.orderId
      } else if (data.subscriptionId) {
        options.subscription_id = data.subscriptionId
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", () => {
        setBusy(false)
        toast.error("Payment failed. Please try again.")
      })
      rzp.open()
    },
    [user],
  )

  const startCheckout = useCallback(
    async (planId: PlanId, opts?: { onSuccess?: () => void }) => {
      if (planId === "free") {
        router.push("/analyse")
        return
      }
      if (!isLoaded) return
      if (!isSignedIn) {
        toast.info("Please sign in to purchase a plan.")
        router.push("/?sign-in=true")
        return
      }

      setBusy(true)
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to start checkout.")

        await openRazorpay({
          description: `${PLAN_CONFIG[planId].name} plan`,
          data,
          purchaseInfo: { kind: "plan", planId: planId as "pro" | "one-time" },
          onSuccess: () => opts?.onSuccess?.(),
        })
      } catch (e) {
        setBusy(false)
        toast.error(e instanceof Error ? e.message : "Payment failed.")
      }
    },
    [router, isLoaded, isSignedIn, openRazorpay],
  )

  const unlockAnalysis = useCallback(
    async (analysisId: string, opts?: { onSuccess?: () => void }) => {
      if (!isLoaded) return
      if (!isSignedIn) {
        toast.info("Please sign in to unlock this analysis.")
        router.push("/?sign-in=true")
        return
      }

      setBusy(true)
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: "full-analysis", analysisId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to start checkout.")

        await openRazorpay({
          description: `${FULL_ANALYSIS_UNLOCK.checkoutLabel} · ₹${FULL_ANALYSIS_UNLOCK.price}`,
          data,
          purchaseInfo: { kind: "unlock", analysisId },
          onSuccess: () => opts?.onSuccess?.(),
        })
      } catch (e) {
        setBusy(false)
        toast.error(e instanceof Error ? e.message : "Payment failed.")
      }
    },
    [router, isLoaded, isSignedIn, openRazorpay],
  )

  return {
    busy,
    purchase,
    clearPurchase: () => setPurchase(null),
    startCheckout,
    unlockAnalysis,
  }
}

export type PlanId = "free" | "pro" | "one-time"

export type PlanConfig = {
  id: PlanId
  name: string
  info: string
  price: number
  amountPaise: number
  suffix: string
  billingNote: string
  /** null = unlimited analyses */
  analysesLimit: number | null
  /** "monthly" resets usage each 30 days; "never" is a one-time credit pack */
  reset: "monthly" | "never" | null
  features: string[]
  checkoutLabel: string
  highlighted?: boolean
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    info: "Perfect for trying SWRK Optimizer.",
    price: 0,
    amountPaise: 0,
    suffix: "/month",
    billingNote: "No card required",
    analysesLimit: 2,
    reset: "monthly",
    features: [
      "2 resume analyses / month",
      "Limited analysis information",
      "Basic job-match score",
      "Community support",
    ],
    checkoutLabel: "Start for free",
  },
  pro: {
    id: "pro",
    name: "Pro",
    info: "Built for serious job seekers who customize every application.",
    price: 999,
    amountPaise: 99900,
    suffix: "/month",
    billingNote: "Billed monthly",
    analysesLimit: null,
    reset: "monthly",
    features: [
      "Unlimited analyses",
      "Full 60-point analysis",
      "Job-match scoring",
      "Actionable rewrites",
      "Role-specific rewrites",
      "Impact tracking per edit",
      "Priority support",
    ],
    checkoutLabel: "Get Pro",
    highlighted: true,
  },
  "one-time": {
    id: "one-time",
    name: "One-time",
    info: "Ideal for active job seekers applying to multiple companies.",
    price: 299,
    amountPaise: 29900,
    suffix: "one-time",
    billingNote: "One-time payment",
    analysesLimit: 5,
    reset: "never",
    features: [
      "5 analyses",
      "Full 60-point analysis",
      "Job-match scoring",
      "Actionable rewrites",
      "Role-specific rewrites",
    ],
    checkoutLabel: "Buy once",
  },
}

export const PAID_PLANS: PlanId[] = ["pro", "one-time"]

export const PLAN_LIST: PlanConfig[] = [
  PLAN_CONFIG.free,
  PLAN_CONFIG.pro,
  PLAN_CONFIG["one-time"],
]

/** Per-analysis full unlock (₹99) - not a PlanId, kept out of pricing cards. */
export const FULL_ANALYSIS_UNLOCK = {
  price: 99,
  amountPaise: 9900,
  checkoutLabel: "Unlock full analysis",
  info: "Unlock all sections, scores, and premium fixes for this one analysis.",
} as const

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Billing and Plans | SWRK",
  description: "Manage your SWRK plan, upgrade to Pro, or buy an analysis pack.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

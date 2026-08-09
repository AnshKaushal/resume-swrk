import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | SWRK",
  description: "Complete your SWRK plan purchase securely with Razorpay.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

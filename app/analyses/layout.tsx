import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recent Analyses | SWRK",
  description: "View or delete your previous AI resume analyses.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnalysesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

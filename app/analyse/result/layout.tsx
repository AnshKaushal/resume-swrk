import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analysis Result | SWRK",
  description: "View your AI resume analysis results.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnalyseResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

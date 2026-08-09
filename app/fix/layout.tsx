import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fix Your Resume with AI | SWRK",
  description: "Rewrite weak resume bullets with AI to pass more ATS and recruiter checks.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function FixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

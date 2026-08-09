import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analyse Your Resume with AI | SWRK",
  description:
    "Upload your resume and get scored across 60+ ATS, content, impact, and readability checks. Add a target role and job description for precise job-match scoring.",
  alternates: {
    canonical: "/analyse",
  },
  openGraph: {
    type: "website",
    siteName: "SWRK",
    locale: "en_US",
    url: "/analyse",
    title: "Analyse Your Resume with AI | SWRK",
    description:
      "Upload your resume and get an instant AI analysis. Score across 60+ ATS, content, impact, and readability checks, then rewrite weak bullets.",
    images: [
      {
        url: "/analysis-light.png",
        width: 2944,
        height: 1921,
        alt: "SWRK AI resume analysis results",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Analyse Your Resume with AI | SWRK",
    description:
      "Upload your resume and get an instant AI analysis. Score across 60+ ATS, content, impact, and readability checks, then rewrite weak bullets.",
    images: ["/analysis-light.png"],
  },
}

export default function AnalyseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

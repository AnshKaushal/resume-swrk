import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import Footer from "@/components/footer"
import { PageViewTracker } from "@/components/page-view-tracker"
import { ResumePendingAnalysis } from "@/components/resume-pending-analysis"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "SWRK",
  title: "Optimise Your Resume The Right Way | SWRK",
  description:
    "Get an instant AI resume analysis. Score your resume across 60+ ATS, content, impact, and readability checks, then rewrite weak bullets to land more interviews.",
  keywords: [
    "resume analyser",
    "resume checker",
    "ATS resume scanner",
    "AI resume review",
    "resume optimisation",
    "CV analyser",
    "resume score",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "SWRK",
    locale: "en_US",
    url: "/",
    title: "AI Resume Analyser and Optimiser | SWRK",
    description:
      "Score your resume across 60+ ATS, content, impact, and readability checks with AI, then rewrite weak bullets to land more interviews.",
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
    title: "AI Resume Analyser and Optimiser | SWRK",
    description:
      "Score your resume across 60+ ATS, content, impact, and readability checks with AI, then rewrite weak bullets to land more interviews.",
    images: ["/analysis-light.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider afterSignOutUrl="/">
            <TooltipProvider>
              <PageViewTracker />
              <ResumePendingAnalysis />
              <Navbar />
              <div className="flex-1 w-full">{children}</div>
              <Footer />
              <Toaster
                toastOptions={{
                  style: {
                    borderRadius: "0",
                    border: "1px solid hsl(var(--border))",
                  },
                }}
              />
            </TooltipProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

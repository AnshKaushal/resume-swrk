import Hero from "@/app/sections/hero"
import { cn } from "@/lib/utils"
import { JsonLd } from "@/components/json-ld"
import Companies from "./sections/companies"
import WhySwrk from "./sections/why-swrk"
import Features from "./sections/features"
import Roles from "./sections/roles"
import Pricing from "./sections/pricing"
import Faq from "./sections/faq"
import Cta from "./sections/cta"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "SWRK",
      url: APP_URL,
      logo: `${APP_URL}/logo-dark.png`,
      description:
        "AI resume analysis and optimisation. Score your resume across 60+ ATS, content, impact, and readability checks.",
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "SWRK",
      publisher: { "@id": `${APP_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#app`,
      name: "SWRK Resume Analyser",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${APP_URL}/analyse`,
      description:
        "AI resume analyser and optimiser. Get an instant score across 60+ ATS, content, impact, and readability checks, then rewrite weak bullets.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        priceCurrency: "INR",
      },
      publisher: { "@id": `${APP_URL}/#organization` },
    },
  ],
}

export default function Home() {
  return (
    <div
      className={cn(
        "relative grow flex min-h-[calc(100vh-15rem)] flex-col overflow-hidden supports-[overflow:clip]:overflow-clip",
        "before:absolute before:-inset-y-14 before:-left-px before:w-px before:bg-border",
        "after:absolute after:-inset-y-14 after:-right-px after:w-px after:bg-border",
      )}
    >
      <JsonLd data={homeJsonLd} />
      <Hero />
      <Companies />
      <WhySwrk />
      <Features />
      <Roles />
      <Pricing />
      <Faq />
      <Cta />
    </div>
  )
}

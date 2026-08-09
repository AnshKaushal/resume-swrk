import { Container } from "@/components/container"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { DecorIcon } from "@/components/ui/decor-icon"
import { FullWidthDivider } from "@/components/ui/full-width-divider"

export default function Faq() {
  return (
    <Container className="w-full">
      <section
        id="faq"
        className="relative grid w-full grid-cols-1 md:grid-cols-2 border-x py-16 md:py-24"
      >
        <FullWidthDivider className="-top-px" />
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <div className="px-6 pt-12 pb-6">
          <div className="space-y-5">
            <h2 className="text-balance font-bold text-4xl md:text-6xl lg:font-black">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Quick answers to common questions about SWRK Optimizer. Open any
              question to learn more.
            </p>
            <p className="text-muted-foreground">
              {"Can't find what you're looking for? "}
              <a
                className="text-primary hover:underline"
                href={`mailto:${process.env.APP_EMAIL ?? "hello@swrk.in"}`}
              >
                Contact Us
              </a>
            </p>
          </div>
        </div>
        <div className="relative place-content-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 h-full w-px bg-border"
          />

          <Accordion className="rounded-none border-x-0 border-y">
            {faqs.map((item) => (
              <AccordionItem
                className="group relative pl-5"
                key={item.id}
                value={item.id}
              >
                <DecorIcon
                  className="left-[13px] size-3 group-last:hidden"
                  position="bottom-left"
                />

                <AccordionTrigger className="px-4 py-4 hover:no-underline focus-visible:underline focus-visible:ring-0">
                  {item.title}
                </AccordionTrigger>

                <AccordionContent className="px-4 py-4 text-muted-foreground">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Container>
  )
}

const faqs = [
  {
    id: "item-1",
    title: "What is SWRK Optimizer?",
    content:
      "SWRK Optimizer is an AI-powered resume tool that analyses your resume against 60 data points, scores it against the role you're applying for, and gives you actionable rewrites you can apply instantly.",
  },
  {
    id: "item-2",
    title: "How does the 60-point AI analysis work?",
    content:
      "SWRK reviews your resume across content, structure, and impact, from keyword relevance and formatting to phrasing and measurable results, then highlights exactly what's holding you back and what to fix.",
  },
  {
    id: "item-3",
    title: "What's the difference between your plans?",
    content:
      "Free gives you 2 analyses with limited information, so you can try SWRK out. Pro gives you unlimited analyses with full detail for ₹999/month. One-time gives you 5 full analyses for a single ₹299 payment.",
  },
  {
    id: "item-4",
    title: "Will my resume pass ATS checks?",
    content:
      "Yes. SWRK runs an ATS compatibility check and flags anything that could cause your resume to be filtered out, so your application reaches a human recruiter.",
  },
  {
    id: "item-5",
    title: "Can I tailor my resume to specific roles?",
    content:
      "Absolutely. SWRK offers role-specific rewrites. Tell it your target role or paste the job description and it will tune your wording, keywords, and emphasis to match.",
  },
  {
    id: "item-6",
    title: "Is my data private?",
    content:
      "Yes. Your resume and job descriptions are handled securely and are never shared or used to train models for others.",
  },
  {
    id: "item-7",
    title: "How do I get started?",
    content:
      "Upload your resume, pick your target role, and get your first analysis instantly. Start with the Free plan - no card required.",
  },
]

import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react"
import { Container } from "./container"
import { FullWidthDivider } from "./ui/full-width-divider"
import { DecorIcon } from "./ui/decor-icon"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: `mailto:${process.env.APP_EMAIL ?? "hello@swrk.in"}`, label: "Contact" },
  { href: "/blog", label: "Blog" },
]

const socialLinks = [
  {
    href: "https://github.com/swrkk",
    label: "GitHub",
    icon: "simple-icons:github",
    color: "#181717",
    iconClass: "dark:invert",
  },
  {
    href: "https://store.swrk.in",
    label: "X",
    icon: "streamline-plump-color:store-2",
    color: "#000000",
  },
  {
    href: "https://instagram.com/swrk.in",
    label: "Instagram",
    icon: "skill-icons:instagram",
    color: "#E4405F",
  },
  {
    href: "https://www.linkedin.com/company/swrkk",
    label: "LinkedIn",
    icon: "skill-icons:linkedin",
    color: "#0A66C2",
  },
]

export default function Footer() {
  return (
    <Container className="w-full">
      <footer className="border-x *:px-4 *:md:px-6">
        <section className="relative">
          <FullWidthDivider className="-top-px" />
          <DecorIcon className="size-4" position="top-left" />
          <DecorIcon className="size-4" position="top-right" />

          <div className="flex flex-col gap-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo className="h-4.5" />
              </div>
              <div className="flex items-center">
                {socialLinks.map(({ href, label, icon, color, iconClass }) => (
                  <Button
                    key={label}
                    render={
                      <a
                        aria-label={label}
                        href={href}
                        rel="noreferrer"
                        target="_blank"
                      />
                    }
                    nativeButton={false}
                    size="icon"
                    variant="ghost"
                  >
                    <Icon
                      className={cn("size-4", iconClass)}
                      icon={icon}
                      style={{ color }}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <nav>
              <ul className="flex flex-wrap gap-4 font-medium text-muted-foreground text-sm md:gap-6">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <Link className="hover:text-foreground" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center justify-between gap-4 border-t py-4 text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} SWRK</p>

            <p className="inline-flex items-center gap-1">
              <span>Built by</span>
              <a
                aria-label="github"
                className="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground hover:underline"
                href={"https://github.com/AnshKaushal"}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt="shaban"
                  className="size-4 rounded-full"
                  height="auto"
                  src="https://github.com/AnshKaushal.png"
                  width="auto"
                />
                Ansh Kaushal
              </a>
            </p>
          </div>
          <FullWidthDivider className="-bottom-px" />
        </section>
      </footer>
    </Container>
  )
}

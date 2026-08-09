"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, useClerk, UserButton } from "@clerk/nextjs"
import { Menu, X, Plus, History, CreditCard, Shield } from "lucide-react"
import { clearAnalysis } from "@/lib/analysis-storage"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ModeToggle } from "@/components/mode-toggle"
import { Container } from "@/components/container"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DecorIcon } from "./ui/decor-icon"
import { useIsAdmin } from "@/lib/use-is-admin"

const NAV_LINKS = [
  { label: "Why SWRK", href: "/#why-swrk" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blog" },
]

export function Navbar() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const isAdmin = useIsAdmin()
  const [open, setOpen] = React.useState(false)

  const closeSheet = () => setOpen(false)

  const startNewAnalysis = () => {
    clearAnalysis()
    router.push("/analyse")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="w-full">
        <div className="relative grid h-16 grid-cols-[1fr_1fr] items-center gap-4 md:grid-cols-[1fr_auto_1fr] px-4 border-x">
          <DecorIcon className="size-4" position="bottom-left" />
          <DecorIcon className="size-4" position="bottom-right" />
          <Logo href="/" className="justify-self-start" />

          <nav className="hidden justify-self-center items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition duration-300 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-3">
            {!isLoaded ? (
              <>
                <Skeleton className="hidden h-8 w-28 md:block" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </>
            ) : isSignedIn ? (
              <>
                <div className="hidden items-center gap-3 md:flex">
                  <ModeToggle />
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="New analysis"
                        onClick={startNewAnalysis}
                        labelIcon={<Plus className="size-4" />}
                      />
                      <UserButton.Link
                        label="Recent analyses"
                        href="/analyses"
                        labelIcon={<History className="size-4" />}
                      />
                      <UserButton.Link
                        label="Billing"
                        href="/billing"
                        labelIcon={<CreditCard className="size-4" />}
                      />
                      {isAdmin ? (
                        <UserButton.Link
                          label="Admin"
                          href="/admin"
                          labelIcon={<Shield className="size-4" />}
                        />
                      ) : null}
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
                <div className="md:hidden">
                  <ModeToggle />
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden"
                        aria-label="Open menu"
                      />
                    }
                  >
                    {open ? (
                      <X className="size-4" />
                    ) : (
                      <Menu className="size-4" />
                    )}
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-1 px-4">
                      {NAV_LINKS.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={closeSheet}
                          className="rounded-none px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center gap-3 border-t border-border p-4">
                      <UserButton>
                        <UserButton.MenuItems>
                          <UserButton.Action
                            label="New analysis"
                            onClick={startNewAnalysis}
                            labelIcon={<Plus className="size-4" />}
                          />
                          <UserButton.Link
                            label="Recent analyses"
                            href="/analyses"
                            labelIcon={<History className="size-4" />}
                          />
                          <UserButton.Link
                            label="Billing"
                            href="/billing"
                            labelIcon={<CreditCard className="size-4" />}
                          />
                          {isAdmin ? (
                            <UserButton.Link
                              label="Admin"
                              href="/admin"
                              labelIcon={<Shield className="size-4" />}
                            />
                          ) : null}
                        </UserButton.MenuItems>
                      </UserButton>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                <div className="hidden items-center gap-3 md:flex">
                  <ModeToggle />
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/analyse" />}
                  >
                    Analyse
                  </Button>
                  <Button onClick={() => redirectToSignIn()}>Sign in</Button>
                </div>
                <div className="md:hidden">
                  <ModeToggle />
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden"
                        aria-label="Open menu"
                      />
                    }
                  >
                    {open ? (
                      <X className="size-4" />
                    ) : (
                      <Menu className="size-4" />
                    )}
                  </SheetTrigger>
                  <SheetContent side="right" className="flex w-72 flex-col">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-1 px-4">
                      {NAV_LINKS.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={closeSheet}
                          className="rounded-none px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={<Link href="/analyse" />}
                        className="justify-center"
                        onClick={closeSheet}
                      >
                        Analyse my resume
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          redirectToSignIn()
                          closeSheet()
                        }}
                      >
                        Sign in
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}

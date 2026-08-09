import type { Metadata } from "next"
import Link from "next/link"
import { isAdmin } from "@/lib/admin"
import { Container } from "@/components/container"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin | SWRK",
  robots: { index: false, follow: false },
}

const ADMIN_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Blog", href: "/admin/blog", icon: FileText },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await isAdmin()

  if (!admin) {
    return (
      <Container className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Not authorized
          </h1>
          <p className="text-sm text-muted-foreground">
            This area is restricted to the site administrator.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/" />}>
          Back to home
        </Button>
      </Container>
    )
  }

  return (
    <Container className="w-full">
      <div className="flex min-h-[calc(100vh-15rem)] w-full border-x">
        <aside className="hidden w-52 shrink-0 flex-col gap-1 border-r border-border p-4 md:flex">
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-none px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </Container>
  )
}

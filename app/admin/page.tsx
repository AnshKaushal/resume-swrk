"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, FileText, IndianRupee, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

type Overview = {
  users: {
    total: number
    new7d: number
    new30d: number
    byPlan: { _id: string; count: number }[]
  }
  analyses: {
    total: number
    count7d: number
    count30d: number
    avgScore: number
    scoreTrend: { value: number }[]
  }
  revenue: {
    total: number
    last30d: number
    byKind: { _id: string; amount: number; count: number }[]
    recent: { kind: string; amount: number; email: string; date: string }[]
  }
  daily: { day: string; analyses: number; revenue: number }[]
}

const KIND_LABELS: Record<string, string> = {
  unlock: "₹199 unlock",
  "one-time": "One-time pack",
  pro: "Pro",
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  )
}

function MiniBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(4, (v / max) * 100)}%`,
            backgroundColor: color,
            opacity: 0.35 + 0.65 * (v / max),
          }}
        />
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load dashboard")
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const byPlan = data.users.byPlan.reduce<Record<string, number>>(
    (acc, p) => ({ ...acc, [p._id]: p.count }),
    {},
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of users, revenue, and traffic.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          size="sm"
          render={<Link href="/admin/blog" />}
        >
          Manage blog
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Users"
          value={data.users.total.toLocaleString()}
          sub={`+${data.users.new7d} in 7d · +${data.users.new30d} in 30d`}
          icon={<Users className="size-5" />}
        />
        <Stat
          label="Analyses"
          value={data.analyses.total.toLocaleString()}
          sub={`+${data.analyses.count7d} in 7d · avg ${data.analyses.avgScore}/100`}
          icon={<FileText className="size-5" />}
        />
        <Stat
          label="Revenue"
          value={`₹${data.revenue.total.toLocaleString("en-IN")}`}
          sub={`₹${data.revenue.last30d.toLocaleString("en-IN")} in 30d`}
          icon={<IndianRupee className="size-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" />
              Analyses & views · last 14 days
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <span className="mb-1 block text-xs text-muted-foreground">
                Analyses
              </span>
              <MiniBars
                data={data.daily.map((d) => d.analyses)}
                color="hsl(var(--primary))"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <IndianRupee className="size-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.revenue.byKind.map((k) => (
              <div
                key={k._id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {KIND_LABELS[k._id] ?? k._id}
                </span>
                <span className="font-medium tabular-nums">
                  ₹{k.amount.toLocaleString("en-IN")}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({k.count})
                  </span>
                </span>
              </div>
            ))}
            {data.revenue.recent.length > 0 && (
              <div className="mt-1 border-t border-border pt-3">
                <span className="mb-2 block text-xs text-muted-foreground">
                  Recent
                </span>
                <div className="flex flex-col gap-1.5">
                  {data.revenue.recent.slice(0, 5).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-muted-foreground">
                        {p.email || "-"}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {KIND_LABELS[p.kind] ?? p.kind} · ₹{p.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="size-4" />
              Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Free</span>
              <span className="font-medium tabular-nums">
                {byPlan.free ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">One-time</span>
              <span className="font-medium tabular-nums">
                {byPlan["one-time"] ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pro</span>
              <span className="font-medium tabular-nums">
                {byPlan.pro ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

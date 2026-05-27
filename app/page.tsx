"use client"

import * as React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AppPageShell } from "@/components/app-page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, FileText, FolderKanban, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const formatNok = (val: number) =>
  new Intl.NumberFormat("no-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(val)

function pctChange(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? "+100%" : "0%"
  const pct = ((curr - prev) / prev) * 100
  return `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`
}

function isUp(curr: number, prev: number) {
  return curr >= prev
}

function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return "God morgen"
  if (h >= 12 && h < 17) return "God dag"
  if (h >= 17 && h < 23) return "God kveld"
  return "God kveld"
}

const statusColor: Record<string, string> = {
  draft: "border-transparent bg-[#efe9e1] text-[#6f675f]",
  sent: "border-transparent bg-[#e6f1ff] text-[#365f9b]",
  accepted: "border-transparent bg-accent/80 text-foreground",
  rejected: "border-transparent bg-[#ffe8eb] text-[#a14c5a]",
}
const statusLabel: Record<string, string> = {
  draft: "Utkast",
  sent: "Sendt",
  accepted: "Godkjent",
  rejected: "Avvist",
}

const companyStatusCfg = {
  aktiv:       { label: "Aktiv",       badge: "border-border/70 bg-accent/80 text-foreground", dot: "bg-[#5dbb7d]" },
  feil:        { label: "Feil",        badge: "border-transparent bg-[#ffe8eb] text-[#a14c5a]", dot: "bg-[#d9485f]" },
  vedlikehold: { label: "Vedlikehold", badge: "border-transparent bg-[#fff1dd] text-[#9b6c2f]", dot: "bg-[#d89b3c]" },
} as const

function StatusBadge({ status }: { status: "aktiv" | "feil" | "vedlikehold" }) {
  const cfg = companyStatusCfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const areaChartConfig = {
  omsetning: { label: "Omsetning", color: "var(--color-primary)" },
  tilbud: { label: "Tilbud sendt", color: "var(--color-accent)" },
} satisfies ChartConfig

interface DashboardData {
  omsetning: number
  omsetningPrev: number
  activeProjects: number
  activeProjectsPrev: number
  tilbudSendt: number
  tilbudSentPrev: number
  kunders: number
  kundersPrev: number
  todayOmsetning: number
  yesterdayOmsetning: number
  chartData: Array<{ date: string; omsetning: number; tilbud: number }>
  recentOffers: Array<{ id: string; title: string; kunde: string; prosjekt: string; tid: string }>
  tableOffers: Array<{ id: string; navn: string; shortId: string; kunde: string; verdi: number; status: string }>
  topProjects: Array<{ navn: string; offers: number; pst: number }>
  userName: string
  companyName: string
  companyLogo: string | null
  companyStatus: "aktiv" | "feil" | "vedlikehold"
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: userData } = await supabase
        .from("users")
        .select("company_id, full_name")
        .eq("id", user.id)
        .single()
      const companyId = userData?.company_id
      const rawName = userData?.full_name
        || (user.user_metadata?.full_name as string | undefined)
        || (user.user_metadata?.name as string | undefined)
        || (user.email?.split("@")[0] ?? "")
      const firstName = rawName.split(" ")[0]
      if (!companyId) { setLoading(false); return }

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

      const [
        omsetningRes, omsetningPrevRes,
        activeProjectsRes, activeProjectsPrevRes,
        tilbudRes, tilbudPrevRes,
        kundersRes, kundersPrevRes,
        todayRes, yesterdayRes,
        chartOffersRes, recentOffersRes, tableOffersRes,
        topProjectsRes, companyRes,
      ] = await Promise.all([
        supabase.from("offers").select("amount_nok").eq("company_id", companyId).eq("status", "accepted").gte("created_at", startOfMonth),
        supabase.from("offers").select("amount_nok").eq("company_id", companyId).eq("status", "accepted").gte("created_at", startOfPrevMonth).lte("created_at", endOfPrevMonth),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active").lte("created_at", endOfPrevMonth),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("company_id", companyId).neq("status", "draft").gte("created_at", startOfMonth),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("company_id", companyId).neq("status", "draft").gte("created_at", startOfPrevMonth).lte("created_at", endOfPrevMonth),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", companyId).lte("created_at", endOfPrevMonth),
        supabase.from("offers").select("amount_nok").eq("company_id", companyId).eq("status", "accepted").gte("created_at", startOfToday),
        supabase.from("offers").select("amount_nok").eq("company_id", companyId).eq("status", "accepted").gte("created_at", startOfYesterday).lt("created_at", startOfToday),
        supabase.from("offers").select("amount_nok, status, created_at").eq("company_id", companyId).neq("status", "draft").gte("created_at", sixMonthsAgo).order("created_at", { ascending: true }),
        supabase.from("offers").select("id, title, status, created_at, amount_nok, project_id").eq("company_id", companyId).neq("status", "draft").order("created_at", { ascending: false }).limit(5),
        supabase.from("offers").select("id, title, status, amount_nok, created_at, project_id").eq("company_id", companyId).order("created_at", { ascending: false }).limit(6),
        supabase.from("projects").select("id, name, customer_id").eq("company_id", companyId).eq("status", "active").limit(6),
        supabase.from("companies").select("name").eq("id", companyId).single(),
      ])

      // KPI values
      const omsetning = (omsetningRes.data || []).reduce((s, r) => s + (r.amount_nok || 0), 0)
      const omsetningPrev = (omsetningPrevRes.data || []).reduce((s, r) => s + (r.amount_nok || 0), 0)
      const activeProjects = activeProjectsRes.count || 0
      const activeProjectsPrev = activeProjectsPrevRes.count || 0
      const tilbudSendt = tilbudRes.count || 0
      const tilbudSentPrev = tilbudPrevRes.count || 0
      const kunders = kundersRes.count || 0
      const kundersPrev = kundersPrevRes.count || 0
      const todayOmsetning = (todayRes.data || []).reduce((s, r) => s + (r.amount_nok || 0), 0)
      const yesterdayOmsetning = (yesterdayRes.data || []).reduce((s, r) => s + (r.amount_nok || 0), 0)

      // Chart data - build 6-month skeleton then fill
      const monthMap: Record<string, { date: string; omsetning: number; tilbud: number }> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleDateString("no-NO", { month: "short" })
        monthMap[key] = { date: key, omsetning: 0, tilbud: 0 }
      }
      ;(chartOffersRes.data || []).forEach(offer => {
        const key = new Date(offer.created_at).toLocaleDateString("no-NO", { month: "short" })
        if (monthMap[key]) {
          monthMap[key].tilbud += offer.amount_nok || 0
          if (offer.status === "accepted") monthMap[key].omsetning += offer.amount_nok || 0
        }
      })
      const chartData = Object.values(monthMap)

      // Resolve project + customer names for feeds
      const allProjectIds = [
        ...(recentOffersRes.data || []).map(o => o.project_id),
        ...(tableOffersRes.data || []).map(o => o.project_id),
        ...(topProjectsRes.data || []).map(p => p.id),
      ].filter((id): id is string => Boolean(id))
      const uniqueProjectIds = [...new Set(allProjectIds)]

      const projectNameById: Record<string, string> = {}
      const projectCustomerById: Record<string, string> = {}
      const customerNameById: Record<string, string> = {}

      const userName = firstName
      const companyName = companyRes.data?.name || "Spikr"
      const companyLogo: string | null = null
      const companyStatus = "aktiv" as const

      if (uniqueProjectIds.length) {
        const { data: projRows } = await supabase.from("projects").select("id, name, customer_id").in("id", uniqueProjectIds)
        ;(projRows || []).forEach(p => {
          projectNameById[p.id] = p.name
          if (p.customer_id) projectCustomerById[p.id] = p.customer_id
        })
        const custIds = [...new Set(Object.values(projectCustomerById))]
        if (custIds.length) {
          const { data: custRows } = await supabase.from("customers").select("id, name").in("id", custIds)
          ;(custRows || []).forEach(c => { customerNameById[c.id] = c.name })
        }
      }

      const getKunde = (projectId: string | null) => {
        if (!projectId) return "Ukjent kunde"
        const custId = projectCustomerById[projectId]
        return custId ? (customerNameById[custId] || "Ukjent kunde") : "Ukjent kunde"
      }

      const recentOffers = (recentOffersRes.data || []).map(o => ({
        id: o.id,
        title: o.title || "Uten tittel",
        kunde: getKunde(o.project_id),
        prosjekt: o.project_id ? (projectNameById[o.project_id] || "Ukjent prosjekt") : "Ukjent prosjekt",
        tid: new Date(o.created_at).toLocaleString("no-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      }))

      const tableOffers = (tableOffersRes.data || []).map(o => ({
        id: o.id,
        navn: o.title || "Uten tittel",
        shortId: `#${o.id.slice(0, 8).toUpperCase()}`,
        kunde: getKunde(o.project_id),
        verdi: o.amount_nok || 0,
        status: o.status || "draft",
      }))

      // Top projects by offer count
      const topProjects: DashboardData["topProjects"] = []
      if (topProjectsRes.data?.length) {
        const counts = await Promise.all(
          topProjectsRes.data.map(async p => {
            const { count } = await supabase.from("offers").select("id", { count: "exact", head: true }).eq("project_id", p.id)
            return { navn: p.name, offers: count || 0 }
          })
        )
        const max = Math.max(1, ...counts.map(c => c.offers))
        topProjects.push(
          ...counts
            .sort((a, b) => b.offers - a.offers)
            .slice(0, 4)
            .map(c => ({ ...c, pst: Math.round((c.offers / max) * 100) }))
        )
      }

      setData({
        omsetning, omsetningPrev,
        activeProjects, activeProjectsPrev,
        tilbudSendt, tilbudSentPrev,
        kunders, kundersPrev,
        todayOmsetning, yesterdayOmsetning,
        chartData, recentOffers, tableOffers, topProjects,
        userName, companyName, companyLogo, companyStatus,
      })
      setLoading(false)
    }
    load()
  }, [])

  const gaugeValue = !data ? 0
    : data.omsetningPrev > 0
      ? Math.min(100, Math.round((data.omsetning / data.omsetningPrev) * 100))
      : data.omsetning > 0 ? 75 : 10

  const kpiCards = data ? [
    {
      label: "Total Omsetning",
      value: data.omsetning >= 1_000_000
        ? `${(data.omsetning / 1_000_000).toFixed(2).replace(".", ",")} mill`
        : data.omsetning >= 1_000 ? `${Math.round(data.omsetning / 1_000)}k` : `${data.omsetning}`,
      icon: TrendingUp,
      change: pctChange(data.omsetning, data.omsetningPrev),
      up: isUp(data.omsetning, data.omsetningPrev),
    },
    {
      label: "Aktive Prosjekter",
      value: `${data.activeProjects}`,
      icon: FolderKanban,
      change: pctChange(data.activeProjects, data.activeProjectsPrev),
      up: isUp(data.activeProjects, data.activeProjectsPrev),
    },
    {
      label: "Tilbud sendt",
      value: `${data.tilbudSendt}`,
      icon: FileText,
      change: pctChange(data.tilbudSendt, data.tilbudSentPrev),
      up: isUp(data.tilbudSendt, data.tilbudSentPrev),
    },
    {
      label: "Kunder totalt",
      value: `${data.kunders}`,
      icon: Users,
      change: pctChange(data.kunders, data.kundersPrev),
      up: isUp(data.kunders, data.kundersPrev),
    },
  ] : []

  return (
    <AppPageShell segments={["Dashbord"]}>
      <div className="flex flex-col gap-4 pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {greeting()}{data?.userName ? `, ${data.userName}` : ""}
            </p>
            <h1 className="font-display text-3xl font-semibold leading-none tracking-[-0.05em] md:text-4xl">
              {data?.companyName || "Spikr"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="h-9 rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90">
              <Link href="/prosjekter/ny">Nytt prosjekt</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 rounded-md px-4">
              <Link href="/tilbud">Tilbud</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-xl border border-border/70 animate-pulse">
                  <CardContent className="space-y-3 p-4">
                    <div className="h-8 w-8 rounded-md bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-6 w-1/2 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            : kpiCards.map((k) => (
                <Card key={k.label} className="rounded-xl border border-border/70">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{k.label}</p>
                        <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{k.value}</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <k.icon className="h-4 w-4 text-foreground" strokeWidth={1.8} />
                      </div>
                    </div>
                    <p className={cn("mt-3 text-xs font-medium", k.up ? "text-emerald-600" : "text-destructive")}>
                      {k.change} mot forrige måned
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <Card className="rounded-xl border border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Omsetning mot tilbud</CardTitle>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />Omsetning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />Tilbud
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0">
              <ChartContainer config={areaChartConfig} className="h-[240px] w-full">
                <AreaChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillOmsetning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillTilbud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.18} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6f6f6f" }} dy={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="omsetning" stroke="var(--color-primary)" strokeWidth={2} fill="url(#fillOmsetning)" dot={false} />
                  <Area type="monotone" dataKey="tilbud" stroke="var(--color-accent)" strokeWidth={2} fill="url(#fillTilbud)" dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Månedens ytelse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="relative flex justify-center rounded-lg bg-muted/60 py-3">
                <ChartContainer config={{ ytelse: { label: "Ytelse", color: "var(--color-primary)" } }} className="h-[128px] w-[180px]">
                  <RadialBarChart data={[{ name: "Ytelse", value: loading ? 0 : gaugeValue }]} startAngle={180} endAngle={0} innerRadius={52} outerRadius={78}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" background={{ fill: "var(--color-secondary)" }} fill="var(--color-primary)" cornerRadius={6} />
                  </RadialBarChart>
                </ChartContainer>
                <div className="absolute bottom-4 flex flex-col items-center">
                  <span className="text-2xl font-semibold tracking-[-0.04em]">{loading ? "—" : formatNok(data?.omsetning ?? 0)}</span>
                  <span className="text-xs text-muted-foreground">Månedsomsetning</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">I dag</span>
                  <span>{loading ? "—" : formatNok(data?.todayOmsetning ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Forrige måned</span>
                  <span>{loading ? "—" : formatNok(data?.omsetningPrev ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {data ? <StatusBadge status={data.companyStatus} /> : <span className="h-5 w-16 rounded-full bg-muted" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <Card className="rounded-xl border border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Siste tilbud</CardTitle>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-md px-3">
                <Link href="/tilbud">Vis alle</Link>
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-3 pr-3 font-medium">Tilbud</th>
                      <th className="py-3 pr-3 font-medium">ID</th>
                      <th className="py-3 pr-3 font-medium">Kunde</th>
                      <th className="py-3 pr-3 font-medium">Verdi</th>
                      <th className="py-3 pr-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 5 }).map((__, j) => (
                              <td key={j} className="py-3 pr-3">
                                <div className="h-3 rounded bg-muted" style={{ width: "70%" }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      : data?.tableOffers.map((row) => (
                          <tr key={row.id}>
                            <td className="py-3 pr-3 font-medium text-foreground">
                              <div className="max-w-[220px] truncate">{row.navn}</div>
                            </td>
                            <td className="py-3 pr-3 font-mono text-[11px] text-muted-foreground">{row.shortId}</td>
                            <td className="py-3 pr-3 text-muted-foreground">
                              <div className="max-w-[180px] truncate">{row.kunde}</div>
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap font-medium">{formatNok(row.verdi)}</td>
                            <td className="py-3 pr-3">
                              <Badge variant="outline" className={cn("text-[10px] font-medium", statusColor[row.status])}>
                                {statusLabel[row.status] ?? row.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
                {!loading && data?.tableOffers.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">Ingen tilbud ennå.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-xl border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Aktive tilbud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <div className="h-3 w-2/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    ))
                  : data?.recentOffers.length === 0
                    ? <p className="text-sm text-muted-foreground">Ingen aktive tilbud.</p>
                    : data?.recentOffers.map((offer) => (
                        <div key={offer.id} className="space-y-1">
                          <p className="truncate text-sm font-medium">{offer.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{offer.kunde}</p>
                        </div>
                      ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Topp prosjekter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <div className="h-3 w-2/3 rounded bg-muted" />
                        <div className="h-2 w-full rounded-full bg-muted" />
                      </div>
                    ))
                  : data?.topProjects.length === 0
                    ? <p className="text-sm text-muted-foreground">Ingen aktive prosjekter.</p>
                    : data?.topProjects.map((project) => (
                        <div key={project.navn} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-medium">{project.navn}</span>
                            <span className="text-xs text-muted-foreground">{project.offers}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${project.pst}%` }} />
                          </div>
                        </div>
                      ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppPageShell>
  )
}

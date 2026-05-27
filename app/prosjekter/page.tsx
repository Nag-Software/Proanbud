import { AppPageShell } from "@/components/app-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { checkRoleAccess } from "@/lib/auth-utils"
import { ProsjekterFilters } from "./prosjekter-filters"
import { CreateProjectDrawer } from "./create-project-dialog"
import { integrations } from "../min-bedrift/integrasjoner/page"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

type StatusConfig = {
  label: string
  filledBars: number
  fillClass: string
}

const statusConfigByValue: Record<string, StatusConfig> = {
  planning: {
    label: "Planlegges",
    filledBars: 1,
    fillClass: "bg-amber-400",
  },
  active: {
    label: "Aktiv",
    filledBars: 3,
    fillClass: "bg-[var(--accent)]",
  },
  on_hold: {
    label: "Avventer",
    filledBars: 2,
    fillClass: "bg-slate-400",
  },
  completed: {
    label: "Fullført",
    filledBars: 3,
    fillClass: "bg-emerald-500",
  },
}

const totalBars = 3

const currencyFormatter = new Intl.NumberFormat("no-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
})

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { user } = await checkRoleAccess(["admin", "manager", "worker"])

  // Tripletex-column på datatable er kun relevant å vise hvis Tripletex-integrasjonen er aktiv for bedriften.
  let tripletexEnabled = false;
  integrations.forEach((int) => {
    int.name === "Tripletex" && int.status === "active" ? tripletexEnabled = true : false
  });

  const { data: userCompanyRow } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle()
  const companyId = userCompanyRow?.company_id || null

  let queryBuilder = supabase
    .from("projects")
    .select("*, customers(name,email,phone), tasks(status)")

  if (params.status && params.status !== "all") {
    queryBuilder = queryBuilder.eq("status", params.status)
  }

  if (params.search) {
    queryBuilder = queryBuilder.or(`name.ilike.%${params.search}%,id.ilike.%${params.search}%`)
  }

  if (params.sort) {
    if (params.sort === "name") {
      queryBuilder = queryBuilder.order("name", { ascending: true })
    } else {
      queryBuilder = queryBuilder.order(params.sort, { ascending: false })
    }
  } else {
    queryBuilder = queryBuilder.order("updated_at", { ascending: false })
  }

  const { data: projects } = await queryBuilder

  const [linksResult, jobsResult] = companyId
    ? await Promise.all([
        supabase
          .from("external_entity_links")
          .select("local_id")
          .eq("company_id", companyId)
          .eq("provider", "tripletex")
          .eq("entity_type", "project"),
        supabase
          .from("integration_jobs")
          .select("status,payload,created_at")
          .eq("company_id", companyId)
          .eq("provider", "tripletex")
          .eq("job_type", "project.upsert"),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }]

  const syncedProjectIds = new Set((linksResult.data || []).map((item: any) => item.local_id))
  const latestProjectJobState = new Map<string, { status: string; createdAt: string }>()

  for (const job of jobsResult.data || []) {
    const projectId = job?.payload?.projectId
    if (!projectId || typeof projectId !== "string") continue

    const createdAt = typeof job.created_at === "string" ? job.created_at : ""
    const prev = latestProjectJobState.get(projectId)

    if (!prev || createdAt > prev.createdAt) {
      latestProjectJobState.set(projectId, {
        status: String(job.status || ""),
        createdAt,
      })
    }
  }

  const displayProjects = projects || []

  return (
    <AppPageShell segments={["Prosjekter"]}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
              Prosjekter
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button variant="outline" size="sm">Eksporter</Button>
            <CreateProjectDrawer variant="outline" size="sm" />
          </div>
        </div>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <ProsjekterFilters />
          </CardHeader>
          <CardContent className="pt-0">
            {displayProjects.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-sm text-muted-foreground">
                Ingen prosjekter funnet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {displayProjects.map((project: any, index: number) => {
                  const totalrammeLabel = currencyFormatter.format(Number(project.budget_nok || 0))
                  const customerName = Array.isArray(project.customers)
                    ? project.customers[0]?.name
                    : project.customers?.name || "Ukjent kunde"
                  const projectNumber = String(1001 + index).padStart(4, "0")
                  const periodLabel = `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`
                  const currentStatusConfig =
                    statusConfigByValue[project.status as string] || statusConfigByValue.planning
                  const latestJob = latestProjectJobState.get(project.id)
                  const completedTasks = Array.isArray(project.tasks)
                    ? project.tasks.filter((task: any) => task?.status === "completed").length
                    : 0
                  const totalTasksCount = Array.isArray(project.tasks) ? project.tasks.length : 0

                  let syncLabel = "Ikke synket"
                  let syncClassName = "border-slate-300 bg-slate-50 text-slate-700"

                  if (latestJob && ["failed", "dead_letter"].includes(latestJob.status)) {
                    syncLabel = "Krever handling"
                    syncClassName = "border-rose-300 bg-rose-50 text-rose-700"
                  } else if (latestJob && ["pending", "processing", "retry"].includes(latestJob.status)) {
                    syncLabel = "Syncer..."
                    syncClassName = "border-blue-300 bg-blue-50 text-blue-700"
                  } else if (syncedProjectIds.has(project.id)) {
                    syncLabel = "Synket"
                    syncClassName = "border-emerald-300 bg-emerald-50 text-emerald-700"
                  }

                  return (
                    <Card key={project.id} className="border-border/70 shadow-none transition-colors hover:bg-muted/20">
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              PRJ-{projectNumber}
                            </p>
                            <Link
                              href={`/prosjekter/${project.id}`}
                              className="block truncate text-base font-medium text-foreground hover:underline"
                            >
                              {project.name}
                            </Link>
                          </div>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-md">
                            <Link href={`/prosjekter/${project.id}`} aria-label={`Åpne ${project.name}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Kunde</p>
                            <p className="truncate text-foreground">{customerName}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Ramme</p>
                            <p className="truncate text-foreground">{totalrammeLabel}</p>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <p className="text-xs text-muted-foreground">Periode</p>
                            <p className="truncate text-foreground">{periodLabel}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalBars }).map((_, statusIndex) => {
                                const isFilled = statusIndex < currentStatusConfig.filledBars

                                return (
                                  <span
                                    key={`${project.id}-bar-${statusIndex}`}
                                    className={cn(
                                      "h-2 w-4 rounded-sm bg-muted",
                                      isFilled && currentStatusConfig.fillClass
                                    )}
                                  />
                                )
                              })}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                              {currentStatusConfig.label}
                            </span>
                          </div>

                          {tripletexEnabled && (
                            <Badge variant="outline" className={syncClassName}>
                              {syncLabel}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                          <span>Oppgaver</span>
                          <span>{totalTasksCount > 0 ? `${completedTasks}/${totalTasksCount}` : "0"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </AppPageShell>
  )
}

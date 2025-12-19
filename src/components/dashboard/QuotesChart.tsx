"use client"

import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { getUserAnalytics } from "@/lib/services/analyticsService"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Viser antall tilbud sendt og vunnet de siste 6 månedene"

// We will populate this with real analytics from Firebase
// Each point: { month: string, sent: number, won: number }

const chartConfig = {
  sent: {
    label: "Sendt",
    color: "var(--chart-1)",
  },
  won: {
    label: "Vunnet",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function QuotesChart({ compact }: { compact?: boolean }) {
  const [chartData, setChartData] = useState<Array<{ month: string; sent: number; won: number }>>([])
  const [trendText, setTrendText] = useState<string>('')
  const [trendUp, setTrendUp] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const analytics = await getUserAnalytics()

        // Build last 6 months (oldest -> newest)
        const now = new Date()
        const months = Array.from({ length: 6 }).map((_, idx) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
          return d
        })

        const points = months.map((d) => {
          const monthShort = d.toLocaleDateString('nb-NO', { month: 'short' })
          const monthLong = d.toLocaleDateString('nb-NO', { month: 'long' })
          const monthLabel = monthLong.charAt(0).toUpperCase() + monthLong.slice(1)
          const year = d.getFullYear()

          const monthEntry = analytics?.monthlyData?.find(
            (m) => m.month === monthShort && m.year === year
          )

          return {
            month: monthLabel,
            sent: monthEntry?.antallTilbud ?? 0,
            won: monthEntry?.antallVunnet ?? 0,
          }
        })

        if (!mounted) return
        setChartData(points)

        // Compute trend between last two months (use sent count)
        if (points.length >= 2) {
          const prev = points[points.length - 2].sent
          const last = points[points.length - 1].sent

          if (prev === 0) {
            if (last === 0) {
              setTrendText('Ingen endring siste måned')
              setTrendUp(null)
            } else {
              setTrendText(`+${last} tilbud siste måned`)
              setTrendUp(true)
            }
          } else {
            const percent = ((last - prev) / prev) * 100
            const prefix = percent >= 0 ? 'Opp' : 'Ned'
            setTrendText(`${prefix} ${Math.abs(percent).toFixed(1)}% fra forrige måned`)
            setTrendUp(percent >= 0)
          }
        }
      } catch (error) {
        console.warn('Kunne ikke hente tilbud-analyser:', error)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const startLabel = (() => {
    if (!chartData.length) return ''
    const first = new Date()
    first.setMonth(first.getMonth() - 5)
    return first.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
  })()

  const endLabel = (() => {
    const last = new Date()
    return last.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })
  })()

  // Compute a safe max for Y axis so bars never render above the visible area
  const maxY = chartData.length ? Math.max(...chartData.map(p => Math.max(p.sent || 0, p.won || 0))) : 0
  const yMax = Math.max(1, Math.ceil(maxY * 1.05))



  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 px-5 py-3 space-y-0">
          <CardTitle className="text-base sm:text-lg text-left">Tilbud-statistikk</CardTitle>
          <CardDescription className="text-xs text-left">
            {startLabel} <ArrowRight className="inline-block h-3 w-3" /> {endLabel}
          </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-[140px] h-[180px] min-h-[100px] max-h-[500px] resize-y overflow-auto">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => String(value)}
              />
              <YAxis domain={[0, yMax]} allowDecimals={false} hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
              <Bar dataKey="won" fill="var(--color-won)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium items-center">
          {trendText} {trendUp === null ? null : trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div className="text-muted-foreground leading-none">
          Viser antall tilbud sendt og vunnet de siste månedene.
        </div>
      </CardFooter>
    </Card>
  )
}

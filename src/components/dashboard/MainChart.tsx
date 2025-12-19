"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { HelpCircleIcon } from "lucide-react"
import { getDashboardChartData } from "@/lib/services/analyticsService"

const chartConfig = {
  omsatt: {
    label: "Omsatt",
    color: "var(--chart-1)",
  },
  tilbudt: {
    label: "Tilbudt",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

interface ChartDataPoint {
  date: string;
  omsatt: number;
  tilbudt: number;
}

export function MainChart({compact = false}: {compact?: boolean}) {
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '1y' | 'all'>('7d')
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true)
        const data = await getDashboardChartData(timeRange);
        setChartData(data);
      } catch (error) {
        console.error('Failed to load chart data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [timeRange]);

  // Compute a safe Y max for stacked areas so they won't overflow the visible area
  const maxStack = chartData.length
    ? Math.max(...chartData.map(d => (d.tilbudt || 0) + (d.omsatt || 0)))
    : 0
  const yMax = Math.max(1, Math.ceil(maxStack * 1.05))

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-2">
           <div className="h-8 w-full bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Laster diagram...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0 h-full flex flex-col">
      <CardHeader className={`flex items-center justify-end gap-2 space-y-0 border-b py-3 px-5 sm:flex-row ${compact ? '!py-2 px-3' : ''}`}>
        <div className="flex w-full items-center justify-between gap-2">
            {!compact && (
                <CardTitle className="text-base sm:text-lg">Hovedgraf omsetning</CardTitle>
            )}
            <div className={`flex items-center ${compact ? 'w-full justify-between' : 'gap-4'}`}>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={timeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                  className="text-xs"
                >
                  7d
                </Button>
                <Button
                  variant={timeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                  className="text-xs"
                >
                  30d
                </Button>
                <Button
                  variant={timeRange === '1y' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('1y')}
                  className="text-xs"
                >
                  1år
                </Button>
                <Button
                  variant={timeRange === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('all')}
                  className="text-xs"
                >
                  Alle
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
                    <HelpCircleIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[280px]">
                  <h3 className="text-sm font-medium">Om grafen</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    "Omsatt" viser faktisk inntekt fra fullførte oppdrag i valgt periode. "Tilbudt" er summen av tilbud sendt i samme periode.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-1 pt-2 sm:px-3 sm:pt-3 overflow-hidden min-h-[180px]">
        <ChartContainer
          config={chartConfig}
          className={`w-full ${compact ? 'h-[200px]' : 'h-full'}`}
        >
          <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillOmsatt" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-omsatt)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-omsatt)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillTilbudt" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-tilbudt)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-tilbudt)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis domain={[0, yMax]} allowDecimals={false} hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="tilbudt"
              type="natural"
              fill="url(#fillTilbudt)"
              stroke="var(--color-tilbudt)"
              stackId="a"
            />
            <Area
              dataKey="omsatt"
              type="natural"
              fill="url(#fillOmsatt)"
              stroke="var(--color-omsatt)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
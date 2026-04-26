import { useMemo, useState } from 'react'
import { format, subMonths, subWeeks, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useGarminActivityTotalsQuery } from '@/__generated__/graphql'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'

type Period = 'week' | 'month' | 'year'
type Metric = 'distance' | 'duration' | 'ascent' | 'calories'

interface MetricConfig {
  key: Metric
  label: string
  /** Recharts dataKey on the transformed bucket. */
  dataKey: string
  /** Friendly Y axis / tooltip unit label. */
  unit: string
  /** Bar color (Tailwind-friendly hex). */
  color: string
  /** Number of decimals for tooltip / Y axis ticks. */
  precision: number
}

const METRICS: MetricConfig[] = [
  {
    key: 'distance',
    label: 'Distance',
    dataKey: 'distance_km',
    unit: 'km',
    color: '#2563eb',
    precision: 1,
  },
  {
    key: 'duration',
    label: 'Duration',
    dataKey: 'duration_hours',
    unit: 'hr',
    color: '#16a34a',
    precision: 1,
  },
  {
    key: 'ascent',
    label: 'Ascent',
    dataKey: 'total_ascent_m',
    unit: 'm',
    color: '#f97316',
    precision: 0,
  },
  {
    key: 'calories',
    label: 'Calories',
    dataKey: 'total_calories',
    unit: 'kcal',
    color: '#dc2626',
    precision: 0,
  },
]

interface ChartBucket {
  period_start: string
  label: string
  activity_count: number
  distance_km: number
  duration_hours: number
  total_ascent_m: number
  total_calories: number
}

function getDateRange(period: Period): {
  date_from?: string
  date_to?: string
} {
  const today = new Date()
  const date_to = format(today, 'yyyy-MM-dd')
  if (period === 'week') {
    return { date_from: format(subWeeks(today, 12), 'yyyy-MM-dd'), date_to }
  }
  if (period === 'month') {
    return { date_from: format(subMonths(today, 12), 'yyyy-MM-dd'), date_to }
  }
  // 'year' — let the API return all available history
  return {}
}

function formatBucketLabel(period_start: string, period: Period): string {
  try {
    const date = parseISO(period_start)
    if (period === 'year') return format(date, 'yyyy')
    if (period === 'month') return format(date, "MMM ''yy")
    return format(date, 'MMM d')
  } catch {
    return period_start
  }
}

export function GarminActivityTotals() {
  const [period, setPeriod] = useState<Period>('month')
  const [metric, setMetric] = useState<Metric>('distance')

  const range = getDateRange(period)
  const { data, loading, error, refetch } = useGarminActivityTotalsQuery({
    variables: {
      period,
      date_from: range.date_from,
      date_to: range.date_to,
    },
  })

  const chartData = useMemo<ChartBucket[]>(() => {
    const totals = data?.garminActivityTotals ?? []
    return totals.map((t) => ({
      period_start: t.period_start,
      label: formatBucketLabel(t.period_start, period),
      activity_count: t.activity_count,
      distance_km: t.total_distance_km ?? 0,
      duration_hours: (t.total_duration_seconds ?? 0) / 3600,
      total_ascent_m: t.total_ascent_m ?? 0,
      total_calories: t.total_calories ?? 0,
    }))
  }, [data, period])

  const metricConfig =
    METRICS.find((m) => m.key === metric) ?? METRICS[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activity Totals
        </CardTitle>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}
          >
            <TabsList>
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            value={metric}
            onValueChange={(v) => setMetric(v as Metric)}
          >
            <TabsList>
              {METRICS.map((m) => (
                <TabsTrigger key={m.key} value={m.key}>
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState message="Loading activity totals..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No activities found for this period.
          </p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) =>
                    v.toFixed(metricConfig.precision)
                  }
                  label={{
                    value: metricConfig.unit,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value) => {
                    const num = typeof value === 'number' ? value : Number(value)
                    return [
                      `${num.toFixed(metricConfig.precision)} ${metricConfig.unit}`,
                      metricConfig.label,
                    ]
                  }}
                  labelFormatter={(label, payload) => {
                    const count =
                      (payload?.[0]?.payload as ChartBucket | undefined)
                        ?.activity_count ?? 0
                    return `${label} — ${count} ${
                      count === 1 ? 'activity' : 'activities'
                    }`
                  }}
                />
                <Bar
                  dataKey={metricConfig.dataKey}
                  fill={metricConfig.color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

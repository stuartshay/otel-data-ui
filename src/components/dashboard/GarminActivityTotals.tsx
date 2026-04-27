import { useMemo, useState } from 'react'
import { format, parseISO, subWeeks } from 'date-fns'
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
import {
  useGarminActivityTotalsQuery,
  useGarminDateRangeQuery,
} from '@/__generated__/graphql'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { cn } from '@/lib/utils'

interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  ariaLabel: string
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
}

function SegmentedControl<T extends string>({
  ariaLabel,
  value,
  onChange,
  options,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border bg-muted p-0.5"
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <Button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            variant={selected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-7 px-3 text-xs',
              !selected && 'bg-transparent shadow-none',
            )}
          >
            {opt.label}
          </Button>
        )
      })}
    </div>
  )
}

type Period = 'week' | 'month' | 'year'
type Metric = 'distance' | 'duration' | 'ascent' | 'calories'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const MONTH_FULL_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

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

function getDateRange(period: Exclude<Period, 'month'>): {
  date_from?: string
  date_to?: string
} {
  const today = new Date()
  const date_to = format(today, 'yyyy-MM-dd')
  if (period === 'week') {
    return { date_from: format(subWeeks(today, 12), 'yyyy-MM-dd'), date_to }
  }
  // 'year' — let the API return all available history
  return {}
}

function toDateOnly(value?: string | null): string | undefined {
  if (!value) return undefined

  const parsed = parseISO(value)
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, 'yyyy-MM-dd')
  }

  // Fallback for already-date-like strings that parseISO rejected.
  return value.slice(0, 10)
}

function formatBucketLabel(period_start: string, period: Period): string {
  try {
    const date = parseISO(period_start)
    if (period === 'year') return format(date, 'yyyy')
    if (period === 'month') return format(date, 'yyyy')
    return format(date, 'MMM d')
  } catch {
    return period_start
  }
}

export function GarminActivityTotals() {
  const [period, setPeriod] = useState<Period>('month')
  const [metric, setMetric] = useState<Metric>('distance')
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  )

  // Fetch Garmin date range so monthly mode can request full history,
  // then filter to one selected month across all years on the client.
  const { data: dateRangeData } = useGarminDateRangeQuery()

  // Build query date range depending on period
  const range = useMemo(() => {
    if (period === 'month') {
      return {
        date_from: toDateOnly(dateRangeData?.garminDateRange?.min_date),
        date_to: toDateOnly(dateRangeData?.garminDateRange?.max_date),
      }
    }
    return getDateRange(period)
  }, [period, dateRangeData])

  const { data, loading, error, refetch } = useGarminActivityTotalsQuery({
    variables: {
      period,
      date_from: range.date_from,
      date_to: range.date_to,
    },
  })

  const chartData = useMemo<ChartBucket[]>(() => {
    const totals = data?.garminActivityTotals ?? []
    const mapped = totals.map((t) => ({
      period_start: t.period_start,
      label: formatBucketLabel(t.period_start, period),
      activity_count: t.activity_count,
      distance_km: t.total_distance_km ?? 0,
      duration_hours: (t.total_duration_seconds ?? 0) / 3600,
      total_ascent_m: t.total_ascent_m ?? 0,
      total_calories: t.total_calories ?? 0,
    }))

    if (period !== 'month') {
      return mapped
    }

    const byYear = new Map<string, ChartBucket>()

    for (const bucket of mapped) {
      const bucketDate = parseISO(bucket.period_start)
      if (Number.isNaN(bucketDate.getTime())) {
        continue
      }

      if (bucketDate.getMonth() !== selectedMonth) {
        continue
      }

      const year = format(bucketDate, 'yyyy')
      const existing = byYear.get(year)

      if (!existing) {
        byYear.set(year, { ...bucket, label: year })
        continue
      }

      byYear.set(year, {
        ...existing,
        activity_count: existing.activity_count + bucket.activity_count,
        distance_km: existing.distance_km + bucket.distance_km,
        duration_hours: existing.duration_hours + bucket.duration_hours,
        total_ascent_m: existing.total_ascent_m + bucket.total_ascent_m,
        total_calories: existing.total_calories + bucket.total_calories,
      })
    }

    return Array.from(byYear.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    )
  }, [data, period, selectedMonth])

  const metricConfig = METRICS.find((m) => m.key === metric) ?? METRICS[0]

  return (
    <Card data-testid="activity-totals-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activity Totals
          {period === 'month' && (
            <span className="text-sm font-normal text-muted-foreground">
              — {MONTH_FULL_NAMES[selectedMonth]} by year
            </span>
          )}
        </CardTitle>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SegmentedControl<Period>
              ariaLabel="Aggregation period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
                { value: 'year', label: 'Yearly' },
              ]}
            />
            {period === 'month' && (
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger
                  className="h-7 w-24 text-xs"
                  aria-label="Select month"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_LABELS.map((label, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <SegmentedControl<Metric>
            ariaLabel="Metric"
            value={metric}
            onChange={setMetric}
            options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
          />
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                    const num =
                      typeof value === 'number' ? value : Number(value)
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

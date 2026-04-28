import { useEffect, useMemo, useState } from 'react'
import { addDays, endOfMonth, format, parseISO, subDays } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { useApolloClient } from '@apollo/client/react'
import {
  GarminActivityTotalsDocument,
  type GarminActivityTotalsQuery,
  type GarminActivityTotalsQueryVariables,
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

function getDateRange(period: 'year'): {
  date_from?: string
  date_to?: string
} {
  // 'year' — let the API return all available history
  void period
  return {}
}

function getYearFromDateString(value?: string | null): number | undefined {
  if (!value) return undefined
  const yearPrefix = value.slice(0, 4)
  const year = Number(yearPrefix)
  return Number.isFinite(year) ? year : undefined
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
  // Anchor date for the trailing 7-day window in weekly mode. Defaults to
  // today; Prev/Next pages by 7 days. Future dates are allowed.
  const [weekEnd, setWeekEnd] = useState<Date>(() => new Date())
  const weekStart = useMemo(() => subDays(weekEnd, 6), [weekEnd])

  // Per-year aggregated totals for weekly mode (one entry per year, summed
  // across the projected 7-day window for that year).
  const [weeklyByYear, setWeeklyByYear] = useState<ChartBucket[]>([])
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [weeklyError, setWeeklyError] = useState<Error | null>(null)
  const apolloClient = useApolloClient()

  // Fetch Garmin date range so monthly mode can request full history,
  // then filter to one selected month across all years on the client.
  const { data: dateRangeData } = useGarminDateRangeQuery()

  // Build query date range depending on period
  const range = useMemo(() => {
    if (period === 'month') {
      const currentYear = new Date().getFullYear()
      const minYear =
        getYearFromDateString(dateRangeData?.garminDateRange?.min_date) ??
        currentYear
      const maxYear =
        getYearFromDateString(dateRangeData?.garminDateRange?.max_date) ??
        currentYear

      return {
        date_from: format(new Date(minYear, selectedMonth, 1), 'yyyy-MM-dd'),
        date_to: format(
          endOfMonth(new Date(maxYear, selectedMonth, 1)),
          'yyyy-MM-dd',
        ),
      }
    }
    if (period === 'year') {
      return getDateRange('year')
    }
    // 'week' uses a separate per-year fetch path; no main-query range.
    return {}
  }, [period, selectedMonth, dateRangeData])

  const { data, loading, error, refetch } = useGarminActivityTotalsQuery({
    variables: {
      period,
      date_from: range.date_from,
      date_to: range.date_to,
    },
    skip: period === 'week',
  })

  // Year list spanning known Garmin history.
  const yearList = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const minYear =
      getYearFromDateString(dateRangeData?.garminDateRange?.min_date) ??
      currentYear
    const maxYear = Math.max(currentYear, weekEnd.getFullYear())
    const years: number[] = []
    for (let y = minYear; y <= maxYear; y += 1) years.push(y)
    return years
  }, [dateRangeData, weekEnd])

  // Weekly mode: fire one query per year for the projected 7-day window.
  // Sum returned weekly buckets per year (the API filters by date_from/date_to
  // before grouping, so summing all rows yields the correct window total even
  // when DATE_TRUNC('week', ...) splits the window across two ISO weeks).
  useEffect(() => {
    if (period !== 'week') return
    let cancelled = false

    const baseEndYear = weekEnd.getFullYear()

    const run = async () => {
      setWeeklyLoading(true)
      setWeeklyError(null)
      const promises = yearList.map(async (year) => {
        const offset = year - baseEndYear
        const ws = new Date(weekStart)
        ws.setFullYear(weekStart.getFullYear() + offset)
        const we = new Date(weekEnd)
        we.setFullYear(weekEnd.getFullYear() + offset)
        const result = await apolloClient.query<
          GarminActivityTotalsQuery,
          GarminActivityTotalsQueryVariables
        >({
          query: GarminActivityTotalsDocument,
          variables: {
            period: 'week',
            date_from: format(ws, 'yyyy-MM-dd'),
            date_to: format(we, 'yyyy-MM-dd'),
          },
          fetchPolicy: 'cache-first',
        })
        const buckets = result.data?.garminActivityTotals ?? []
        const summed: ChartBucket = buckets.reduce<ChartBucket>(
          (acc, b) => ({
            period_start: acc.period_start,
            label: String(year),
            activity_count: acc.activity_count + b.activity_count,
            distance_km: acc.distance_km + (b.total_distance_km ?? 0),
            duration_hours:
              acc.duration_hours + (b.total_duration_seconds ?? 0) / 3600,
            total_ascent_m: acc.total_ascent_m + (b.total_ascent_m ?? 0),
            total_calories: acc.total_calories + (b.total_calories ?? 0),
          }),
          {
            period_start: format(ws, 'yyyy-MM-dd'),
            label: String(year),
            activity_count: 0,
            distance_km: 0,
            duration_hours: 0,
            total_ascent_m: 0,
            total_calories: 0,
          },
        )
        return summed
      })

      try {
        const results = await Promise.all(promises)
        if (cancelled) return
        setWeeklyByYear(results.sort((a, b) => a.label.localeCompare(b.label)))
        setWeeklyLoading(false)
      } catch (err) {
        if (cancelled) return
        setWeeklyError(
          err instanceof Error
            ? err
            : new Error('Failed to load weekly totals'),
        )
        setWeeklyLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [period, weekStart, weekEnd, yearList, apolloClient])

  const chartData = useMemo<ChartBucket[]>(() => {
    if (period === 'week') {
      return weeklyByYear
    }
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

    if (period !== 'month' && period !== 'year') {
      return mapped
    }

    // Preserve the "no Garmin data" empty state — if the API returned no
    // buckets at all, render nothing rather than zero-filled bars.
    if (mapped.length === 0) {
      return []
    }

    // Seed every year in the known Garmin range with a zero bucket so the
    // chart shows a continuous x-axis even when some years have no activity.
    const byYear = new Map<string, ChartBucket>()
    for (const year of yearList) {
      const yearStr = String(year)
      const periodStart =
        period === 'month'
          ? `${yearStr}-${String(selectedMonth + 1).padStart(2, '0')}-01`
          : `${yearStr}-01-01`
      byYear.set(yearStr, {
        period_start: periodStart,
        label: yearStr,
        activity_count: 0,
        distance_km: 0,
        duration_hours: 0,
        total_ascent_m: 0,
        total_calories: 0,
      })
    }

    for (const bucket of mapped) {
      const bucketDate = parseISO(bucket.period_start)
      if (Number.isNaN(bucketDate.getTime())) {
        continue
      }

      if (period === 'month' && bucketDate.getMonth() !== selectedMonth) {
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
  }, [data, period, selectedMonth, weeklyByYear, yearList])

  const metricConfig = METRICS.find((m) => m.key === metric) ?? METRICS[0]

  const weekRangeLabel = useMemo(
    () => `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
    [weekStart, weekEnd],
  )

  const isLoading = period === 'week' ? weeklyLoading : loading
  const activeError = period === 'week' ? weeklyError : error
  const handleRetry = () => {
    if (period === 'week') {
      // Re-trigger the effect by bumping weekEnd reference identity.
      setWeekEnd(new Date(weekEnd))
    } else {
      void refetch()
    }
  }

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
          {period === 'week' && (
            <span className="text-sm font-normal text-muted-foreground">
              — {weekRangeLabel} by year
            </span>
          )}
        </CardTitle>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
            {period === 'week' && (
              <div
                className="inline-flex items-center gap-1"
                aria-label="Week range navigation"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  aria-label="Previous week"
                  onClick={() => setWeekEnd((d) => subDays(d, 7))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span
                  data-testid="week-range-pill"
                  aria-live="polite"
                  className="inline-flex h-7 items-center rounded-md border bg-muted px-3 text-xs font-medium tabular-nums"
                >
                  {weekRangeLabel}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  aria-label="Next week"
                  onClick={() => setWeekEnd((d) => addDays(d, 7))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
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
        {isLoading ? (
          <LoadingState message="Loading activity totals..." />
        ) : activeError ? (
          <ErrorState message={activeError.message} onRetry={handleRetry} />
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

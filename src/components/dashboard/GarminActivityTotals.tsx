import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import type { TypedDocumentNode } from '@apollo/client'
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
}: Readonly<SegmentedControlProps<T>>) {
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

const ACTIVITY_TOTALS_START_YEAR = 2010
const GARMIN_ACTIVITY_TOTALS_DOCUMENT =
  GarminActivityTotalsDocument as TypedDocumentNode<
    GarminActivityTotalsQuery,
    GarminActivityTotalsQueryVariables
  >

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

function getDateRange(): {
  date_from?: string
  date_to?: string
} {
  // 'year' period — let the API return all available history
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

function hasBucketData(bucket: ChartBucket): boolean {
  return (
    bucket.distance_km > 0 ||
    bucket.duration_hours > 0 ||
    bucket.total_ascent_m > 0 ||
    bucket.total_calories > 0
  )
}

function trimLeadingEmptyBuckets(buckets: ChartBucket[]): ChartBucket[] {
  const firstDataIndex = buckets.findIndex(hasBucketData)
  return firstDataIndex === -1 ? [] : buckets.slice(firstDataIndex)
}

type GarminApolloClient = ReturnType<typeof useApolloClient>

// Project a date into a target year by preserving month/day and clamping
// invalid dates (e.g. Feb 29 in a non-leap year) to the last valid day of
// that month. Avoids the silent date-shift produced by Date#setFullYear.
function projectToYear(source: Date, targetYear: number): Date {
  const month = source.getMonth()
  const day = source.getDate()
  // Day 0 of next month yields the last day of the current month.
  const lastDay = new Date(targetYear, month + 1, 0).getDate()
  return new Date(targetYear, month, Math.min(day, lastDay))
}

// Fetch and aggregate the projected 7-day window for a single year. The API
// filters by date_from/date_to before grouping, so summing all returned rows
// yields the correct window total even when DATE_TRUNC('week', ...) splits the
// window across two ISO weeks.
async function fetchYearWeeklyTotal(
  apolloClient: GarminApolloClient,
  year: number,
  weekStart: Date,
  weekEnd: Date,
  baseEndYear: number,
): Promise<ChartBucket> {
  const ws = projectToYear(
    weekStart,
    weekStart.getFullYear() + (year - baseEndYear),
  )
  const we = projectToYear(weekEnd, year)
  const result = await apolloClient.query({
    query: GARMIN_ACTIVITY_TOTALS_DOCUMENT,
    variables: {
      period: 'week',
      date_from: format(ws, 'yyyy-MM-dd'),
      date_to: format(we, 'yyyy-MM-dd'),
    },
    fetchPolicy: 'cache-first',
  })
  const buckets = result.data?.garminActivityTotals ?? []
  return buckets.reduce<ChartBucket>(
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
}

// Fetch the weekly totals for every year in the list, limiting concurrency so
// dashboards with long Garmin history don't fan out N parallel requests on
// every Prev/Next click. Returns null if the caller cancelled mid-flight.
async function fetchWeeklyTotalsByYear(
  apolloClient: GarminApolloClient,
  yearList: number[],
  weekStart: Date,
  weekEnd: Date,
  isCancelled: () => boolean,
): Promise<ChartBucket[] | null> {
  const baseEndYear = weekEnd.getFullYear()
  const CONCURRENCY = 4
  const results: ChartBucket[] = new Array(yearList.length)
  for (let i = 0; i < yearList.length; i += CONCURRENCY) {
    if (isCancelled()) return null
    const batch = yearList.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map((year) =>
        fetchYearWeeklyTotal(
          apolloClient,
          year,
          weekStart,
          weekEnd,
          baseEndYear,
        ),
      ),
    )
    batchResults.forEach((b, j) => {
      results[i + j] = b
    })
  }
  if (isCancelled()) return null
  const sortedResults = [...results]
  sortedResults.sort((a, b) => a.label.localeCompare(b.label))
  return trimLeadingEmptyBuckets(sortedResults)
}

interface RelevantBucket {
  bucket: ChartBucket
  year: string
}

function mapTotalsToBuckets(
  totals: GarminActivityTotalsQuery['garminActivityTotals'],
  period: Period,
): ChartBucket[] {
  return totals.map((t) => ({
    period_start: t.period_start,
    label: formatBucketLabel(t.period_start, period),
    activity_count: t.activity_count,
    distance_km: t.total_distance_km ?? 0,
    duration_hours: (t.total_duration_seconds ?? 0) / 3600,
    total_ascent_m: t.total_ascent_m ?? 0,
    total_calories: t.total_calories ?? 0,
  }))
}

// Keep buckets that fall within the selected month (when applicable) and
// carry a parseable date, tagging each with its calendar year.
function buildRelevantBuckets(
  mapped: ChartBucket[],
  period: Period,
  selectedMonth: number,
): RelevantBucket[] {
  return mapped.flatMap((bucket) => {
    const bucketDate = parseISO(bucket.period_start)
    if (Number.isNaN(bucketDate.getTime())) {
      return []
    }
    if (period === 'month' && bucketDate.getMonth() !== selectedMonth) {
      return []
    }
    return [{ bucket, year: format(bucketDate, 'yyyy') }]
  })
}

// Date-range metadata and imported outliers can predate the intended dashboard
// history. Return the first activity year from the display floor onward, or
// null when there is no real data to anchor on.
function findEarliestDataYear(
  relevantBuckets: RelevantBucket[],
): number | null {
  const dataYears = relevantBuckets
    .filter(
      ({ bucket, year }) =>
        Number(year) >= ACTIVITY_TOTALS_START_YEAR && hasBucketData(bucket),
    )
    .map(({ year }) => Number(year))
  return dataYears.length === 0 ? null : Math.min(...dataYears)
}

// Seed a zero-filled bucket for every year from the earliest data year onward
// so the chart remains continuous even for years without activities.
function buildYearScaffold(
  yearList: number[],
  earliestDataYear: number,
  period: Period,
  selectedMonth: number,
): Map<string, ChartBucket> {
  const byYear = new Map<string, ChartBucket>()
  for (const year of yearList) {
    if (year < earliestDataYear) {
      continue
    }
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
  return byYear
}

// Accumulate each relevant bucket into its year, summing metrics when a year
// already has an entry from the scaffold or a prior bucket.
function mergeRelevantBuckets(
  byYear: Map<string, ChartBucket>,
  relevantBuckets: RelevantBucket[],
  earliestDataYear: number,
): void {
  for (const { bucket, year } of relevantBuckets) {
    if (Number(year) < earliestDataYear) {
      continue
    }
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
}

// Aggregate mapped buckets into one entry per year for monthly/yearly views,
// preserving the "no Garmin data" empty state.
function aggregateYearlyChartData(
  mapped: ChartBucket[],
  period: Period,
  selectedMonth: number,
  yearList: number[],
): ChartBucket[] {
  if (mapped.length === 0) {
    return []
  }
  const relevantBuckets = buildRelevantBuckets(mapped, period, selectedMonth)
  if (relevantBuckets.length === 0) {
    return []
  }
  const earliestDataYear = findEarliestDataYear(relevantBuckets)
  if (earliestDataYear === null) {
    return []
  }
  const byYear = buildYearScaffold(
    yearList,
    earliestDataYear,
    period,
    selectedMonth,
  )
  mergeRelevantBuckets(byYear, relevantBuckets, earliestDataYear)
  return Array.from(byYear.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  )
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
      return getDateRange()
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
    for (
      let y = Math.max(minYear, ACTIVITY_TOTALS_START_YEAR);
      y <= maxYear;
      y += 1
    ) {
      years.push(y)
    }
    return years
  }, [dateRangeData, weekEnd])

  // Weekly mode: fire one query per year for the projected 7-day window.
  // Sum returned weekly buckets per year (the API filters by date_from/date_to
  // before grouping, so summing all rows yields the correct window total even
  // when DATE_TRUNC('week', ...) splits the window across two ISO weeks).
  useEffect(() => {
    if (period !== 'week') return
    let cancelled = false

    const run = async () => {
      setWeeklyLoading(true)
      setWeeklyError(null)
      try {
        const results = await fetchWeeklyTotalsByYear(
          apolloClient,
          yearList,
          weekStart,
          weekEnd,
          () => cancelled,
        )
        if (results === null || cancelled) return
        setWeeklyByYear(results)
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
    const mapped = mapTotalsToBuckets(data?.garminActivityTotals ?? [], period)
    if (period !== 'month' && period !== 'year') {
      return mapped
    }
    return aggregateYearlyChartData(mapped, period, selectedMonth, yearList)
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

  let statusNode: ReactNode = null
  if (isLoading) {
    statusNode = <LoadingState message="Loading activity totals..." />
  } else if (activeError) {
    statusNode = (
      <ErrorState message={activeError.message} onRetry={handleRetry} />
    )
  } else if (chartData.length === 0) {
    statusNode = (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No activities found for this period.
      </p>
    )
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
                    <SelectItem key={label} value={String(index)}>
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
        {statusNode ?? (
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

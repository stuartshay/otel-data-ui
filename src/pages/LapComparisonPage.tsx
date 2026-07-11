import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format as formatDate } from 'date-fns'
import {
  useGarminLapsComparisonQuery,
  useGarminDateRangeQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { Button } from '@/components/ui/button'
import { LapComparisonMatrix } from '@/components/garmin/LapComparisonMatrix'
import {
  LAP_METRICS,
  getMetricDef,
  type ComparisonItem,
  type LapMetric,
} from '@/components/garmin/lapComparison'
import { parseDateRangeParams, toLocalDate } from '@/lib/date-range'
import { setNRCustomAttribute } from '@/lib/newrelic-browser'

const MAX_ACTIVITIES = 50

function HeatLegend({ metricUnit }: Readonly<{ metricUnit: string }>) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <span>Worse</span>
        <span
          className="inline-block h-3 w-24 rounded"
          style={{
            background:
              'linear-gradient(to right, hsl(0 65% 45% / 0.5), hsl(60 65% 45% / 0.5), hsl(120 65% 45% / 0.5))',
          }}
        />
        <span>Better</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded ring-1 ring-inset ring-primary" />
        <span>Personal best</span>
      </div>
      <div>Values in {metricUnit}</div>
    </div>
  )
}

export function LapComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [metric, setMetric] = useState<LapMetric>('speed')

  useEffect(() => {
    setNRCustomAttribute('garmin.flow', true)
  }, [])

  const dateFromParam = searchParams.get('date_from')
  const dateToParam = searchParams.get('date_to')
  const { data: dateRangeData } = useGarminDateRangeQuery()
  const DATA_MIN_DATE = dateRangeData?.garminDateRange?.min_date
    ? toLocalDate(dateRangeData.garminDateRange.min_date)
    : undefined
  const DATA_MAX_DATE = dateRangeData?.garminDateRange?.max_date
    ? toLocalDate(dateRangeData.garminDateRange.max_date)
    : new Date()
  const {
    dateFrom,
    dateTo,
    dateFromParam: dateFromStr,
    dateToParam: dateToStr,
  } = parseDateRangeParams(dateFromParam, dateToParam, {
    minDate: DATA_MIN_DATE,
    maxDate: DATA_MAX_DATE,
  })

  const { data, loading, error, refetch } = useGarminLapsComparisonQuery({
    variables: {
      sport: 'cycling',
      date_from: dateFromStr,
      date_to: dateToStr,
      limit: MAX_ACTIVITIES,
    },
  })

  const items = (data?.garminLapsComparison?.items ?? []) as ComparisonItem[]
  const total = data?.garminLapsComparison?.total ?? 0
  const metricUnit = getMetricDef(metric).unit

  let statusNode: ReactNode = null
  if (loading && !data) {
    statusNode = <LoadingState message="Loading laps..." />
  } else if (error) {
    statusNode = (
      <ErrorState message={error.message} onRetry={() => refetch()} />
    )
  } else if (items.length === 0) {
    statusNode = (
      <EmptyState
        title="No laps to compare"
        message="No cycling laps found for this date range."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lap Comparison</h1>
        <p className="text-muted-foreground">
          Compare 5-mile auto-laps across cycling activities over time
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {LAP_METRICS.map((m) => (
            <Button
              key={m.key}
              variant={metric === m.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="ml-auto">
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            minDate={DATA_MIN_DATE}
            maxDate={DATA_MAX_DATE}
            onRangeChange={(from, to) => {
              const params = new URLSearchParams(searchParams)
              if (from) params.set('date_from', formatDate(from, 'yyyy-MM-dd'))
              else params.delete('date_from')
              if (to) params.set('date_to', formatDate(to, 'yyyy-MM-dd'))
              else params.delete('date_to')
              setSearchParams(params)
            }}
          />
        </div>
      </div>

      {statusNode ?? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {items.length} of {total.toLocaleString()} activities
          </p>
          <LapComparisonMatrix items={items} metric={metric} />
          <HeatLegend metricUnit={metricUnit} />
        </div>
      )}
    </div>
  )
}

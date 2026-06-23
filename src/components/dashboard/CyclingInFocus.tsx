import { useMemo, useState } from 'react'
import { addDays, differenceInCalendarDays, format, subDays } from 'date-fns'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { Bike, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGarminActivitiesQuery } from '@/__generated__/graphql'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/shared/ErrorState'
import { cn } from '@/lib/utils'
import { formatDuration, kmToMi } from '@/lib/units'

const SPORT = 'cycling'
const BAR_COLOR = '#2563eb'
const ACTIVITY_LIMIT = 200
const RECENT_WEEK_DOTS = 4

// Weekday initial keyed by Date#getDay() (0 = Sunday).
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface DayBucket {
  /** ISO day key (yyyy-MM-dd). */
  key: string
  /** Single-letter weekday label. */
  label: string
  /** Total distance for the day, in miles. */
  distance_mi: number
}

export function CyclingInFocus() {
  // `today` is fixed at mount so the "Last 4w" dots stay anchored to the
  // current week regardless of how far the user pages back/forward.
  const [today] = useState<Date>(() => new Date())
  // Anchor date for the trailing 7-day window. Defaults to today; Prev/Next
  // pages by 7 days.
  const [weekEnd, setWeekEnd] = useState<Date>(() => new Date())
  const weekStart = useMemo(() => subDays(weekEnd, 6), [weekEnd])

  const dateFrom = format(weekStart, 'yyyy-MM-dd')
  const dateTo = format(weekEnd, 'yyyy-MM-dd')

  const { data, loading, error, refetch } = useGarminActivitiesQuery({
    variables: {
      sport: SPORT,
      date_from: dateFrom,
      date_to: dateTo,
      limit: ACTIVITY_LIMIT,
    },
  })

  const { days, totalDistanceMi, totalSeconds, activityCount } = useMemo(() => {
    const buckets: DayBucket[] = []
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(weekStart, i)
      buckets.push({
        key: format(day, 'yyyy-MM-dd'),
        label: DAY_INITIALS[day.getDay()],
        distance_mi: 0,
      })
    }
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

    let totalKm = 0
    let seconds = 0
    let count = 0
    for (const activity of data?.garminActivities?.items ?? []) {
      if (!activity.start_time) continue
      const bucket = byKey.get(activity.start_time.slice(0, 10))
      if (!bucket) continue
      const km = activity.distance_km ?? 0
      bucket.distance_mi += kmToMi(km)
      totalKm += km
      seconds += activity.duration_seconds ?? 0
      count += 1
    }

    return {
      days: buckets,
      totalDistanceMi: kmToMi(totalKm),
      totalSeconds: seconds,
      activityCount: count,
    }
  }, [data, weekStart])

  const weekRangeLabel = useMemo(
    () => `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
    [weekStart, weekEnd],
  )

  // How many whole weeks back from today the current window sits (0 = current).
  const weekOffset = useMemo(
    () => Math.round(differenceInCalendarDays(today, weekEnd) / 7),
    [today, weekEnd],
  )

  return (
    <Card
      data-testid="cycling-in-focus-card"
      className="border-slate-200 bg-white text-slate-900 shadow-sm"
    >
      <CardContent className="space-y-3 p-4">
        {error ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bike className="h-4 w-4 text-green-600" />
                Cycling
                <span
                  data-testid="in-focus-week-range"
                  className="font-normal text-slate-500"
                >
                  · {weekRangeLabel}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1"
                aria-label="Week range navigation"
              >
                <button
                  type="button"
                  aria-label="Previous week"
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setWeekEnd((d) => subDays(d, 7))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next week"
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setWeekEnd((d) => addDays(d, 7))}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span
                data-testid="in-focus-total-distance"
                className="text-3xl font-bold tabular-nums"
              >
                {totalDistanceMi.toFixed(2)}
                <span className="ml-1 text-base font-normal text-slate-500">
                  mi
                </span>
              </span>
              <span className="text-xs text-slate-500">
                <span className="block font-semibold tabular-nums text-slate-900">
                  {formatDuration(totalSeconds)}
                </span>
                Total Time
              </span>
            </div>

            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={days}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value) => {
                      const num =
                        typeof value === 'number' ? value : Number(value)
                      return [`${num.toFixed(2)} mi`, 'Distance']
                    }}
                  />
                  <Bar dataKey="distance_mi" radius={[4, 4, 0, 0]}>
                    {days.map((day) => (
                      <Cell
                        key={day.key}
                        fill={BAR_COLOR}
                        fillOpacity={day.distance_mi > 0 ? 1 : 0.2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <div
                className="flex items-center gap-1.5"
                aria-label="Recent weeks"
              >
                {Array.from({ length: RECENT_WEEK_DOTS }).map((_, idx) => {
                  // Dots run oldest → newest (left → right); newest = offset 0.
                  const dotOffset = RECENT_WEEK_DOTS - 1 - idx
                  const active = dotOffset === weekOffset
                  return (
                    <button
                      key={dotOffset}
                      type="button"
                      aria-label={
                        dotOffset === 0
                          ? 'This week'
                          : `${dotOffset} week${dotOffset > 1 ? 's' : ''} ago`
                      }
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setWeekEnd(subDays(today, dotOffset * 7))}
                      className={cn(
                        'h-2 w-2 rounded-full transition-colors',
                        active
                          ? 'bg-slate-700'
                          : 'bg-slate-300 hover:bg-slate-400',
                      )}
                    />
                  )
                })}
              </div>
              <span className="text-xs text-slate-500">
                {loading
                  ? 'Loading…'
                  : `Last 4w · ${activityCount} ${
                      activityCount === 1 ? 'ride' : 'rides'
                    }`}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

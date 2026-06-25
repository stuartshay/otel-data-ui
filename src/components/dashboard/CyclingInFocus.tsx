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
import { formatDuration, formatDurationShort, kmToMi } from '@/lib/units'

const SPORT = 'cycling'
const BAR_COLOR = '#2563eb'
const ACTIVITY_LIMIT = 200
// One dot per day across the last 4 weeks (28 days).
const RECENT_DAYS = 28

// Weekday initial keyed by Date#getDay() (0 = Sunday).
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface DayBucket {
  /** ISO day key (yyyy-MM-dd). */
  date: string
  /** Single-letter weekday label. */
  label: string
  /** Total distance for the day, in miles. */
  distance_mi: number
  /** Total moving time for the day, in seconds. */
  duration_seconds: number
  /** Number of rides completed that day. */
  count: number
}

// Recharts tooltip styled to match the Garmin Activity heatmap day popover.
function ActivityTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: DayBucket }>
}) {
  const day = payload?.[0]?.payload
  if (!active || !day) return null

  const formattedDate = format(
    new Date(`${day.date}T00:00:00`),
    'EEE, MMM d, yyyy',
  )

  return (
    <div className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
      <div className="border-b px-3 py-1.5">
        <p className="text-xs font-semibold">{formattedDate}</p>
        <p className="text-[11px] text-muted-foreground">
          {day.count} {day.count === 1 ? 'activity' : 'activities'}
        </p>
      </div>
      {day.count > 0 ? (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-1 text-left font-medium text-muted-foreground">
                Sport
              </th>
              <th className="px-2 py-1 text-right font-medium text-muted-foreground">
                Distance
              </th>
              <th className="px-3 py-1 text-right font-medium text-muted-foreground">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-1">Cycling</td>
              <td className="px-2 py-1 text-right tabular-nums">
                {day.distance_mi.toFixed(2)} mi
              </td>
              <td className="px-3 py-1 text-right tabular-nums">
                {formatDurationShort(day.duration_seconds)}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="px-3 py-2 text-[11px] text-muted-foreground">
          No activities.
        </p>
      )}
    </div>
  )
}

export function CyclingInFocus() {
  // `today` is fixed at mount so the "Last 4w" strip stays anchored to the
  // current date regardless of how far the user pages back/forward.
  const [today] = useState<Date>(() => new Date())
  // Anchor date for the trailing 7-day window. Defaults to today; Prev/Next
  // pages by 7 days.
  const [weekEnd, setWeekEnd] = useState<Date>(() => new Date())
  const weekStart = useMemo(() => subDays(weekEnd, 6), [weekEnd])

  // Trailing 4-week (28-day) window for the activity strip + ride count.
  const recentStart = useMemo(() => subDays(today, RECENT_DAYS - 1), [today])
  const { data: recentData, loading: recentLoading } = useGarminActivitiesQuery(
    {
      variables: {
        sport: SPORT,
        date_from: format(recentStart, 'yyyy-MM-dd'),
        date_to: format(today, 'yyyy-MM-dd'),
        limit: ACTIVITY_LIMIT,
      },
    },
  )

  const dateFrom = format(weekStart, 'yyyy-MM-dd')
  const dateTo = format(weekEnd, 'yyyy-MM-dd')

  const { data, error, refetch } = useGarminActivitiesQuery({
    variables: {
      sport: SPORT,
      date_from: dateFrom,
      date_to: dateTo,
      limit: ACTIVITY_LIMIT,
    },
  })

  const { days, totalDistanceMi, totalSeconds } = useMemo(() => {
    const buckets: DayBucket[] = []
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(weekStart, i)
      buckets.push({
        date: format(day, 'yyyy-MM-dd'),
        label: DAY_INITIALS[day.getDay()],
        distance_mi: 0,
        duration_seconds: 0,
        count: 0,
      })
    }
    const byDate = new Map(buckets.map((bucket) => [bucket.date, bucket]))

    let totalKm = 0
    let seconds = 0
    for (const activity of data?.garminActivities?.items ?? []) {
      if (!activity.start_time) continue
      const bucket = byDate.get(activity.start_time.slice(0, 10))
      if (!bucket) continue
      const km = activity.distance_km ?? 0
      const dur = activity.duration_seconds ?? 0
      bucket.distance_mi += kmToMi(km)
      bucket.duration_seconds += dur
      bucket.count += 1
      totalKm += km
      seconds += dur
    }

    return {
      days: buckets,
      totalDistanceMi: kmToMi(totalKm),
      totalSeconds: seconds,
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

  // One dot per day across the last 4 weeks; filled when a ride was completed.
  const { recentDays, recentRideCount } = useMemo(() => {
    const activeDays = new Set<string>()
    let count = 0
    for (const activity of recentData?.garminActivities?.items ?? []) {
      if (!activity.start_time) continue
      activeDays.add(activity.start_time.slice(0, 10))
      count += 1
    }
    const strip = Array.from({ length: RECENT_DAYS }).map((_, i) => {
      const day = addDays(recentStart, i)
      const key = format(day, 'yyyy-MM-dd')
      return { key, active: activeDays.has(key) }
    })
    return { recentDays: strip, recentRideCount: count }
  }, [recentData, recentStart])

  return (
    <Card data-testid="cycling-in-focus-card">
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
                  className="font-normal text-muted-foreground"
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
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setWeekEnd((d) => subDays(d, 7))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next week"
                  disabled={weekOffset <= 0}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  onClick={() => setWeekEnd((d) => addDays(d, 7))}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span
                data-testid="in-focus-total-distance"
                className="text-3xl font-bold leading-none tabular-nums"
              >
                {totalDistanceMi.toFixed(2)}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  mi
                </span>
              </span>
              <span className="text-xs leading-tight text-muted-foreground">
                <span className="block font-semibold tabular-nums text-foreground">
                  {formatDuration(totalSeconds)}
                </span>
                Total Time
              </span>
            </div>

            <div data-testid="cycling-week-chart" className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={days}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                >
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickFormatter={(_, index: number) =>
                      days[index]?.label ?? ''
                    }
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={<ActivityTooltip />}
                  />
                  <Bar dataKey="distance_mi" radius={[4, 4, 0, 0]}>
                    {days.map((day) => (
                      <Cell
                        key={day.date}
                        fill={BAR_COLOR}
                        fillOpacity={day.distance_mi > 0 ? 1 : 0.2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 border-t pt-2">
              <div
                data-testid="in-focus-activity-strip"
                className="flex items-center justify-between"
                aria-label={`${recentRideCount} ride${
                  recentRideCount === 1 ? '' : 's'
                } in the last 4 weeks`}
              >
                {recentDays.map((day) => (
                  <span
                    key={day.key}
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      day.active ? 'bg-foreground' : 'bg-muted-foreground/25',
                    )}
                  />
                ))}
              </div>
              <span className="block text-xs text-muted-foreground">
                {recentLoading
                  ? 'Loading…'
                  : `Last 4w · ${recentRideCount} ${
                      recentRideCount === 1 ? 'ride' : 'rides'
                    }`}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

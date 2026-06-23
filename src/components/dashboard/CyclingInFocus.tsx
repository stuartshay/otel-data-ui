import { useMemo, useState } from 'react'
import { addDays, format, subDays } from 'date-fns'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/ErrorState'
import { formatDuration, kmToMi } from '@/lib/units'

const SPORT = 'cycling'
const BAR_COLOR = '#2563eb'
const ACTIVITY_LIMIT = 200

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
  // Anchor date for the trailing 7-day window. Defaults to today; Prev/Next
  // pages by 7 days. Mirrors the weekly navigation in GarminActivityTotals.
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

  return (
    <Card data-testid="cycling-in-focus-card">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bike className="h-4 w-4 text-green-600" />
            Cycling
            <span
              data-testid="in-focus-week-range"
              className="text-sm font-normal text-muted-foreground"
            >
              · {weekRangeLabel}
            </span>
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-4">
              <span
                data-testid="in-focus-total-distance"
                className="text-3xl font-bold tabular-nums"
              >
                {totalDistanceMi.toFixed(2)}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  mi
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">
                  {formatDuration(totalSeconds)}
                </span>
                <span className="ml-1">Total Time</span>
              </span>
            </div>

            <div className="h-28 w-full">
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
                    tick={{ fontSize: 12, fill: 'currentColor' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value) => {
                      const num = typeof value === 'number' ? value : Number(value)
                      return [`${num.toFixed(2)} mi`, 'Distance']
                    }}
                  />
                  <Bar dataKey="distance_mi" radius={[4, 4, 0, 0]}>
                    {days.map((day) => (
                      <Cell
                        key={day.key}
                        fill={BAR_COLOR}
                        fillOpacity={day.distance_mi > 0 ? 1 : 0.25}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground">
              {loading
                ? 'Loading cycling activity…'
                : `${activityCount} ${
                    activityCount === 1 ? 'ride' : 'rides'
                  } this week`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

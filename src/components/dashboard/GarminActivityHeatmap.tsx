import { useState, useMemo } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'
import { useDailySummaryQuery } from '@/__generated__/graphql'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import 'react-calendar-heatmap/dist/styles.css'

const OLDEST_YEAR = 2006
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - OLDEST_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i,
)

interface HeatmapValue {
  date: string
  count: number
}

type HeatmapCallbackValue = { date: string; [key: string]: unknown } | undefined

function getColorClass(value: HeatmapCallbackValue): string {
  if (!value || !value.count) return 'color-empty'
  const count = value.count as number
  if (count === 1) return 'color-scale-1'
  if (count === 2) return 'color-scale-2'
  if (count === 3) return 'color-scale-3'
  return 'color-scale-4'
}

function getTitleForValue(value: HeatmapCallbackValue): string {
  if (!value || !value.date) return 'No activities'
  const count = (value.count as number) ?? 0
  if (count === 0) return `No activities on ${value.date}`
  return `${count} ${count === 1 ? 'activity' : 'activities'} on ${value.date}`
}

export function GarminActivityHeatmap() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)

  const startDate = new Date(selectedYear, 0, 1)
  const endDate = new Date(selectedYear, 11, 31)
  const dateFrom = format(startDate, 'yyyy-MM-dd')
  const dateTo =
    selectedYear === CURRENT_YEAR
      ? format(new Date(), 'yyyy-MM-dd')
      : format(endDate, 'yyyy-MM-dd')

  const daySpan =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1

  const { data, loading, error } = useDailySummaryQuery({
    variables: { date_from: dateFrom, date_to: dateTo, limit: daySpan * 5 },
  })

  const heatmapValues = useMemo<HeatmapValue[]>(() => {
    const summaries = data?.dailySummary ?? []
    const dateMap = new Map<string, number>()

    for (const entry of summaries) {
      if (!entry.activity_date || !entry.garmin_activities) continue
      const date = entry.activity_date
      dateMap.set(date, (dateMap.get(date) ?? 0) + entry.garmin_activities)
    }

    return Array.from(dateMap, ([date, count]) => ({ date, count }))
  }, [data])

  const totalActivities = heatmapValues.reduce((sum, v) => sum + v.count, 0)
  const activeDays = heatmapValues.filter((v) => v.count > 0).length

  return (
    <Card data-testid="garmin-heatmap-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Garmin Activity
        </CardTitle>
        <div className="flex items-center gap-3">
          {!loading && (
            <p className="text-xs text-muted-foreground">
              {totalActivities} activities over {activeDays} days
            </p>
          )}
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="h-7 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading activity data...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-destructive">
              Failed to load activity data
            </p>
          </div>
        ) : (
          <div className="garmin-heatmap">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={heatmapValues}
              classForValue={getColorClass}
              titleForValue={getTitleForValue}
              showWeekdayLabels
              gutterSize={2}
            />
            <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <span>Less</span>
              <span className="heatmap-legend-box legend-empty" />
              <span className="heatmap-legend-box legend-1" />
              <span className="heatmap-legend-box legend-2" />
              <span className="heatmap-legend-box legend-3" />
              <span className="heatmap-legend-box legend-4" />
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

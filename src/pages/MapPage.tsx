import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import {
  useUnifiedGpsQuery,
  useLocationDateRangeQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { UnifiedGpsMap } from '@/components/shared/UnifiedGpsMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function MapPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { data: dateRangeData } = useLocationDateRangeQuery()
  const dataMinDate = useMemo(
    () =>
      dateRangeData?.locationDateRange?.min_date
        ? new Date(dateRangeData.locationDateRange.min_date)
        : undefined,
    [dateRangeData],
  )
  const dataMaxDate = useMemo(
    () =>
      dateRangeData?.locationDateRange?.max_date
        ? new Date(dateRangeData.locationDateRange.max_date)
        : new Date(),
    [dateRangeData],
  )

  // Clamp selectedDate into [dataMinDate, dataMaxDate] when date-range data loads
  const clampedDate = useMemo(() => {
    if (!dateRangeData) return selectedDate
    if (dataMaxDate && selectedDate > dataMaxDate) return dataMaxDate
    if (dataMinDate && selectedDate < dataMinDate) return dataMinDate
    return selectedDate
  }, [dateRangeData, selectedDate, dataMinDate, dataMaxDate])

  const dateFrom = format(clampedDate, 'yyyy-MM-dd')
  const dateTo = dateFrom

  const { data, loading, error, refetch } = useUnifiedGpsQuery({
    variables: {
      date_from: dateFrom,
      date_to: dateTo,
      limit: 5000,
      order: 'desc',
      exclude_stationary: true,
      deduplicate: true,
    },
  })

  if (loading && !data) return <LoadingState message="Loading map data..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const total = data?.unifiedGps?.total ?? 0
  const points = data?.unifiedGps?.items ?? []
  const displayed = points.length
  const isToday =
    format(clampedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Map</h1>
          <p className="text-muted-foreground">
            {format(clampedDate, 'MMMM d, yyyy')}
            {isToday ? ' (Today)' : ''} &middot; {displayed.toLocaleString()} of{' '}
            {total.toLocaleString()} points
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                setSelectedDate(today > dataMaxDate ? dataMaxDate : today)
              }}
            >
              Today
            </Button>
          )}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-1 h-4 w-4" />
                {format(clampedDate, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={clampedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setCalendarOpen(false)
                  }
                }}
                disabled={[
                  { after: dataMaxDate },
                  ...(dataMinDate ? [{ before: dataMinDate }] : []),
                ]}
                startMonth={dataMinDate}
                endMonth={dataMaxDate}
              />
            </PopoverContent>
          </Popover>
          <Badge className="bg-blue-500">OwnTracks</Badge>
          <Badge className="bg-red-500">Garmin</Badge>
        </div>
      </div>

      <UnifiedGpsMap points={points} />
    </div>
  )
}

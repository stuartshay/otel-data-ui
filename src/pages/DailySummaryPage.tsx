import {
  useDailySummaryDateRangeQuery,
  useDailySummaryQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { Button } from '@/components/ui/button'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseDateRangeParams, toLocalDate } from '@/lib/date-range'
import { format as formatDate } from 'date-fns'

const PAGE_SIZE = 25

export function DailySummaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '', 10)
  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage)
  const dateFromParam = searchParams.get('date_from')
  const dateToParam = searchParams.get('date_to')

  const { data: dateRangeData } = useDailySummaryDateRangeQuery()
  const DATA_MIN_DATE = dateRangeData?.dailySummaryDateRange?.min_date
    ? toLocalDate(dateRangeData.dailySummaryDateRange.min_date)
    : undefined
  const DATA_MAX_DATE = dateRangeData?.dailySummaryDateRange?.max_date
    ? toLocalDate(dateRangeData.dailySummaryDateRange.max_date)
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
  const offset = (page - 1) * PAGE_SIZE

  const { data, loading, error, refetch } = useDailySummaryQuery({
    variables: {
      date_from: dateFromStr,
      date_to: dateToStr,
      limit: PAGE_SIZE,
      offset,
    },
  })

  if (loading && !data)
    return <LoadingState message="Loading daily summaries..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const summaries = data?.dailySummary?.items ?? []
  const total = data?.dailySummary?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Summary</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} days of combined OwnTracks + Garmin activity
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
              params.delete('page')
              setSearchParams(params)
            }}
          />
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-md border">
          <EmptyState
            title="No data available"
            message={
              dateFromStr || dateToStr
                ? 'No daily summaries match the selected date range. Try a different range.'
                : 'No daily summary data has been recorded yet.'
            }
            onReset={
              dateFromStr || dateToStr
                ? () => {
                    const params = new URLSearchParams(searchParams)
                    params.delete('date_from')
                    params.delete('date_to')
                    params.delete('page')
                    setSearchParams(params)
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>HR</TableHead>
                  <TableHead>Calories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s, i) => (
                  <TableRow key={`${s.activity_date}-${i}`}>
                    <TableCell className="font-medium">
                      {s.activity_date ? (
                        <Link
                          to={`/daily-summary/${s.activity_date}`}
                          className="text-primary hover:underline"
                          aria-label={`View points for ${s.activity_date}`}
                        >
                          {s.activity_date}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {s.owntracks_device ? (
                        <Badge variant="outline">{s.owntracks_device}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {s.owntracks_points?.toLocaleString() ?? '—'}
                    </TableCell>
                    <TableCell>
                      {s.min_battery != null && s.max_battery != null
                        ? `${s.min_battery}–${s.max_battery}%`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {s.garmin_sport ? (
                        <span className="capitalize">{s.garmin_sport}</span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {s.total_distance_km != null
                        ? `${s.total_distance_km.toFixed(2)} km`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {s.avg_heart_rate != null
                        ? `${s.avg_heart_rate} bpm`
                        : '—'}
                    </TableCell>
                    <TableCell>{s.total_calories ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
              {total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  if (page - 1 <= 1) params.delete('page')
                  else params.set('page', String(page - 1))
                  setSearchParams(params)
                }}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('page', String(page + 1))
                  setSearchParams(params)
                }}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

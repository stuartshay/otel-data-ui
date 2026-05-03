import { format, isValid, parseISO } from 'date-fns'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useUnifiedGpsQuery } from '@/__generated__/graphql'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { UnifiedGpsMap } from '@/components/shared/UnifiedGpsMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 100

type SourceFilter = 'owntracks' | 'garmin'

function parseRouteDate(dateParam: string | undefined) {
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return undefined

  const parsed = parseISO(dateParam)
  return isValid(parsed) ? parsed : undefined
}

function parseSourceFilter(source: string | null): SourceFilter | undefined {
  if (source === 'owntracks' || source === 'garmin') return source
  return undefined
}

export function DailySummaryDetailPage() {
  const { date } = useParams<{ date: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '', 10)
  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage)
  const sourceFilter = parseSourceFilter(searchParams.get('source'))
  const offset = (page - 1) * PAGE_SIZE
  const routeDate = parseRouteDate(date)
  const queryDate = routeDate ? format(routeDate, 'yyyy-MM-dd') : ''

  const { data, loading, error, refetch } = useUnifiedGpsQuery({
    variables: {
      source: sourceFilter,
      date_from: queryDate,
      date_to: queryDate,
      limit: PAGE_SIZE,
      offset,
      order: 'desc',
    },
    skip: !routeDate,
  })

  if (!routeDate) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/daily-summary">
            <ArrowLeft className="h-4 w-4" />
            Daily Summary
          </Link>
        </Button>
        <ErrorState message="Select a valid daily summary date." />
      </div>
    )
  }

  if (loading && !data) return <LoadingState message="Loading day points..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const points = data?.unifiedGps?.items ?? []
  const total = data?.unifiedGps?.total ?? 0
  const displayed = points.length
  const hasFilter = sourceFilter != null

  const setSourceFilter = (source: SourceFilter | undefined) => {
    const params = new URLSearchParams(searchParams)
    if (source) params.set('source', source)
    else params.delete('source')
    params.delete('page')
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/daily-summary">
              <ArrowLeft className="h-4 w-4" />
              Daily Summary
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {format(routeDate, 'MMMM d, yyyy')}
            </h1>
            <p className="text-muted-foreground">
              {displayed.toLocaleString()} of {total.toLocaleString()} GPS
              points
              {sourceFilter ? ` from ${sourceFilter}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-500">OwnTracks</Badge>
          <Badge className="bg-red-500">Garmin</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={!sourceFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSourceFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={sourceFilter === 'owntracks' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSourceFilter('owntracks')}
        >
          OwnTracks
        </Button>
        <Button
          variant={sourceFilter === 'garmin' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSourceFilter('garmin')}
        >
          Garmin
        </Button>
      </div>

      <UnifiedGpsMap
        points={points}
        testId="daily-summary-map-container"
        className="h-[28rem]"
      />

      <div className="rounded-md border">
        {points.length === 0 ? (
          <EmptyState
            title="No points available"
            message={
              hasFilter
                ? 'No GPS points match the selected source filter for this day.'
                : 'No OwnTracks or Garmin GPS points were recorded for this day.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Lat / Lon</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>HR</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((point, index) => (
                <TableRow
                  key={`${point.source}-${point.identifier}-${point.timestamp}-${index}`}
                >
                  <TableCell>
                    <Badge
                      variant={
                        point.source === 'owntracks' ? 'default' : 'secondary'
                      }
                    >
                      {point.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {point.identifier}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    {point.battery != null ? `${point.battery}%` : '—'}
                  </TableCell>
                  <TableCell>
                    {point.speed_kmh != null
                      ? `${point.speed_kmh.toFixed(1)} km/h`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {point.heart_rate != null ? `${point.heart_rate} bpm` : '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(point.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 && (
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
      )}
    </div>
  )
}

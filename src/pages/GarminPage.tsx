import {
  useGarminActivitiesQuery,
  useGarminSportsQuery,
} from '@/__generated__/graphql'
import { Link, useSearchParams } from 'react-router-dom'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

export function GarminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const sportFilter = searchParams.get('sport') || undefined
  const offset = (page - 1) * PAGE_SIZE

  const { data: sportsData } = useGarminSportsQuery()
  const { data, loading, error, refetch } = useGarminActivitiesQuery({
    variables: {
      limit: PAGE_SIZE,
      offset,
      sport: sportFilter,
      order: 'desc',
      sort: 'start_time',
    },
  })

  if (loading && !data) return <LoadingState message="Loading activities..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const activities = data?.garminActivities?.items ?? []
  const total = data?.garminActivities?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Garmin Activities</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} activities
        </p>
      </div>

      {/* Sport filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!sportFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchParams({})}
        >
          All
        </Button>
        {sportsData?.garminSports?.map(
          (s: { sport: string; activity_count: number }) => (
            <Button
              key={s.sport}
              variant={sportFilter === s.sport ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ sport: s.sport })}
            >
              <span className="capitalize">{s.sport}</span>
              <Badge variant="secondary" className="ml-1">
                {s.activity_count}
              </Badge>
            </Button>
          ),
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sport</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Avg HR</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((a) => (
              <TableRow key={a.activity_id}>
                <TableCell>
                  <Link
                    to={`/garmin/${a.activity_id}`}
                    state={{ garminListSearch: searchParams.toString() }}
                    className="font-medium capitalize text-primary hover:underline"
                  >
                    {a.sport}
                  </Link>
                </TableCell>
                <TableCell>
                  {a.distance_km != null
                    ? `${a.distance_km.toFixed(2)} km`
                    : '—'}
                </TableCell>
                <TableCell>{formatDuration(a.duration_seconds)}</TableCell>
                <TableCell>
                  {a.avg_heart_rate != null ? `${a.avg_heart_rate} bpm` : '—'}
                </TableCell>
                <TableCell>{a.calories != null ? a.calories : '—'}</TableCell>
                <TableCell>
                  {a.track_point_count != null
                    ? a.track_point_count.toLocaleString()
                    : '—'}
                </TableCell>
                <TableCell className="text-xs">
                  {a.start_time ? new Date(a.start_time).toLocaleString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
    </div>
  )
}

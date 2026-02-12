import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Link } from 'react-router-dom'
import { GARMIN_ACTIVITIES_QUERY, GARMIN_SPORTS_QUERY } from '@/graphql/garmin'
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

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

export function GarminPage() {
  const [offset, setOffset] = useState(0)
  const [sportFilter, setSportFilter] = useState<string | undefined>()

  const { data: sportsData } =
    useQuery<Record<string, any>>(GARMIN_SPORTS_QUERY)
  const { data, loading, error, refetch } = useQuery<Record<string, any>>(
    GARMIN_ACTIVITIES_QUERY,
    {
      variables: {
        limit: PAGE_SIZE,
        offset,
        sport: sportFilter,
        order: 'desc' as const,
        sort: 'start_time',
      },
    },
  )

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
          onClick={() => {
            setSportFilter(undefined)
            setOffset(0)
          }}
        >
          All
        </Button>
        {sportsData?.garminSports?.map(
          (s: { sport: string; activity_count: number }) => (
            <Button
              key={s.sport}
              variant={sportFilter === s.sport ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSportFilter(s.sport)
                setOffset(0)
              }}
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
            {activities.map(
              (a: {
                activity_id: string
                sport: string
                distance_km: number | null
                duration_seconds: number | null
                avg_heart_rate: number | null
                calories: number | null
                track_point_count: number | null
                start_time: string | null
              }) => (
                <TableRow key={a.activity_id}>
                  <TableCell>
                    <Link
                      to={`/garmin/${a.activity_id}`}
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
                    {a.start_time
                      ? new Date(a.start_time).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ),
            )}
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
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

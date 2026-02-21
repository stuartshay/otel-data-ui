import { useDailySummaryQuery } from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function DailySummaryPage() {
  const { data, loading, error, refetch } = useDailySummaryQuery({
    variables: { limit: 30 },
  })

  if (loading) return <LoadingState message="Loading daily summaries..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const summaries = data?.dailySummary ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Summary</h1>
        <p className="text-muted-foreground">
          Combined OwnTracks + Garmin daily activity
        </p>
      </div>

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
                  {s.activity_date ?? '—'}
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
                  {s.avg_heart_rate != null ? `${s.avg_heart_rate} bpm` : '—'}
                </TableCell>
                <TableCell>{s.total_calories ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

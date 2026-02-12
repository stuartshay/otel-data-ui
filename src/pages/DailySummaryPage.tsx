import { useQuery } from '@apollo/client/react'
import { DAILY_SUMMARY_QUERY } from '@/graphql/unified'
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
  const { data, loading, error, refetch } = useQuery<Record<string, any>>(
    DAILY_SUMMARY_QUERY,
    {
      variables: { limit: 30 },
    },
  )

  if (loading) return <LoadingState message="Loading daily summaries..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const summaries = (data?.dailySummary ?? []) as Array<{
    activity_date: string | null
    owntracks_device: string | null
    owntracks_points: number | null
    min_battery: number | null
    max_battery: number | null
    avg_accuracy: number | null
    garmin_sport: string | null
    garmin_activities: number | null
    total_distance_km: number | null
    total_duration_seconds: number | null
    avg_heart_rate: number | null
    total_calories: number | null
  }>

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

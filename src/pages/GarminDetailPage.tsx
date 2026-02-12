import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import {
  GARMIN_ACTIVITY_QUERY,
  GARMIN_TRACK_POINTS_QUERY,
} from '@/graphql/garmin'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/shared/StatsCard'
import { ArrowLeft, Activity, Heart, Flame, Mountain } from 'lucide-react'

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

export function GarminDetailPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const { data, loading, error, refetch } = useQuery<Record<string, any>>(
    GARMIN_ACTIVITY_QUERY,
    {
      variables: { activity_id: activityId },
      skip: !activityId,
    },
  )
  const { data: trackData } = useQuery<Record<string, any>>(
    GARMIN_TRACK_POINTS_QUERY,
    {
      variables: { activity_id: activityId, limit: 5 },
      skip: !activityId,
    },
  )

  if (loading) return <LoadingState message="Loading activity..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const a = data?.garminActivity
  if (!a) return <ErrorState message="Activity not found" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/garmin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold capitalize tracking-tight">
            {a.sport}
          </h1>
          <p className="text-muted-foreground">
            {a.start_time
              ? new Date(a.start_time).toLocaleString()
              : 'Unknown date'}
          </p>
        </div>
        {a.sub_sport && <Badge variant="secondary">{a.sub_sport}</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Distance"
          value={a.distance_km != null ? `${a.distance_km.toFixed(2)} km` : '—'}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatsCard
          title="Duration"
          value={formatDuration(a.duration_seconds)}
        />
        <StatsCard
          title="Avg Heart Rate"
          value={a.avg_heart_rate != null ? `${a.avg_heart_rate} bpm` : '—'}
          icon={<Heart className="h-4 w-4" />}
          description={
            a.max_heart_rate != null
              ? `Max: ${a.max_heart_rate} bpm`
              : undefined
          }
        />
        <StatsCard
          title="Calories"
          value={a.calories != null ? a.calories : '—'}
          icon={<Flame className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-4 w-4" /> Elevation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Ascent</dt>
                <dd>
                  {a.total_ascent_m != null
                    ? `${a.total_ascent_m.toFixed(0)}m`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Descent</dt>
                <dd>
                  {a.total_descent_m != null
                    ? `${a.total_descent_m.toFixed(0)}m`
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Avg Speed</dt>
                <dd>
                  {a.avg_speed_kmh != null
                    ? `${a.avg_speed_kmh.toFixed(1)} km/h`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Max Speed</dt>
                <dd>
                  {a.max_speed_kmh != null
                    ? `${a.max_speed_kmh.toFixed(1)} km/h`
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {trackData?.garminTrackPoints?.total != null && (
        <Card>
          <CardHeader>
            <CardTitle>
              Track Points ({trackData.garminTrackPoints.total.toLocaleString()}
              )
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {trackData.garminTrackPoints.total.toLocaleString()} GPS track
              points recorded for this activity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

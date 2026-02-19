import { useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client/react'
import {
  GARMIN_ACTIVITY_QUERY,
  GARMIN_TRACK_POINTS_QUERY,
} from '@/graphql/garmin'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ActivityHeader } from '@/components/garmin/ActivityHeader'
import { ActivityStatsBar } from '@/components/garmin/ActivityStatsBar'
import { ActivityRouteMap } from '@/components/garmin/ActivityRouteMap'
import { ActivityCharts } from '@/components/garmin/ActivityCharts'
import { ActivityStatsPanel } from '@/components/garmin/ActivityStatsPanel'

/** Douglas-Peucker tolerance in degrees (~1.1 m) for PostGIS ST_Simplify */
const SIMPLIFY_TOLERANCE = 0.00001

export function GarminDetailPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const { data, loading, error, refetch } = useQuery<Record<string, any>>(
    GARMIN_ACTIVITY_QUERY,
    {
      variables: { activity_id: activityId },
      skip: !activityId,
    },
  )

  // Simplified geometry for map rendering — drops collinear points
  const { data: mapTrackData, loading: mapTrackLoading } = useQuery<
    Record<string, any>
  >(GARMIN_TRACK_POINTS_QUERY, {
    variables: {
      activity_id: activityId,
      simplify: SIMPLIFY_TOLERANCE,
      limit: 5000,
    },
    skip: !activityId,
  })

  // Full-resolution points for accurate time-series charts (speed, elevation).
  // Do NOT use simplify here — ST_Simplify strips non-spatial attributes.
  const { data: chartTrackData, loading: chartTrackLoading } = useQuery<
    Record<string, any>
  >(GARMIN_TRACK_POINTS_QUERY, {
    variables: { activity_id: activityId },
    skip: !activityId,
  })

  if (loading) return <LoadingState message="Loading activity..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const a = data?.garminActivity
  if (!a) return <ErrorState message="Activity not found" />

  const mapTrackPoints = mapTrackData?.garminTrackPoints?.items ?? []
  const chartTrackPoints = chartTrackData?.garminTrackPoints?.items ?? []
  const trackLoading = mapTrackLoading || chartTrackLoading

  return (
    <div className="space-y-6">
      <ActivityHeader
        sport={a.sport}
        subSport={a.sub_sport}
        startTime={a.start_time}
        deviceManufacturer={a.device_manufacturer}
      />

      <ActivityStatsBar
        distanceKm={a.distance_km}
        durationSeconds={a.duration_seconds}
        avgSpeedKmh={a.avg_speed_kmh}
        totalAscentM={a.total_ascent_m}
      />

      {trackLoading && <LoadingState message="Loading track data..." />}

      {mapTrackPoints.length > 0 && (
        <ActivityRouteMap trackPoints={mapTrackPoints} />
      )}

      {chartTrackPoints.length > 0 && (
        <ActivityCharts trackPoints={chartTrackPoints} />
      )}

      <ActivityStatsPanel activity={a} />
    </div>
  )
}

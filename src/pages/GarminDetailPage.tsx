import { useParams, useLocation } from 'react-router-dom'
import {
  useGarminActivityQuery,
  useGarminTrackPointsQuery,
  useGarminChartDataQuery,
} from '@/__generated__/graphql'
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
  const location = useLocation()
  const garminListSearch = (
    location.state as { garminListSearch?: string } | null
  )?.garminListSearch
  const backTo = garminListSearch ? `/garmin?${garminListSearch}` : '/garmin'
  const { data, loading, error, refetch } = useGarminActivityQuery({
    variables: { activity_id: activityId ?? '' },
    skip: !activityId,
  })

  // Simplified geometry for map rendering — drops collinear points
  const { data: mapTrackData, loading: mapTrackLoading } =
    useGarminTrackPointsQuery({
      variables: {
        activity_id: activityId ?? '',
        simplify: SIMPLIFY_TOLERANCE,
        limit: 5000,
      },
      skip: !activityId,
    })

  // Full-resolution points for accurate time-series charts (speed, elevation).
  // Dedicated chart-data endpoint returns ALL points without pagination.
  const { data: chartData, loading: chartTrackLoading } =
    useGarminChartDataQuery({
      variables: { activity_id: activityId ?? '' },
      skip: !activityId,
    })

  if (loading) return <LoadingState message="Loading activity..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const a = data?.garminActivity
  if (!a) return <ErrorState message="Activity not found" />

  const mapTrackPoints = mapTrackData?.garminTrackPoints?.items ?? []
  const chartTrackPoints = chartData?.garminChartData ?? []
  const trackLoading = mapTrackLoading || chartTrackLoading

  return (
    <div className="space-y-6">
      <ActivityHeader
        sport={a.sport}
        subSport={a.sub_sport}
        startTime={a.start_time}
        deviceManufacturer={a.device_manufacturer}
        backTo={backTo}
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

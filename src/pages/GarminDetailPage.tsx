import { useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGarminActivityQuery,
  useGarminTrackPointsQuery,
  useGarminChartDataQuery,
  useGarminExportPointsLazyQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ActivityHeader } from '@/components/garmin/ActivityHeader'
import { ActivityStatsBar } from '@/components/garmin/ActivityStatsBar'
import { ActivityRouteMap } from '@/components/garmin/ActivityRouteMap'
import {
  ActivityCharts,
  type ChartDataPoint,
} from '@/components/garmin/ActivityCharts'
import { ActivityHoverDetails } from '@/components/garmin/ActivityHoverDetails'
import { ActivityStatsPanel } from '@/components/garmin/ActivityStatsPanel'
import { Button } from '@/components/ui/button'
import { setNRCustomAttribute } from '@/lib/newrelic-browser'
import { escapeCsvValue, triggerDownload } from '@/lib/export'

/** Douglas-Peucker tolerance in degrees (~1.1 m) for PostGIS ST_Simplify */
const SIMPLIFY_TOLERANCE = 0.00001
/** Maximum track points fetched per page when exporting. */
const EXPORT_PAGE_SIZE = 10000

export function GarminDetailPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const location = useLocation()
  const [activePoint, setActivePoint] = useState<ChartDataPoint | null>(null)

  // Reset hover state when switching activities so the shared details
  // panel and map marker don't briefly show stale coordinates from the
  // previously-viewed activity. React's recommended "adjusting state on
  // prop change" pattern keeps this in render and avoids the
  // set-state-in-effect lint rule.
  const [prevActivityId, setPrevActivityId] = useState(activityId)
  if (activityId !== prevActivityId) {
    setPrevActivityId(activityId)
    setActivePoint(null)
  }

  useEffect(() => {
    setNRCustomAttribute('garmin.flow', true)
  }, [])
  const garminListSearch = (
    location.state as { garminListSearch?: string } | null
  )?.garminListSearch
  const backTo = garminListSearch ? `/garmin?${garminListSearch}` : '/garmin'

  const [fetchExportPoints] = useGarminExportPointsLazyQuery({
    fetchPolicy: 'no-cache',
  })
  // Track *which* export button is actively running so that clicking
  // "Export CSV" doesn't visually activate the "Export GeoJSON" button
  // (or vice-versa). Both buttons share a `disabled` lock while an
  // export is in flight, but only the clicked one shows the spinner.
  const [activeExport, setActiveExport] = useState<'csv' | 'geojson' | null>(
    null,
  )
  const isExporting = activeExport !== null

  async function handleExport(format: 'csv' | 'geojson') {
    if (!activityId) return
    // Prevent concurrent exports — the other button is disabled, but
    // also guard programmatic re-entry just in case.
    if (activeExport !== null) return

    setActiveExport(format)
    try {
      // Page through all track points in batches to avoid the 25 k hard limit.
      type TrackItem = NonNullable<
        Awaited<ReturnType<typeof fetchExportPoints>>['data']
      >['garminTrackPoints']['items'][number]
      const allPoints: TrackItem[] = []
      let offset = 0
      let total = Infinity

      while (offset < total) {
        const result = await fetchExportPoints({
          variables: {
            activity_id: activityId,
            limit: EXPORT_PAGE_SIZE,
            offset,
          },
        })
        const page = result.data?.garminTrackPoints
        if (!page) break
        total = page.total
        allPoints.push(...(page.items ?? []))
        offset += EXPORT_PAGE_SIZE
        if (allPoints.length >= total) break
      }

      const points = allPoints
      if (points.length === 0) {
        toast.warning('No track points found for this activity', {
          description: 'Exporting an empty file.',
        })
      }

      if (format === 'csv') {
        const headers = [
          'activity_id',
          'track_point_id',
          'timestamp',
          'latitude',
          'longitude',
          'altitude',
          'distance_from_start_km',
          'speed_kmh',
          'heart_rate',
          'cadence',
          'temperature_c',
          'geocode_status',
          'confidence',
          'waypoint_kind',
          'display_address',
          'street',
          'housenumber',
          'neighbourhood',
          'locality',
          'region',
          'country',
          'postalcode',
          'geocoded_at',
        ]
        const rows = points.map((p) =>
          [
            p.activity_id,
            p.id,
            p.timestamp,
            p.latitude,
            p.longitude,
            p.altitude,
            p.distance_from_start_km,
            p.speed_kmh,
            p.heart_rate,
            p.cadence,
            p.temperature_c,
            p.address?.status ?? '',
            p.address?.confidence,
            p.address?.waypoint_kind,
            p.address?.display_address,
            p.address?.street,
            p.address?.housenumber,
            p.address?.neighbourhood,
            p.address?.locality,
            p.address?.region,
            p.address?.country,
            p.address?.postalcode,
            p.address?.geocoded_at,
          ]
            .map(escapeCsvValue)
            .join(','),
        )
        const csv = [headers.join(','), ...rows].join('\n')
        triggerDownload(
          csv,
          'text/csv',
          `garmin_activity_${activityId}_points.csv`,
        )
      } else {
        const geojson = {
          type: 'FeatureCollection' as const,
          features: points.map((p) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [p.longitude, p.latitude],
            },
            properties: {
              activity_id: p.activity_id,
              track_point_id: p.id,
              timestamp: p.timestamp,
              altitude: p.altitude,
              distance_from_start_km: p.distance_from_start_km,
              speed_kmh: p.speed_kmh,
              heart_rate: p.heart_rate,
              cadence: p.cadence,
              temperature_c: p.temperature_c,
              geocode_status: p.address?.status ?? null,
              confidence: p.address?.confidence ?? null,
              waypoint_kind: p.address?.waypoint_kind ?? null,
              display_address: p.address?.display_address ?? null,
              street: p.address?.street ?? null,
              housenumber: p.address?.housenumber ?? null,
              neighbourhood: p.address?.neighbourhood ?? null,
              locality: p.address?.locality ?? null,
              region: p.address?.region ?? null,
              country: p.address?.country ?? null,
              postalcode: p.address?.postalcode ?? null,
              geocoded_at: p.address?.geocoded_at ?? null,
            },
          })),
        }
        triggerDownload(
          JSON.stringify(geojson, null, 2),
          'application/geo+json',
          `garmin_activity_${activityId}_points.geojson`,
        )
      }
    } catch (error) {
      toast.error(`Export ${format.toUpperCase()} failed`, {
        description:
          error instanceof Error ? error.message : 'Unknown export error',
      })
    } finally {
      setActiveExport(null)
    }
  }
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
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
  } = useGarminChartDataQuery({
    variables: { activity_id: activityId ?? '' },
    skip: !activityId,
    fetchPolicy: 'no-cache',
  })

  if (loading) return <LoadingState message="Loading activity..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const a = data?.garminActivity
  if (!a) return <ErrorState message="Activity not found" />

  const mapTrackPoints = mapTrackData?.garminTrackPoints?.items ?? []
  const chartPoints = chartData?.garminChartData ?? []
  const trackLoading = mapTrackLoading || chartLoading

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

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="export-csv-button"
          disabled={isExporting}
          onClick={() => handleExport('csv')}
        >
          {activeExport === 'csv' ? (
            <Loader2
              data-testid="export-csv-spinner"
              className="mr-2 h-4 w-4 animate-spin"
            />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid="export-geojson-button"
          disabled={isExporting}
          onClick={() => handleExport('geojson')}
        >
          {activeExport === 'geojson' ? (
            <Loader2
              data-testid="export-geojson-spinner"
              className="mr-2 h-4 w-4 animate-spin"
            />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export GeoJSON
        </Button>
      </div>

      {trackLoading && <LoadingState message="Loading track data..." />}

      {mapTrackPoints.length > 0 && (
        <ActivityRouteMap
          trackPoints={mapTrackPoints}
          activeLatLng={
            activePoint?.latitude != null && activePoint?.longitude != null
              ? { lat: activePoint.latitude, lng: activePoint.longitude }
              : null
          }
        />
      )}

      {chartError && (
        <ErrorState message={`Chart data failed: ${chartError.message}`} />
      )}

      {chartPoints.length > 0 && (
        <>
          <ActivityHoverDetails point={activePoint} />
          <ActivityCharts
            trackPoints={chartPoints}
            onActivePointChange={setActivePoint}
          />
        </>
      )}

      <ActivityStatsPanel activity={a} />
    </div>
  )
}

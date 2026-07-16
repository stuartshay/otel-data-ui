import { useParams, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGarminActivityQuery,
  useGarminTrackPointsQuery,
  useGarminChartDataQuery,
  useGarminActivityClimbsQuery,
  useGarminActivityLapsQuery,
  useGarminActivityWeatherQuery,
  useGarminExportPointsLazyQuery,
  type GarminActivityClimbsQuery,
  type GarminExportPointsQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ActivityHeader } from '@/components/garmin/ActivityHeader'
import { ActivityStatsBar } from '@/components/garmin/ActivityStatsBar'
import { ActivityRouteMap } from '@/components/garmin/ActivityRouteMap'
import {
  getActivityChartContext,
  toChartDataPoint,
  type ActivityChartTrackPoint,
  type ChartDataPoint,
  type SavedPoint,
} from '@/components/garmin/ActivityChartData'
import { nextSavedPointColor } from '@/components/garmin/savedPointColors'
import { ActivityCharts } from '@/components/garmin/ActivityCharts'
import { ActivityHoverDetails } from '@/components/garmin/ActivityHoverDetails'
import { ClimbDetailsPanel } from '@/components/garmin/ClimbDetailsPanel'
import { SavedPointsList } from '@/components/garmin/SavedPointsList'
import { SegmentAnalysis } from '@/components/garmin/SegmentAnalysis'
import { ActivityStatsPanel } from '@/components/garmin/ActivityStatsPanel'
import { WeatherPanel } from '@/components/garmin/WeatherPanel'
import { ActivityLapsTable } from '@/components/garmin/ActivityLapsTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { setNRCustomAttribute } from '@/lib/newrelic-browser'
import { escapeCsvValue, triggerDownload } from '@/lib/export'
import { formatDurationShort, metersToFeet } from '@/lib/units'
import { cn } from '@/lib/utils'

/** Douglas-Peucker tolerance in degrees (~1.1 m) for PostGIS ST_Simplify */
const SIMPLIFY_TOLERANCE = 0.00001
/** Maximum track points fetched per page when exporting. */
const EXPORT_PAGE_SIZE = 10000
const EARTH_RADIUS_M = 6_371_000
const METERS_PER_MILE = 1609.344
const MAIN_CLIMB_TYPE = 'CLIMB_PRO_CYCLING_CLIMB'

type ActivityClimb = GarminActivityClimbsQuery['garminActivityClimbs'][number]

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function isFiniteCoordinate<
  T extends { latitude?: number | null; longitude?: number | null },
>(point: T): point is T & { latitude: number; longitude: number } {
  return (
    point.latitude != null &&
    point.longitude != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
  )
}

function distanceMeters(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const dLat = toRadians(latB - latA)
  const dLon = toRadians(lonB - lonA)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) *
      Math.cos(toRadians(latB)) *
      Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestTrackPoint(
  points: ActivityChartTrackPoint[],
  lat: number,
  lng: number,
): ActivityChartTrackPoint | null {
  let nearest: ActivityChartTrackPoint | null = null
  let nearestDistance = Infinity

  for (const point of points) {
    if (!isFiniteCoordinate(point)) continue

    const distance = distanceMeters(lat, lng, point.latitude, point.longitude)
    if (distance < nearestDistance) {
      nearest = point
      nearestDistance = distance
    }
  }

  return nearest
}

function formatDistanceMiles(meters: number | null | undefined): string {
  return meters != null ? `${(meters / METERS_PER_MILE).toFixed(2)} mi` : '—'
}

function formatFeet(meters: number | null | undefined): string {
  return meters != null ? `${metersToFeet(meters).toFixed(0)} ft` : '—'
}

function formatPercent(value: number | null | undefined): string {
  return value != null ? `${value.toFixed(2)} %` : '—'
}

interface ClimbExportMarker {
  isClimbPoint: boolean
  climbId: number | null
  climbIndex: number | null
  climbLabel: string | null
  climbType: string | null
  climbDifficulty: string | null
}

interface ClimbExportWindow extends ClimbExportMarker {
  startTime: number
  endTime: number
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const EMPTY_CLIMB_EXPORT_MARKER: ClimbExportMarker = {
  isClimbPoint: false,
  climbId: null,
  climbIndex: null,
  climbLabel: null,
  climbType: null,
  climbDifficulty: null,
}

function buildClimbExportWindows(climbs: ActivityClimb[]): ClimbExportWindow[] {
  return climbs.flatMap((climb, index) => {
    const startTime = parseTimestamp(climb.start_time)
    const endTime = parseTimestamp(climb.end_time)
    if (startTime == null || endTime == null) return []

    return [
      {
        startTime,
        endTime,
        isClimbPoint: true,
        climbId: climb.id,
        climbIndex: index + 1,
        climbLabel: `Climb ${index + 1}`,
        climbType: climb.climb_type ?? null,
        climbDifficulty: climb.climb_pro_difficulty ?? null,
      },
    ]
  })
}

function getClimbExportMarker(
  timestamp: string,
  climbWindows: ClimbExportWindow[],
): ClimbExportMarker {
  const pointTime = parseTimestamp(timestamp)
  if (pointTime == null) return EMPTY_CLIMB_EXPORT_MARKER

  return (
    climbWindows.find(
      (climb) => pointTime >= climb.startTime && pointTime <= climb.endTime,
    ) ?? EMPTY_CLIMB_EXPORT_MARKER
  )
}

function ActivityClimbsTable({
  climbs,
  selectedClimbId,
  onSelectClimb,
}: Readonly<{
  climbs: ActivityClimb[]
  selectedClimbId: number | null
  onSelectClimb: (climbId: number) => void
}>) {
  if (climbs.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No Garmin ClimbPro climbs found for this activity.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Climb</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead>Ascent</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Max Grade</TableHead>
            <TableHead>Difficulty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {climbs.map((climb, index) => (
            <TableRow
              key={climb.id}
              role="button"
              tabIndex={0}
              aria-pressed={selectedClimbId === climb.id}
              data-testid={`climb-row-${index + 1}`}
              className={cn(
                'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selectedClimbId === climb.id
                  ? 'bg-muted hover:bg-muted'
                  : 'hover:bg-muted/50',
              )}
              onClick={() => onSelectClimb(climb.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectClimb(climb.id)
                }
              }}
            >
              <TableCell className="font-medium">Climb {index + 1}</TableCell>
              <TableCell>
                {formatDurationShort(climb.duration_seconds ?? null)}
              </TableCell>
              <TableCell>
                {formatDistanceMiles(climb.distance_meters)}
              </TableCell>
              <TableCell>{formatFeet(climb.elevation_gain_meters)}</TableCell>
              <TableCell>
                {formatPercent(climb.average_grade_percent)}
              </TableCell>
              <TableCell>{formatPercent(climb.max_grade_percent)}</TableCell>
              <TableCell>{climb.climb_pro_difficulty ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

type GarminExportPoint =
  GarminExportPointsQuery['garminTrackPoints']['items'][number]

const EXPORT_CSV_HEADERS = [
  'activity_id',
  'track_point_id',
  'timestamp',
  'latitude',
  'longitude',
  'altitude',
  'distance_from_start_km',
  'speed_kmh',
  'heart_rate',
  'hr_zone',
  'respiration_rate',
  'cadence',
  'temperature_c',
  'is_climb_point',
  'climb_id',
  'climb_index',
  'climb_label',
  'climb_type',
  'climb_difficulty',
  'surface_type',
  'effort_level',
  'created_at',
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

// Page through all track points in batches to avoid the 25 k hard limit.
// Returns every point across all pages.
async function fetchAllExportPoints(
  fetchPage: (
    offset: number,
  ) => Promise<GarminExportPointsQuery['garminTrackPoints'] | null | undefined>,
): Promise<GarminExportPoint[]> {
  const allPoints: GarminExportPoint[] = []
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const page = await fetchPage(offset)
    if (!page) break
    total = page.total
    allPoints.push(...(page.items ?? []))
    offset += EXPORT_PAGE_SIZE
    if (allPoints.length >= total) break
  }

  return allPoints
}

function buildTrackPointsCsv(
  points: GarminExportPoint[],
  climbMarkers: Map<number, ClimbExportMarker>,
): string {
  const rows = points.map((p) => {
    const marker = climbMarkers.get(p.id)
    return [
      p.activity_id,
      p.id,
      p.timestamp,
      p.latitude,
      p.longitude,
      p.altitude,
      p.distance_from_start_km,
      p.speed_kmh,
      p.heart_rate,
      p.hr_zone,
      p.respiration_rate,
      p.cadence,
      p.temperature_c,
      marker?.isClimbPoint ?? false,
      marker?.climbId,
      marker?.climbIndex,
      marker?.climbLabel,
      marker?.climbType,
      marker?.climbDifficulty,
      p.surface_type,
      p.effort_level,
      p.created_at,
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
      .join(',')
  })
  return [EXPORT_CSV_HEADERS.join(','), ...rows].join('\n')
}

// Climb-related GeoJSON properties for a track point, defaulting to
// null/false when the point falls outside any climb window.
function buildClimbGeoJsonProperties(marker: ClimbExportMarker | undefined) {
  return {
    is_climb_point: marker?.isClimbPoint ?? false,
    climb_id: marker?.climbId ?? null,
    climb_index: marker?.climbIndex ?? null,
    climb_label: marker?.climbLabel ?? null,
    climb_type: marker?.climbType ?? null,
    climb_difficulty: marker?.climbDifficulty ?? null,
  }
}

// Geocode/address GeoJSON properties for a track point, defaulting missing
// fields to null.
function buildAddressGeoJsonProperties(address: GarminExportPoint['address']) {
  return {
    geocode_status: address?.status ?? null,
    confidence: address?.confidence ?? null,
    waypoint_kind: address?.waypoint_kind ?? null,
    display_address: address?.display_address ?? null,
    street: address?.street ?? null,
    housenumber: address?.housenumber ?? null,
    neighbourhood: address?.neighbourhood ?? null,
    locality: address?.locality ?? null,
    region: address?.region ?? null,
    country: address?.country ?? null,
    postalcode: address?.postalcode ?? null,
    geocoded_at: address?.geocoded_at ?? null,
  }
}

function buildTrackPointsGeoJson(
  points: GarminExportPoint[],
  climbMarkers: Map<number, ClimbExportMarker>,
): string {
  const geojson = {
    type: 'FeatureCollection' as const,
    features: points.map((p) => {
      const marker = climbMarkers.get(p.id)
      return {
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
          hr_zone: p.hr_zone,
          respiration_rate: p.respiration_rate,
          cadence: p.cadence,
          temperature_c: p.temperature_c,
          ...buildClimbGeoJsonProperties(marker),
          surface_type: p.surface_type,
          effort_level: p.effort_level,
          created_at: p.created_at,
          ...buildAddressGeoJsonProperties(p.address),
        },
      }
    }),
  }
  return JSON.stringify(geojson, null, 2)
}

function exportGarminTrackPoints(
  format: 'csv' | 'geojson',
  points: GarminExportPoint[],
  climbMarkers: Map<number, ClimbExportMarker>,
  activityId: string,
): void {
  if (format === 'csv') {
    triggerDownload(
      buildTrackPointsCsv(points, climbMarkers),
      'text/csv',
      `garmin_activity_${activityId}_points.csv`,
    )
    return
  }
  triggerDownload(
    buildTrackPointsGeoJson(points, climbMarkers),
    'application/geo+json',
    `garmin_activity_${activityId}_points.geojson`,
  )
}

// Resolve which climb is selected: none when there are no climbs, the current
// selection when it still exists, otherwise the first climb.
function resolveSelectedClimbId(
  mainClimbs: ActivityClimb[],
  selectedClimbId: number | null,
): number | null {
  if (mainClimbs.length === 0) return null
  if (
    selectedClimbId != null &&
    mainClimbs.some((climb) => climb.id === selectedClimbId)
  ) {
    return selectedClimbId
  }
  return mainClimbs[0].id
}

// Whether the activity has any usable heart-rate data (summary or samples).
function computeHasHrData(
  avgHeartRate: number | null | undefined,
  maxHeartRate: number | null | undefined,
  chartPoints: ActivityChartTrackPoint[],
): boolean {
  return (
    avgHeartRate != null ||
    maxHeartRate != null ||
    chartPoints.some((point) => point.heart_rate != null)
  )
}

// Whether the currently displayed point is in the saved set (by timestamp).
function isSavedPoint(
  point: ChartDataPoint | null,
  savedPoints: SavedPoint[],
): boolean {
  return point != null && savedPoints.some((p) => p.id === point.timestamp)
}

interface SavedMapPoint {
  id: string
  lat: number
  lng: number
  color: string
}

// Saved points that have finite coordinates, shaped for the map layer.
function toSavedMapPoints(savedPoints: SavedPoint[]): SavedMapPoint[] {
  return savedPoints.filter(isFiniteCoordinate).map((p) => ({
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    color: p.color,
  }))
}

export function GarminDetailPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const location = useLocation()
  const [activePoint, setActivePoint] = useState<ChartDataPoint | null>(null)
  const [savedPoints, setSavedPoints] = useState<SavedPoint[]>([])
  const [selectedClimbId, setSelectedClimbId] = useState<number | null>(null)

  // Reset hover state when switching activities so the shared details
  // panel and map marker don't briefly show stale coordinates from the
  // previously-viewed activity. React's recommended "adjusting state on
  // prop change" pattern keeps this in render and avoids the
  // set-state-in-effect lint rule.
  const [prevActivityId, setPrevActivityId] = useState(activityId)
  if (activityId !== prevActivityId) {
    setPrevActivityId(activityId)
    setActivePoint(null)
    setSavedPoints([])
  }

  // Add the given point to the saved set, or remove it if already saved
  // (toggle by timestamp). New points get the next palette color.
  const addOrTogglePoint = useCallback((point: ChartDataPoint) => {
    setSavedPoints((prev) => {
      const id = point.timestamp
      if (prev.some((p) => p.id === id)) {
        return prev.filter((p) => p.id !== id)
      }
      return [...prev, { ...point, id, color: nextSavedPointColor(prev) }]
    })
  }, [])

  const removeSavedPoint = useCallback((id: string) => {
    setSavedPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearSavedPoints = useCallback(() => setSavedPoints([]), [])

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
  const exportInFlightRef = useRef(false)
  const mainClimbsRef = useRef<ActivityClimb[]>([])
  const isExporting = activeExport !== null

  async function handleExport(format: 'csv' | 'geojson') {
    if (!activityId) return
    // Prevent concurrent exports — the other button is disabled, but
    // also guard programmatic re-entry just in case.
    if (exportInFlightRef.current) return

    exportInFlightRef.current = true
    setActiveExport(format)
    try {
      const points = await fetchAllExportPoints(async (offset) => {
        const result = await fetchExportPoints({
          variables: {
            activity_id: activityId,
            limit: EXPORT_PAGE_SIZE,
            offset,
          },
        })
        return result.data?.garminTrackPoints
      })

      const climbWindows = buildClimbExportWindows(mainClimbsRef.current)
      const climbMarkers = new Map(
        points.map((point) => [
          point.id,
          getClimbExportMarker(point.timestamp, climbWindows),
        ]),
      )
      if (points.length === 0) {
        toast.warning('No track points found for this activity', {
          description: 'Exporting an empty file.',
        })
      }

      exportGarminTrackPoints(format, points, climbMarkers, activityId)
    } catch (error) {
      toast.error(`Export ${format.toUpperCase()} failed`, {
        description:
          error instanceof Error ? error.message : 'Unknown export error',
      })
    } finally {
      exportInFlightRef.current = false
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
  const {
    data: climbsData,
    loading: climbsLoading,
    error: climbsError,
  } = useGarminActivityClimbsQuery({
    variables: { activity_id: activityId ?? '' },
    skip: !activityId,
  })
  const {
    data: lapsData,
    loading: lapsLoading,
    error: lapsError,
  } = useGarminActivityLapsQuery({
    variables: { activity_id: activityId ?? '' },
    skip: !activityId,
  })
  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
  } = useGarminActivityWeatherQuery({
    variables: { activity_id: activityId ?? '' },
    skip: !activityId,
  })
  // Resolve map clicks against the *full-resolution* track series (not the
  // downsampled chart series) so the selected point is the true nearest
  // location, then convert it into the chart/display shape using the same
  // context the charts use. This keeps map clicks accurate for activities with
  // more than 800 points while charts still render a downsampled series.
  const rawChartPoints = useMemo(
    () => chartData?.garminChartData ?? [],
    [chartData?.garminChartData],
  )
  const chartContext = useMemo(
    () => getActivityChartContext(rawChartPoints),
    [rawChartPoints],
  )
  const handleMapPointSelect = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (!chartContext) {
        setActivePoint(null)
        return
      }
      const nearest = findNearestTrackPoint(rawChartPoints, lat, lng)
      if (!nearest) {
        setActivePoint(null)
        return
      }
      const point = toChartDataPoint(
        nearest,
        chartContext.startTime,
        chartContext.hasReliableDistance,
      )
      // Show the clicked point in the details panel and toggle it in the
      // saved set so it gets a persistent color-coded marker.
      setActivePoint(point)
      addOrTogglePoint(point)
    },
    [rawChartPoints, chartContext, addOrTogglePoint],
  )
  const mapTrackPoints = mapTrackData?.garminTrackPoints?.items ?? []
  const chartPoints = rawChartPoints
  const mainClimbs = useMemo(
    () =>
      (climbsData?.garminActivityClimbs ?? []).filter(
        (climb) => climb.climb_type === MAIN_CLIMB_TYPE,
      ),
    [climbsData?.garminActivityClimbs],
  )
  useEffect(() => {
    mainClimbsRef.current = mainClimbs
  }, [mainClimbs])
  const effectiveSelectedClimbId = resolveSelectedClimbId(
    mainClimbs,
    selectedClimbId,
  )
  const selectedClimbIndex = mainClimbs.findIndex(
    (climb) => climb.id === effectiveSelectedClimbId,
  )
  const selectedClimb =
    selectedClimbIndex >= 0 ? mainClimbs[selectedClimbIndex] : null
  const selectPreviousClimb = useCallback(() => {
    if (selectedClimbIndex <= 0) return
    setSelectedClimbId(mainClimbs[selectedClimbIndex - 1].id)
  }, [mainClimbs, selectedClimbIndex])
  const selectNextClimb = useCallback(() => {
    if (selectedClimbIndex < 0 || selectedClimbIndex >= mainClimbs.length - 1) {
      return
    }
    setSelectedClimbId(mainClimbs[selectedClimbIndex + 1].id)
  }, [mainClimbs, selectedClimbIndex])

  if (loading) return <LoadingState message="Loading activity..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const a = data?.garminActivity
  if (!a) return <ErrorState message="Activity not found" />

  const hasHrData = computeHasHrData(
    a.avg_heart_rate,
    a.max_heart_rate,
    chartPoints,
  )
  const trackLoading = mapTrackLoading || chartLoading
  const displayPoint = activePoint
  const displayPointSaved = isSavedPoint(displayPoint, savedPoints)
  const savedMapPoints = toSavedMapPoints(savedPoints)

  return (
    <div className="space-y-6">
      <ActivityHeader
        sport={a.sport}
        subSport={a.sub_sport}
        startTime={a.start_time}
        deviceManufacturer={a.device_manufacturer}
        device={a.device}
        backTo={backTo}
      />

      <ActivityStatsBar
        distanceKm={a.distance_km}
        durationSeconds={a.duration_seconds}
        avgSpeedKmh={a.avg_speed_kmh}
        totalAscentM={a.total_ascent_m}
      />

      <Tabs
        defaultValue="charts"
        className="w-full"
        data-testid="garmin-detail-tabs"
      >
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="stats" data-testid="garmin-tab-stats">
            Stats
          </TabsTrigger>
          <TabsTrigger value="laps" data-testid="garmin-tab-laps">
            Laps
          </TabsTrigger>
          <TabsTrigger value="charts" data-testid="garmin-tab-charts">
            Charts
          </TabsTrigger>
          <TabsTrigger value="climbs" data-testid="garmin-tab-climbs">
            Climbs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <ActivityStatsPanel
            activity={{ ...a, hr_available: hasHrData }}
            heartRateZonePoints={chartPoints}
          />
          <WeatherPanel
            weather={weatherData?.garminActivityWeather}
            loading={weatherLoading}
            error={weatherError?.message}
          />
        </TabsContent>

        <TabsContent value="laps" className="space-y-4">
          {lapsLoading && <LoadingState message="Loading laps..." />}
          {lapsError && (
            <ErrorState message={`Laps failed: ${lapsError.message}`} />
          )}
          {!lapsLoading && !lapsError && (
            <ActivityLapsTable
              laps={lapsData?.garminActivityLaps ?? []}
              chartPoints={chartPoints}
              sport={a.sport}
            />
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
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
              savedPoints={savedMapPoints}
              onSavedPointRemove={removeSavedPoint}
              onMapPointSelect={
                rawChartPoints.length > 0 ? handleMapPointSelect : undefined
              }
            />
          )}

          {chartError && (
            <ErrorState message={`Chart data failed: ${chartError.message}`} />
          )}

          {chartPoints.length > 0 && (
            <>
              <ActivityHoverDetails
                point={displayPoint}
                isSaved={displayPointSaved}
                onToggleSave={
                  displayPoint
                    ? () => addOrTogglePoint(displayPoint)
                    : undefined
                }
              />
              <ActivityCharts
                trackPoints={chartPoints}
                activePoint={displayPoint}
                savedPoints={savedPoints}
                onActivePointChange={setActivePoint}
                onPointToggle={addOrTogglePoint}
                cadenceAverage={a?.avg_cadence ?? null}
              />
              <SavedPointsList
                points={savedPoints}
                onRemove={removeSavedPoint}
                onClear={clearSavedPoints}
              />
              <SegmentAnalysis
                points={savedPoints}
                activityId={activityId}
                sport={a.sport}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="climbs" className="space-y-4">
          {climbsLoading && <LoadingState message="Loading climbs..." />}
          {climbsError && (
            <ErrorState message={`Climbs failed: ${climbsError.message}`} />
          )}
          {!climbsLoading && !climbsError && (
            <>
              <ActivityClimbsTable
                climbs={mainClimbs}
                selectedClimbId={effectiveSelectedClimbId}
                onSelectClimb={setSelectedClimbId}
              />
              {selectedClimb && (
                <ClimbDetailsPanel
                  climb={selectedClimb}
                  climbIndex={selectedClimbIndex}
                  totalClimbs={mainClimbs.length}
                  chartPoints={chartPoints}
                  onPrevious={selectPreviousClimb}
                  onNext={selectNextClimb}
                  canPrevious={selectedClimbIndex > 0}
                  canNext={selectedClimbIndex < mainClimbs.length - 1}
                  sport={a.sport}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

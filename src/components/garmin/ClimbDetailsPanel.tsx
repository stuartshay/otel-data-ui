import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GarminActivityClimbsQuery } from '@/__generated__/graphql'
import type { ActivityChartTrackPoint } from '@/components/garmin/ActivityChartData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDurationShort, metersToFeet } from '@/lib/units'
import {
  getClimbSegmentPoints,
  getGradeBucket,
  GRADE_BUCKETS,
} from './ClimbDetailsPanel.helpers'

const METERS_PER_MILE = 1609.344
const FEET_PER_MILE = 5280
const SVG_WIDTH = 900
const SVG_HEIGHT = 260
const CHART_PADDING = {
  top: 18,
  right: 24,
  bottom: 42,
  left: 52,
}

type ActivityClimb = GarminActivityClimbsQuery['garminActivityClimbs'][number]

interface ClimbDetailsPanelProps {
  climb: ActivityClimb
  climbIndex: number
  totalClimbs: number
  chartPoints: ActivityChartTrackPoint[]
  onPrevious: () => void
  onNext: () => void
  canPrevious: boolean
  canNext: boolean
}

interface ClimbGraphPoint {
  timestamp: string
  distanceMiles: number
  elevationFeet: number
}

interface ClimbMapPoint {
  latitude: number
  longitude: number
  altitude: number | null
  distanceFromStartKm: number | null
  speedKmh: number | null
  heartRate: number | null
  heartRateZone: number | null
  respirationRate: number | null
  temperatureC: number | null
}

type ClimbMapMetric =
  | 'grade'
  | 'heart-rate-zone'
  | 'heart-rate'
  | 'respiration'
  | 'speed'
  | 'temperature'

interface ClimbMapMetricOption {
  value: ClimbMapMetric
  label: string
  available: (points: ClimbMapPoint[]) => boolean
  color: (point: ClimbMapPoint, nextPoint: ClimbMapPoint) => string
  tooltip: (point: ClimbMapPoint, nextPoint: ClimbMapPoint) => string
  legend: Array<{ label: string; color: string }>
}

function formatDistanceMiles(meters: number | null | undefined): string {
  return meters != null ? `${(meters / METERS_PER_MILE).toFixed(2)} mi` : '-'
}

function formatFeet(meters: number | null | undefined): string {
  return meters != null ? `${metersToFeet(meters).toFixed(0)} ft` : '-'
}

function formatPercent(value: number | null | undefined): string {
  return value != null ? `${value.toFixed(2)}%` : '-'
}

function formatDifficulty(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : 'None'
}

function toGraphPoints(points: ActivityChartTrackPoint[]): ClimbGraphPoint[] {
  const usable = points.filter(
    (point) =>
      point.distance_from_start_km != null &&
      point.altitude != null &&
      Number.isFinite(point.distance_from_start_km) &&
      Number.isFinite(point.altitude),
  )
  if (usable.length === 0) return []

  const startDistanceKm = usable[0].distance_from_start_km ?? 0
  return usable.map((point) => ({
    timestamp: point.timestamp,
    distanceMiles:
      (((point.distance_from_start_km ?? startDistanceKm) - startDistanceKm) *
        1000) /
      METERS_PER_MILE,
    elevationFeet: metersToFeet(point.altitude ?? 0),
  }))
}

function toMapPoints(points: ActivityChartTrackPoint[]): ClimbMapPoint[] {
  return points
    .filter(
      (point) =>
        point.latitude != null &&
        point.longitude != null &&
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude),
    )
    .map((point) => ({
      latitude: point.latitude as number,
      longitude: point.longitude as number,
      altitude: point.altitude ?? null,
      distanceFromStartKm: point.distance_from_start_km ?? null,
      speedKmh: point.speed_kmh ?? null,
      heartRate: point.heart_rate ?? null,
      heartRateZone:
        point.hr_zone != null && point.hr_zone >= 1 && point.hr_zone <= 5
          ? point.hr_zone
          : null,
      respirationRate: point.respiration_rate ?? null,
      temperatureC: point.temperature_c ?? null,
    }))
}

function axisTicks(min: number, max: number, count: number): number[] {
  if (count <= 1 || min === max) return [min]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, index) => min + step * index)
}

function ClimbStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function hasFiniteMetric<T extends keyof ClimbMapPoint>(
  points: ClimbMapPoint[],
  key: T,
): boolean {
  return points.some((point) => {
    const value = point[key]
    return typeof value === 'number' && Number.isFinite(value)
  })
}

function valueToBucketColor(
  value: number | null,
  stops: Array<{ max: number; color: string }>,
  fallback = '#6b7280',
): string {
  if (value == null || !Number.isFinite(value)) return fallback
  return (
    stops.find((stop) => value < stop.max)?.color ??
    stops[stops.length - 1].color
  )
}

function segmentGrade(point: ClimbMapPoint, nextPoint: ClimbMapPoint): number {
  if (
    point.altitude == null ||
    nextPoint.altitude == null ||
    point.distanceFromStartKm == null ||
    nextPoint.distanceFromStartKm == null
  ) {
    return 0
  }

  const distanceMeters =
    (nextPoint.distanceFromStartKm - point.distanceFromStartKm) * 1000
  if (distanceMeters <= 0) return 0

  return ((nextPoint.altitude - point.altitude) / distanceMeters) * 100
}

function formatMetric(value: number | null, suffix: string): string {
  return value != null && Number.isFinite(value)
    ? `${value.toFixed(0)} ${suffix}`
    : '-'
}

const METRIC_OPTIONS: ClimbMapMetricOption[] = [
  {
    value: 'grade',
    label: 'Grade',
    available: (points) => points.length >= 2,
    color: (point, nextPoint) =>
      getGradeBucket(segmentGrade(point, nextPoint)).color,
    tooltip: (point, nextPoint) =>
      `Grade ${segmentGrade(point, nextPoint).toFixed(1)}%`,
    legend: GRADE_BUCKETS.map((bucket) => ({
      label: bucket.label,
      color: bucket.color,
    })),
  },
  {
    value: 'heart-rate-zone',
    label: 'HR zone',
    available: (points) => hasFiniteMetric(points, 'heartRateZone'),
    color: (point) =>
      ['#9ca3af', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#ef4444'][
        point.heartRateZone ?? 0
      ] ?? '#6b7280',
    tooltip: (point) =>
      point.heartRateZone != null
        ? `HR zone ${point.heartRateZone}`
        : 'HR zone -',
    legend: [
      { label: 'Z1', color: '#3b82f6' },
      { label: 'Z2', color: '#22c55e' },
      { label: 'Z3', color: '#facc15' },
      { label: 'Z4', color: '#f97316' },
      { label: 'Z5', color: '#ef4444' },
    ],
  },
  {
    value: 'heart-rate',
    label: 'Heart rate',
    available: (points) => hasFiniteMetric(points, 'heartRate'),
    color: (point) =>
      valueToBucketColor(point.heartRate, [
        { max: 120, color: '#3b82f6' },
        { max: 140, color: '#22c55e' },
        { max: 160, color: '#facc15' },
        { max: 175, color: '#f97316' },
        { max: Infinity, color: '#ef4444' },
      ]),
    tooltip: (point) => `Heart rate ${formatMetric(point.heartRate, 'bpm')}`,
    legend: [
      { label: '<120', color: '#3b82f6' },
      { label: '120-139', color: '#22c55e' },
      { label: '140-159', color: '#facc15' },
      { label: '160-174', color: '#f97316' },
      { label: '175+', color: '#ef4444' },
    ],
  },
  {
    value: 'respiration',
    label: 'Respiration',
    available: (points) => hasFiniteMetric(points, 'respirationRate'),
    color: (point) =>
      valueToBucketColor(point.respirationRate, [
        { max: 20, color: '#3b82f6' },
        { max: 24, color: '#22c55e' },
        { max: 28, color: '#facc15' },
        { max: 32, color: '#f97316' },
        { max: Infinity, color: '#ef4444' },
      ]),
    tooltip: (point) =>
      `Respiration ${formatMetric(point.respirationRate, 'br/min')}`,
    legend: [
      { label: '<20', color: '#3b82f6' },
      { label: '20-23', color: '#22c55e' },
      { label: '24-27', color: '#facc15' },
      { label: '28-31', color: '#f97316' },
      { label: '32+', color: '#ef4444' },
    ],
  },
  {
    value: 'speed',
    label: 'Speed',
    available: (points) => hasFiniteMetric(points, 'speedKmh'),
    color: (point) =>
      valueToBucketColor(point.speedKmh, [
        { max: 10, color: '#3b82f6' },
        { max: 18, color: '#22c55e' },
        { max: 26, color: '#facc15' },
        { max: 34, color: '#f97316' },
        { max: Infinity, color: '#ef4444' },
      ]),
    tooltip: (point) => `Speed ${formatMetric(point.speedKmh, 'km/h')}`,
    legend: [
      { label: '<10', color: '#3b82f6' },
      { label: '10-17', color: '#22c55e' },
      { label: '18-25', color: '#facc15' },
      { label: '26-33', color: '#f97316' },
      { label: '34+', color: '#ef4444' },
    ],
  },
  {
    value: 'temperature',
    label: 'Temperature',
    available: (points) => hasFiniteMetric(points, 'temperatureC'),
    color: (point) =>
      valueToBucketColor(point.temperatureC, [
        { max: 5, color: '#2563eb' },
        { max: 15, color: '#06b6d4' },
        { max: 24, color: '#22c55e' },
        { max: 30, color: '#f97316' },
        { max: Infinity, color: '#ef4444' },
      ]),
    tooltip: (point) => `Temperature ${formatMetric(point.temperatureC, 'C')}`,
    legend: [
      { label: '<5', color: '#2563eb' },
      { label: '5-14', color: '#06b6d4' },
      { label: '15-23', color: '#22c55e' },
      { label: '24-29', color: '#f97316' },
      { label: '30+', color: '#ef4444' },
    ],
  },
]

function ClimbElevationGradeChart({ points }: { points: ClimbGraphPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No elevation and distance chart data available for this climb.
      </div>
    )
  }

  const minX = Math.min(...points.map((point) => point.distanceMiles))
  const maxX = Math.max(...points.map((point) => point.distanceMiles))
  const minElevation = Math.min(...points.map((point) => point.elevationFeet))
  const maxElevation = Math.max(...points.map((point) => point.elevationFeet))
  const elevationPadding = Math.max(10, (maxElevation - minElevation) * 0.15)
  const minY = Math.max(0, minElevation - elevationPadding)
  const maxY = maxElevation + elevationPadding
  const chartWidth = SVG_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const chartHeight = SVG_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  const scaleX = (value: number) => {
    if (maxX === minX) return CHART_PADDING.left
    return CHART_PADDING.left + ((value - minX) / (maxX - minX)) * chartWidth
  }
  const scaleY = (value: number) => {
    if (maxY === minY) return CHART_PADDING.top + chartHeight
    return (
      CHART_PADDING.top +
      chartHeight -
      ((value - minY) / (maxY - minY)) * chartHeight
    )
  }
  const baselineY = CHART_PADDING.top + chartHeight
  const xTicks = axisTicks(minX, maxX, 5)
  const yTicks = axisTicks(minY, maxY, 4)
  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${scaleX(point.distanceMiles).toFixed(2)} ${scaleY(
        point.elevationFeet,
      ).toFixed(2)}`
    })
    .join(' ')

  return (
    <div data-testid="climb-elevation-grade-chart">
      <div className="h-72 w-full">
        <svg
          role="img"
          aria-label="Elevation and grade over climb distance"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          {yTicks.map((tick) => {
            const y = scaleY(tick)
            return (
              <g key={tick}>
                <line
                  x1={CHART_PADDING.left}
                  x2={SVG_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <text
                  x={CHART_PADDING.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-xs"
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            )
          })}

          {points.slice(0, -1).map((point, index) => {
            const next = points[index + 1]
            const deltaDistanceFeet =
              (next.distanceMiles - point.distanceMiles) * FEET_PER_MILE
            const deltaElevationFeet = next.elevationFeet - point.elevationFeet
            const grade =
              deltaDistanceFeet > 0
                ? (deltaElevationFeet / deltaDistanceFeet) * 100
                : 0
            const bucket = getGradeBucket(grade)
            const x1 = scaleX(point.distanceMiles)
            const x2 = scaleX(next.distanceMiles)
            const y1 = scaleY(point.elevationFeet)
            const y2 = scaleY(next.elevationFeet)
            return (
              <polygon
                key={`${point.timestamp}-${next.timestamp}`}
                points={`${x1},${baselineY} ${x1},${y1} ${x2},${y2} ${x2},${baselineY}`}
                fill={bucket.color}
                opacity="0.85"
              />
            )
          })}

          <path d={linePath} fill="none" stroke="#111827" strokeWidth="2" />
          <line
            x1={CHART_PADDING.left}
            x2={SVG_WIDTH - CHART_PADDING.right}
            y1={baselineY}
            y2={baselineY}
            stroke="#111827"
            strokeWidth="1"
          />
          {xTicks.map((tick) => {
            const x = scaleX(tick)
            return (
              <g key={tick}>
                <line
                  x1={x}
                  x2={x}
                  y1={baselineY}
                  y2={baselineY + 6}
                  stroke="#111827"
                />
                <text
                  x={x}
                  y={baselineY + 22}
                  textAnchor="middle"
                  className="fill-foreground text-xs"
                >
                  {tick.toFixed(2)}
                </text>
              </g>
            )
          })}
          <text
            x={CHART_PADDING.left + chartWidth / 2}
            y={SVG_HEIGHT - 6}
            textAnchor="middle"
            className="fill-foreground text-xs"
          >
            Distance (mi)
          </text>
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-semibold">
        {GRADE_BUCKETS.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-2">
            <span
              className={`inline-block h-4 w-4 rounded-full ${bucket.className}`}
            />
            {bucket.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function ClimbSegmentMap({ points }: { points: ClimbMapPoint[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<ClimbMapMetric>('grade')
  const availableMetrics = useMemo(
    () => METRIC_OPTIONS.filter((option) => option.available(points)),
    [points],
  )
  const activeMetric =
    availableMetrics.find((option) => option.value === selectedMetric) ??
    availableMetrics[0] ??
    METRIC_OPTIONS[0]

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    if (!mapRef.current || points.length < 2) return

    const first = points[0]
    const last = points[points.length - 1]
    const map = L.map(mapRef.current).setView(
      [first.latitude, first.longitude],
      15,
    )
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const bounds = L.latLngBounds([])
    for (const point of points) {
      bounds.extend([point.latitude, point.longitude])
    }

    for (let index = 0; index < points.length - 1; index += 1) {
      const point = points[index]
      const nextPoint = points[index + 1]
      L.polyline(
        [
          [point.latitude, point.longitude],
          [nextPoint.latitude, nextPoint.longitude],
        ],
        {
          color: activeMetric.color(point, nextPoint),
          weight: 5,
          opacity: 0.9,
        },
      )
        .bindTooltip(activeMetric.tooltip(point, nextPoint))
        .addTo(map)
    }

    L.circleMarker([first.latitude, first.longitude], {
      radius: 7,
      fillColor: '#22c55e',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .bindPopup('Climb start')
      .addTo(map)

    L.circleMarker([last.latitude, last.longitude], {
      radius: 7,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .bindPopup('Climb finish')
      .addTo(map)

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [points, activeMetric])

  if (points.length < 2) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No map points available for this climb.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          Color route by
        </div>
        <Select
          value={activeMetric.value}
          onValueChange={(value) => setSelectedMetric(value as ClimbMapMetric)}
        >
          <SelectTrigger
            size="sm"
            className="w-44"
            aria-label="Color climb map route by metric"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMetrics.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        ref={mapRef}
        data-testid="climb-segment-map"
        className="h-[320px] w-full overflow-hidden rounded-md"
      />
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
        {activeMetric.legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClimbDetailsPanel({
  climb,
  climbIndex,
  totalClimbs,
  chartPoints,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: ClimbDetailsPanelProps) {
  const segmentPoints = useMemo(
    () => getClimbSegmentPoints(climb, chartPoints),
    [climb, chartPoints],
  )
  const graphPoints = useMemo(
    () => toGraphPoints(segmentPoints),
    [segmentPoints],
  )
  const mapPoints = useMemo(() => toMapPoints(segmentPoints), [segmentPoints])

  return (
    <Card data-testid="climb-details-panel">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Climb Details</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous climb"
              disabled={!canPrevious}
              onClick={onPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="rounded-md bg-muted px-4 py-2 text-sm font-semibold">
              Climb {climbIndex + 1} of {totalClimbs}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next climb"
              disabled={!canNext}
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <ClimbStat
            label="Avg Grade"
            value={formatPercent(climb.average_grade_percent)}
          />
          <ClimbStat
            label="Max Grade"
            value={formatPercent(climb.max_grade_percent)}
          />
          <ClimbStat
            label="Ascent"
            value={formatFeet(climb.elevation_gain_meters)}
          />
          <ClimbStat
            label="Distance"
            value={formatDistanceMiles(climb.distance_meters)}
          />
          <ClimbStat
            label="Time"
            value={formatDurationShort(climb.duration_seconds ?? null)}
          />
          <ClimbStat
            label="Difficulty"
            value={formatDifficulty(climb.climb_pro_difficulty)}
          />
        </div>

        {segmentPoints.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No chart points available for this climb.
          </div>
        ) : (
          <>
            <section className="space-y-3" aria-labelledby="climb-chart-title">
              <h3 id="climb-chart-title" className="text-xl font-semibold">
                Elevation & Grade
              </h3>
              <ClimbElevationGradeChart points={graphPoints} />
            </section>

            <section className="space-y-3" aria-labelledby="climb-map-title">
              <h3 id="climb-map-title" className="text-xl font-semibold">
                Map
              </h3>
              <ClimbSegmentMap points={mapPoints} />
            </section>
          </>
        )}
      </CardContent>
    </Card>
  )
}

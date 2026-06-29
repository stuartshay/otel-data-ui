import { useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GarminActivityClimbsQuery } from '@/__generated__/graphql'
import type { ActivityChartTrackPoint } from '@/components/garmin/ActivityChartData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

    L.polyline(
      points.map(
        (point) => [point.latitude, point.longitude] as [number, number],
      ),
      { color: '#2563eb', weight: 5, opacity: 0.9 },
    ).addTo(map)

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
  }, [points])

  if (points.length < 2) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No map points available for this climb.
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      data-testid="climb-segment-map"
      className="h-[320px] w-full overflow-hidden rounded-md"
    />
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

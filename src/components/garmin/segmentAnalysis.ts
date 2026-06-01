import { kmToMi } from '@/lib/units'
import type { SavedPoint } from './ActivityChartData'

const EARTH_RADIUS_KM = 6371
const FT_PER_MI = 5280

/**
 * Performance metrics for the stretch of activity between two consecutive
 * saved points. All distances are in miles, durations in seconds, speeds in
 * mph and elevation in feet to match the saved-point display units.
 */
export interface SavedSegment {
  /** Stable id derived from the two endpoint ids. */
  id: string
  /** 1-based position in the ordered segment list. */
  index: number
  from: SavedPoint
  to: SavedPoint
  /** Color of the ending point (used for the swatch + chart shading). */
  color: string
  /**
   * Segment distance in miles. Uses the cumulative route distance delta when
   * available and falls back to the great-circle distance otherwise.
   */
  distanceMi: number | null
  /** True when {@link distanceMi} came from the straight-line fallback. */
  distanceIsStraightLine: boolean
  /** Great-circle distance between the endpoints in miles. */
  straightLineMi: number | null
  /** Elapsed time between the endpoints in seconds. */
  durationSeconds: number
  /** Average speed across the segment in mph. */
  avgSpeedMph: number | null
  /** Average pace across the segment in minutes per mile. */
  paceMinPerMi: number | null
  /** Net elevation change (to − from) in feet. */
  elevationChangeFt: number | null
  /** Average grade across the segment as a percentage. */
  gradePercent: number | null
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function haversineKm(
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
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function hasFiniteCoords(
  p: SavedPoint,
): p is SavedPoint & { latitude: number; longitude: number } {
  return (
    p.latitude != null &&
    p.longitude != null &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
  )
}

function straightLineMiles(from: SavedPoint, to: SavedPoint): number | null {
  if (!hasFiniteCoords(from) || !hasFiniteCoords(to)) return null
  return kmToMi(
    haversineKm(from.latitude, from.longitude, to.latitude, to.longitude),
  )
}

function routeMiles(from: SavedPoint, to: SavedPoint): number | null {
  if (
    from.distanceKm == null ||
    to.distanceKm == null ||
    !Number.isFinite(from.distanceKm) ||
    !Number.isFinite(to.distanceKm)
  ) {
    return null
  }
  return kmToMi(Math.abs(to.distanceKm - from.distanceKm))
}

function buildSegment(
  from: SavedPoint,
  to: SavedPoint,
  index: number,
): SavedSegment {
  const route = routeMiles(from, to)
  const straightLineMi = straightLineMiles(from, to)
  const distanceIsStraightLine = route == null && straightLineMi != null
  const distanceMi = route ?? straightLineMi

  const durationSeconds = Math.abs(to.time - from.time) * 60

  const avgSpeedMph =
    distanceMi != null && durationSeconds > 0
      ? distanceMi / (durationSeconds / 3600)
      : null

  const paceMinPerMi =
    avgSpeedMph != null && avgSpeedMph > 0 ? 60 / avgSpeedMph : null

  const elevationChangeFt =
    from.elevation != null && to.elevation != null
      ? to.elevation - from.elevation
      : null

  const gradePercent =
    elevationChangeFt != null && distanceMi != null && distanceMi > 0
      ? (elevationChangeFt / (distanceMi * FT_PER_MI)) * 100
      : null

  return {
    id: `${from.id}-${to.id}`,
    index,
    from,
    to,
    color: to.color,
    distanceMi,
    distanceIsStraightLine,
    straightLineMi,
    durationSeconds,
    avgSpeedMph,
    paceMinPerMi,
    elevationChangeFt,
    gradePercent,
  }
}

/**
 * Derive the consecutive segments between saved points. Points are ordered
 * along the activity by their elapsed `time` so segments follow the route
 * regardless of the order the user saved them. Returns an empty array when
 * fewer than two points are supplied.
 */
export function buildSavedSegments(points: SavedPoint[]): SavedSegment[] {
  if (points.length < 2) return []

  const ordered = [...points].sort((a, b) => a.time - b.time)
  const segments: SavedSegment[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    segments.push(buildSegment(ordered[i], ordered[i + 1], i + 1))
  }
  return segments
}

/** Format a pace value (minutes per mile) as `M:SS /mi`. */
export function formatPaceMinPerMi(paceMinPerMi: number | null): string {
  if (paceMinPerMi == null || !Number.isFinite(paceMinPerMi)) return '—'
  const mins = Math.floor(paceMinPerMi)
  const secs = Math.round((paceMinPerMi - mins) * 60)
  // Carry rounding (e.g. 59.6s) into the minutes column.
  const carryMins = secs === 60 ? mins + 1 : mins
  const displaySecs = secs === 60 ? 0 : secs
  return `${carryMins}:${displaySecs.toString().padStart(2, '0')} /mi`
}

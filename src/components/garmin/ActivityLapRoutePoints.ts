import type { ActivityChartTrackPoint } from './ActivityChartData'

export interface LapRoutePoint {
  latitude: number
  longitude: number
  speed_kmh?: number | null
}

type TrackPointWithCoordinates = ActivityChartTrackPoint & {
  latitude: number
  longitude: number
}

function hasFiniteCoordinates(
  point: ActivityChartTrackPoint,
): point is TrackPointWithCoordinates {
  return (
    point.latitude != null &&
    point.longitude != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
  )
}

export function toRoutePoints(
  points: ActivityChartTrackPoint[],
): LapRoutePoint[] {
  return points.filter(hasFiniteCoordinates).map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
    speed_kmh: point.speed_kmh,
  }))
}

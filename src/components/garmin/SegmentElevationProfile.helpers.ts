import type { ActivityChartTrackPoint } from '@/components/garmin/ActivityChartData'
import { kmToMi, metersToFeet } from '@/lib/units'

interface SegmentElevationChartPoint {
  distanceMiles: number
  elevationFeet: number
}

export interface SegmentElevationProfileData {
  points: SegmentElevationChartPoint[]
  startElevationFeet: number
  finishElevationFeet: number
  elevationGainFeet: number
  distanceMiles: number
  yDomain: [number, number]
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function buildSegmentElevationProfile(
  routePoints: readonly ActivityChartTrackPoint[],
): SegmentElevationProfileData | null {
  const usable = routePoints.filter(
    (point) =>
      isFiniteNumber(point.distance_from_start_km) &&
      isFiniteNumber(point.altitude),
  )
  if (usable.length < 2) return null

  const startDistanceKm = usable[0].distance_from_start_km as number
  const points = usable.map((point) => ({
    distanceMiles: kmToMi(
      Math.max(0, (point.distance_from_start_km as number) - startDistanceKm),
    ),
    elevationFeet: metersToFeet(point.altitude as number),
  }))
  const lastPoint = points[points.length - 1]
  const distanceMiles = lastPoint.distanceMiles
  if (distanceMiles <= 0) return null

  let elevationGainMeters = 0
  for (let index = 1; index < usable.length; index++) {
    const previousAltitude = usable[index - 1].altitude as number
    const altitude = usable[index].altitude as number
    elevationGainMeters += Math.max(0, altitude - previousAltitude)
  }

  let minElevation = points[0].elevationFeet
  let maxElevation = minElevation
  for (let index = 1; index < points.length; index++) {
    const elevation = points[index].elevationFeet
    minElevation = Math.min(minElevation, elevation)
    maxElevation = Math.max(maxElevation, elevation)
  }
  const padding = Math.max(10, (maxElevation - minElevation) * 0.15)

  return {
    points,
    startElevationFeet: points[0].elevationFeet,
    finishElevationFeet: lastPoint.elevationFeet,
    elevationGainFeet: metersToFeet(elevationGainMeters),
    distanceMiles,
    yDomain: [
      Math.floor(minElevation - padding),
      Math.ceil(maxElevation + padding),
    ],
  }
}

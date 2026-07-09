export interface SegmentRoutePoint {
  latitude?: number | null
  longitude?: number | null
}

export interface SegmentRouteTarget {
  lat: number
  lon: number
}

function hasFiniteCoordinates(
  point: SegmentRoutePoint,
): point is SegmentRoutePoint & { latitude: number; longitude: number } {
  return (
    point.latitude != null &&
    point.longitude != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
  )
}

function squaredDistance(point: SegmentRoutePoint, target: SegmentRouteTarget) {
  if (!hasFiniteCoordinates(point)) return Number.POSITIVE_INFINITY
  return (
    (point.latitude - target.lat) ** 2 + (point.longitude - target.lon) ** 2
  )
}

function nearestPointIndex(
  points: readonly SegmentRoutePoint[],
  target: SegmentRouteTarget,
): number | null {
  let bestIndex: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  points.forEach((point, index) => {
    const distance = squaredDistance(point, target)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })

  return bestIndex
}

/**
 * Return the source-activity track slice that corresponds to a saved segment.
 * Segment records store only start/end coordinates, so the route is recovered
 * by snapping those coordinates to their nearest source track points.
 */
export function getSegmentRoutePoints<T extends SegmentRoutePoint>(
  points: readonly T[],
  start: SegmentRouteTarget,
  end: SegmentRouteTarget,
): Array<T & { latitude: number; longitude: number }> {
  const validPoints = points.filter(
    (point): point is T & { latitude: number; longitude: number } =>
      hasFiniteCoordinates(point),
  )
  if (validPoints.length === 0) return []

  const startIndex = nearestPointIndex(validPoints, start)
  const endIndex = nearestPointIndex(validPoints, end)
  if (startIndex == null || endIndex == null) return []

  const from = Math.min(startIndex, endIndex)
  const to = Math.max(startIndex, endIndex)
  return validPoints.slice(from, to + 1)
}

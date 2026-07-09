export type SegmentPreviewPathPoint = [number, number]

export function buildSegmentPreviewPath(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): SegmentPreviewPathPoint[] {
  const deltaLat = endLat - startLat
  const deltaLon = endLon - startLon
  const distance = Math.hypot(deltaLat, deltaLon)

  if (distance === 0) {
    return [[startLat, startLon]]
  }

  const offset = Math.min(Math.max(distance * 0.18, 0.0002), 0.01)
  const perpendicularLat = -deltaLon / distance
  const perpendicularLon = deltaLat / distance

  const pointAt = (
    ratio: number,
    offsetMultiplier: number,
  ): SegmentPreviewPathPoint => [
    startLat + deltaLat * ratio + perpendicularLat * offset * offsetMultiplier,
    startLon + deltaLon * ratio + perpendicularLon * offset * offsetMultiplier,
  ]

  return [
    [startLat, startLon],
    pointAt(0.35, 1),
    pointAt(0.68, -0.45),
    [endLat, endLon],
  ]
}

import type { ChartDataPoint } from './ActivityChartData'

export const ZONE_COLORS: Record<number, string> = {
  1: '#60a5fa',
  2: '#22c55e',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
}

interface ZoneSegment {
  zone: number
  startPercent: number
  widthPercent: number
}

function validZone(value: number | null | undefined): number | null {
  return value != null && Number.isInteger(value) && value >= 1 && value <= 5
    ? value
    : null
}

export function buildHeartRateZoneSegments(
  data: ChartDataPoint[],
  xKey: 'distance' | 'time',
): ZoneSegment[] {
  const points = data.filter(
    (point) => point[xKey] != null && Number.isFinite(point[xKey]),
  )
  if (
    points.length === 0 ||
    !points.some((point) => validZone(point.heartRateZone))
  ) {
    return []
  }

  const domainMax = Math.max(...points.map((point) => point[xKey] as number))
  if (domainMax <= 0) {
    const zone = validZone(points[0].heartRateZone)
    return zone == null ? [] : [{ zone, startPercent: 0, widthPercent: 100 }]
  }

  const segments: ZoneSegment[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index][xKey] as number
    const end = points[index + 1][xKey] as number
    const zone = validZone(points[index].heartRateZone)
    if (zone == null || end <= start) continue

    const startPercent = (start / domainMax) * 100
    const widthPercent = ((end - start) / domainMax) * 100
    const previous = segments.at(-1)
    if (
      previous?.zone === zone &&
      Math.abs(previous.startPercent + previous.widthPercent - startPercent) <
        0.001
    ) {
      previous.widthPercent += widthPercent
    } else {
      segments.push({ zone, startPercent, widthPercent })
    }
  }

  return segments
}

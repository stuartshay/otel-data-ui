import type { ActivityChartTrackPoint } from './ActivityChartData'

export interface HeartRateZoneSummary {
  zone: number
  seconds: number
  percent: number
  minHeartRate: number | null
  maxHeartRate: number | null
}

function validZone(value: number | null | undefined): number | null {
  return value != null && Number.isInteger(value) && value >= 1 && value <= 5
    ? value
    : null
}

export function buildHeartRateZoneSummaries(
  points: ActivityChartTrackPoint[],
): HeartRateZoneSummary[] {
  const zoneSeconds = new Map<number, number>()
  const zoneHeartRates = new Map<number, number[]>()
  let totalSeconds = 0

  for (const point of points) {
    const zone = validZone(point.hr_zone)
    if (zone == null || point.heart_rate == null) continue

    zoneHeartRates.set(zone, [
      ...(zoneHeartRates.get(zone) ?? []),
      point.heart_rate,
    ])
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const point = points[index]
    const nextPoint = points[index + 1]
    const zone = validZone(point.hr_zone)
    if (zone == null) continue

    const startMs = new Date(point.timestamp).getTime()
    const endMs = new Date(nextPoint.timestamp).getTime()
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    )
      continue

    const seconds = (endMs - startMs) / 1000
    zoneSeconds.set(zone, (zoneSeconds.get(zone) ?? 0) + seconds)
    totalSeconds += seconds
  }

  return [5, 4, 3, 2, 1].map((zone) => {
    const seconds = zoneSeconds.get(zone) ?? 0
    const heartRates = zoneHeartRates.get(zone) ?? []
    return {
      zone,
      seconds,
      percent:
        totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
      minHeartRate: heartRates.length > 0 ? Math.min(...heartRates) : null,
      maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : null,
    }
  })
}

import { kmToMi, kmhToMph, metersToFeet } from '@/lib/units'

export interface ActivityChartTrackPoint {
  distance_from_start_km?: number | null
  timestamp: string
  altitude?: number | null
  speed_kmh?: number | null
  latitude?: number | null
  longitude?: number | null
}

export interface ChartDataPoint {
  distance: number | null
  distanceKm: number | null
  time: number
  elevation: number | null
  speed: number | null
  latitude: number | null
  longitude: number | null
  timestamp: string
}

export interface ActivityChartDataResult {
  chartData: ChartDataPoint[]
  hasReliableDistance: boolean
}

function downsample<T>(data: T[], target: number): T[] {
  if (data.length <= target) return data
  const step = data.length / target
  const result: T[] = []
  for (let i = 0; i < target; i++) {
    result.push(data[Math.floor(i * step)])
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1])
  }
  return result
}

export function buildActivityChartData(
  trackPoints: ActivityChartTrackPoint[],
): ActivityChartDataResult {
  const sampled = downsample(trackPoints, 800)
  if (sampled.length === 0) {
    return { chartData: [], hasReliableDistance: false }
  }

  const startTime = new Date(sampled[0].timestamp).getTime()
  const hasReliableDistance =
    sampled.filter((pt) => pt.distance_from_start_km != null).length >=
    sampled.length * 0.5

  const chartData = sampled.map((pt) => ({
    distance: hasReliableDistance
      ? pt.distance_from_start_km != null
        ? kmToMi(pt.distance_from_start_km)
        : null
      : null,
    distanceKm: pt.distance_from_start_km ?? null,
    time: (new Date(pt.timestamp).getTime() - startTime) / 60000,
    elevation: pt.altitude != null ? metersToFeet(pt.altitude) : null,
    speed: pt.speed_kmh != null ? kmhToMph(pt.speed_kmh) : null,
    latitude: pt.latitude ?? null,
    longitude: pt.longitude ?? null,
    timestamp: pt.timestamp,
  }))

  return { chartData, hasReliableDistance }
}

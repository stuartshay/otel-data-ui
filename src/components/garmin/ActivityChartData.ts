import { kmToMi, kmhToMph, metersToFeet } from '@/lib/units'

export interface ActivityChartTrackPoint {
  distance_from_start_km?: number | null
  timestamp: string
  altitude?: number | null
  speed_kmh?: number | null
  heart_rate?: number | null
  hr_zone?: number | null
  respiration_rate?: number | null
  latitude?: number | null
  longitude?: number | null
}

export interface ChartDataPoint {
  distance: number | null
  distanceKm: number | null
  time: number
  elevation: number | null
  speed: number | null
  heartRate: number | null
  heartRateZone?: number | null
  respirationRate: number | null
  respirationRateSmoothed?: number | null
  latitude: number | null
  longitude: number | null
  timestamp: string
}

/**
 * A {@link ChartDataPoint} the user has explicitly saved. `id` is the point
 * timestamp (stable per track point, used for de-duplication/toggle) and
 * `color` is the palette color assigned when the point was saved.
 */
export interface SavedPoint extends ChartDataPoint {
  id: string
  color: string
}

export interface ActivityChartDataResult {
  chartData: ChartDataPoint[]
  hasReliableDistance: boolean
}

export interface ActivityChartDataContext {
  /** Epoch ms of the first sampled point, used to compute the time axis. */
  startTime: number
  /** Whether distance data is dense enough to drive the distance axis. */
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

/**
 * Convert a single raw track point into the chart/display shape. Kept separate
 * from {@link buildActivityChartData} so callers (e.g. map-click selection) can
 * resolve the nearest *full-resolution* point and still render it with the same
 * unit conversions the downsampled chart series uses.
 *
 * `startTime` and `hasReliableDistance` must be derived from the same source
 * series (see {@link getActivityChartContext}) so the resulting `time`/
 * `distance` values line up with the rendered charts.
 */
export function toChartDataPoint(
  pt: ActivityChartTrackPoint,
  startTime: number,
  hasReliableDistance: boolean,
): ChartDataPoint {
  return {
    distance: hasReliableDistance
      ? pt.distance_from_start_km != null
        ? kmToMi(pt.distance_from_start_km)
        : null
      : null,
    distanceKm: pt.distance_from_start_km ?? null,
    time: (new Date(pt.timestamp).getTime() - startTime) / 60000,
    elevation: pt.altitude != null ? metersToFeet(pt.altitude) : null,
    speed: pt.speed_kmh != null ? kmhToMph(pt.speed_kmh) : null,
    heartRate: pt.heart_rate ?? null,
    heartRateZone:
      pt.hr_zone != null && pt.hr_zone >= 1 && pt.hr_zone <= 5
        ? pt.hr_zone
        : null,
    respirationRate: pt.respiration_rate ?? null,
    latitude: pt.latitude ?? null,
    longitude: pt.longitude ?? null,
    timestamp: pt.timestamp,
  }
}

/**
 * Derive the shared conversion context (start time + distance reliability) from
 * the same downsampled series the charts render, so map-click selections that
 * resolve against full-resolution data stay consistent with the displayed
 * charts.
 */
export function getActivityChartContext(
  trackPoints: ActivityChartTrackPoint[],
): ActivityChartDataContext | null {
  const sampled = downsample(trackPoints, 800)
  if (sampled.length === 0) return null

  const startTime = new Date(sampled[0].timestamp).getTime()
  const hasReliableDistance =
    sampled.filter((pt) => pt.distance_from_start_km != null).length >=
    sampled.length * 0.5

  return { startTime, hasReliableDistance }
}

export function buildActivityChartData(
  trackPoints: ActivityChartTrackPoint[],
): ActivityChartDataResult {
  const context = getActivityChartContext(trackPoints)
  if (!context) {
    return { chartData: [], hasReliableDistance: false }
  }

  const sampled = downsample(trackPoints, 800)
  const chartData = addRespirationRollingAverage(
    sampled.map((pt) =>
      toChartDataPoint(pt, context.startTime, context.hasReliableDistance),
    ),
  )

  return { chartData, hasReliableDistance: context.hasReliableDistance }
}

/** Add a trailing one-minute rolling average without filling missing samples. */
export function addRespirationRollingAverage(
  data: ChartDataPoint[],
  windowMinutes = 1,
): ChartDataPoint[] {
  const window: Array<{ time: number; value: number }> = []
  let sum = 0

  return data.map((point) => {
    while (window.length > 0 && point.time - window[0].time > windowMinutes) {
      sum -= window.shift()?.value ?? 0
    }

    const value = point.respirationRate
    if (value != null && Number.isFinite(value)) {
      window.push({ time: point.time, value })
      sum += value
    }

    return {
      ...point,
      respirationRateSmoothed:
        value != null && Number.isFinite(value) && window.length > 0
          ? sum / window.length
          : null,
    }
  })
}

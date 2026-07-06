import type { ActivityChartTrackPoint } from './ActivityChartData'

export interface ActivityLap {
  id: number
  activity_id?: string
  lap_index: number
  start_time?: string | null
  end_time?: string | null
  duration_seconds?: number | null
  elapsed_duration_seconds?: number | null
  moving_duration_seconds?: number | null
  distance_meters?: number | null
  paved_distance_meters?: number | null
  unpaved_distance_meters?: number | null
  avg_speed_mps?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
  total_ascent_meters?: number | null
  total_descent_meters?: number | null
  calories?: number | null
}

export interface LapSummary {
  durationSeconds: number | null
  distanceMeters: number | null
  pavedPercent: number | null
  unpavedPercent: number | null
  avgSpeedMps: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  totalAscentMeters: number | null
}

function lapWeight(lap: ActivityLap): number {
  if (lap.duration_seconds != null && lap.duration_seconds > 0) {
    return lap.duration_seconds
  }
  if (lap.distance_meters != null && lap.distance_meters > 0) {
    return lap.distance_meters
  }
  return 1
}

export function buildLapSummary(laps: ActivityLap[]): LapSummary {
  const durationSeconds = laps.reduce(
    (sum, lap) => sum + (lap.duration_seconds ?? 0),
    0,
  )
  const distanceMeters = laps.reduce(
    (sum, lap) => sum + (lap.distance_meters ?? 0),
    0,
  )
  const pavedMeters = laps.reduce(
    (sum, lap) => sum + (lap.paved_distance_meters ?? 0),
    0,
  )
  const unpavedMeters = laps.reduce(
    (sum, lap) => sum + (lap.unpaved_distance_meters ?? 0),
    0,
  )
  const ascentMeters = laps.reduce(
    (sum, lap) => sum + (lap.total_ascent_meters ?? 0),
    0,
  )
  const heartRateWeight = laps.reduce(
    (sum, lap) =>
      lap.avg_heart_rate != null && lap.avg_heart_rate > 0
        ? sum + lapWeight(lap)
        : sum,
    0,
  )
  const avgHeartRate =
    heartRateWeight > 0
      ? laps.reduce((sum, lap) => {
          if (lap.avg_heart_rate == null || lap.avg_heart_rate <= 0) return sum
          return sum + lap.avg_heart_rate * lapWeight(lap)
        }, 0) / heartRateWeight
      : null
  const maxHeartRates = laps
    .map((lap) => lap.max_heart_rate)
    .filter((value): value is number => value != null && value > 0)

  return {
    durationSeconds: durationSeconds > 0 ? durationSeconds : null,
    distanceMeters: distanceMeters > 0 ? distanceMeters : null,
    pavedPercent:
      distanceMeters > 0 ? (pavedMeters / distanceMeters) * 100 : null,
    unpavedPercent:
      distanceMeters > 0 ? (unpavedMeters / distanceMeters) * 100 : null,
    avgSpeedMps:
      distanceMeters > 0 && durationSeconds > 0
        ? distanceMeters / durationSeconds
        : null,
    avgHeartRate,
    maxHeartRate: maxHeartRates.length > 0 ? Math.max(...maxHeartRates) : null,
    totalAscentMeters: ascentMeters > 0 ? ascentMeters : null,
  }
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function hasValidLatLng(point: ActivityChartTrackPoint): boolean {
  return (
    point.latitude != null &&
    point.longitude != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
  )
}

function getPointTime(point: ActivityChartTrackPoint): number | null {
  return parseTimestamp(point.timestamp)
}

function getPointDistanceMeters(point: ActivityChartTrackPoint): number | null {
  if (
    point.distance_from_start_km == null ||
    !Number.isFinite(point.distance_from_start_km)
  ) {
    return null
  }
  return point.distance_from_start_km * 1000
}

function getEffectiveEndTime(
  lap: ActivityLap,
  startTime: number,
): number | null {
  const endTime = parseTimestamp(lap.end_time)
  if (endTime != null && endTime > startTime) return endTime
  if (lap.duration_seconds != null && lap.duration_seconds > 0) {
    return startTime + lap.duration_seconds * 1000
  }
  return null
}

export function getLapTimeWindow(
  lap: ActivityLap,
): { startTime: number; endTime: number } | null {
  const startTime = parseTimestamp(lap.start_time)
  if (startTime == null) return null
  const endTime = getEffectiveEndTime(lap, startTime)
  if (endTime == null) return null
  return { startTime, endTime }
}

function getDistanceWindow(
  lap: ActivityLap,
  allLaps: ActivityLap[],
): { startMeters: number; endMeters: number } | null {
  if (lap.distance_meters == null || lap.distance_meters <= 0) return null

  const orderedLaps = [...allLaps].sort((a, b) => a.lap_index - b.lap_index)
  let startMeters = 0
  for (const current of orderedLaps) {
    if (current.lap_index === lap.lap_index) {
      return {
        startMeters,
        endMeters: startMeters + lap.distance_meters,
      }
    }
    if (current.distance_meters == null || current.distance_meters <= 0) {
      return null
    }
    startMeters += current.distance_meters
  }

  return null
}

export function getLapSegmentPoints(
  lap: ActivityLap,
  chartPoints: ActivityChartTrackPoint[],
  allLaps: ActivityLap[] = [lap],
): ActivityChartTrackPoint[] {
  const timeWindow = getLapTimeWindow(lap)

  if (timeWindow) {
    const timeMatches = chartPoints.filter((point) => {
      const pointTime = getPointTime(point)
      return (
        pointTime != null &&
        pointTime >= timeWindow.startTime &&
        pointTime <= timeWindow.endTime &&
        hasValidLatLng(point)
      )
    })
    if (timeMatches.length > 0) return timeMatches
  }

  const distanceWindow = getDistanceWindow(lap, allLaps)
  if (!distanceWindow) return []

  return chartPoints.filter((point) => {
    const distanceMeters = getPointDistanceMeters(point)
    return (
      distanceMeters != null &&
      distanceMeters >= distanceWindow.startMeters &&
      distanceMeters <= distanceWindow.endMeters &&
      hasValidLatLng(point)
    )
  })
}

export interface ActivityLap {
  id: number
  lap_index: number
  duration_seconds?: number | null
  distance_meters?: number | null
  paved_distance_meters?: number | null
  unpaved_distance_meters?: number | null
  avg_speed_mps?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
  total_ascent_meters?: number | null
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

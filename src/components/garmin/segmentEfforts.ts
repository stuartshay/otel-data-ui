import { formatDuration, kmhToMph, kmToMi } from '@/lib/units'

/** A single segment effort as returned by the gateway (garminSegmentEfforts.items). */
export interface SegmentEffort {
  rank: number
  activity_id: string
  sport?: string | null
  activity_start_time?: string | null
  effort_start: string
  effort_end: string
  elapsed_seconds: number
  distance_km?: number | null
  avg_speed_kmh?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
}

export type EffortSort = 'time' | 'speed' | 'date'

export const EFFORT_SORTS: { key: EffortSort; label: string }[] = [
  { key: 'time', label: 'Fastest' },
  { key: 'speed', label: 'Top speed' },
  { key: 'date', label: 'Most recent' },
]

/** Sort efforts by the selected criterion (does not mutate the input array). */
export function sortEfforts(
  efforts: readonly SegmentEffort[],
  sort: EffortSort,
): SegmentEffort[] {
  const copy = [...efforts]
  switch (sort) {
    case 'speed':
      return copy.sort(
        (a, b) =>
          (b.avg_speed_kmh ?? -Infinity) - (a.avg_speed_kmh ?? -Infinity),
      )
    case 'date':
      return copy.sort(
        (a, b) =>
          new Date(b.activity_start_time ?? b.effort_start).getTime() -
          new Date(a.activity_start_time ?? a.effort_start).getTime(),
      )
    case 'time':
    default:
      return copy.sort((a, b) => a.elapsed_seconds - b.elapsed_seconds)
  }
}

/**
 * Identifies one effort row. An activity can appear more than once (each lap
 * of a loop segment ridden in a single activity is its own effort), so
 * activity_id alone isn't a unique key.
 */
export function effortKey(
  effort: Pick<SegmentEffort, 'activity_id' | 'effort_start'>,
): string {
  return `${effort.activity_id}-${effort.effort_start}`
}

/**
 * The key of the personal-best (fastest) effort, or null when there are no
 * efforts. Ties resolve to the first-seen fastest.
 */
export function bestEffortKey(
  efforts: readonly SegmentEffort[],
): string | null {
  let best: SegmentEffort | null = null
  for (const e of efforts) {
    if (!best || e.elapsed_seconds < best.elapsed_seconds) {
      best = e
    }
  }
  return best ? effortKey(best) : null
}

export function formatElapsed(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  return formatDuration(seconds)
}

export function formatSpeedMph(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${kmhToMph(value).toFixed(1)} mph`
}

export function formatDistanceMi(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${kmToMi(value).toFixed(2)} mi`
}

export function formatHeartRate(value: number | null | undefined): string {
  return value != null && value > 0 ? String(Math.round(value)) : '—'
}

export function formatEffortDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTolerance(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value)} m`
}

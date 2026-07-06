import { formatDuration, metersToFeet } from '@/lib/units'

const MPS_TO_MPH = 2.2369362921

export interface ComparisonLap {
  lap_index: number
  duration_seconds: number | null
  distance_meters: number | null
  avg_speed_mps: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  total_ascent_meters: number | null
  total_descent_meters: number | null
  calories: number | null
}

export interface ComparisonActivity {
  activity_id: string
  sport?: string | null
  sub_sport?: string | null
  start_time: string | null
  distance_km?: number | null
  avg_speed_kmh?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
  total_ascent_m?: number | null
}

export interface ComparisonItem {
  activity: ComparisonActivity
  laps: ComparisonLap[]
}

export type LapMetric =
  'time' | 'speed' | 'avgHr' | 'maxHr' | 'ascent' | 'efficiency'

export interface MetricDef {
  key: LapMetric
  label: string
  /** Unit label shown in the legend/header. */
  unit: string
  /** When true a higher value is better (green); otherwise lower is better. */
  higherIsBetter: boolean
  extract: (lap: ComparisonLap) => number | null
  format: (value: number | null) => string
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export const LAP_METRICS: MetricDef[] = [
  {
    key: 'time',
    label: 'Lap Time',
    unit: 'mm:ss',
    higherIsBetter: false,
    extract: (l) => l.duration_seconds,
    format: (v) => formatDuration(v),
  },
  {
    key: 'speed',
    label: 'Avg Speed',
    unit: 'mph',
    higherIsBetter: true,
    extract: (l) =>
      l.avg_speed_mps == null ? null : l.avg_speed_mps * MPS_TO_MPH,
    format: (v) => (v == null ? '—' : v.toFixed(1)),
  },
  {
    key: 'avgHr',
    label: 'Avg HR',
    unit: 'bpm',
    higherIsBetter: false,
    extract: (l) =>
      l.avg_heart_rate != null && l.avg_heart_rate > 0
        ? l.avg_heart_rate
        : null,
    format: (v) => (v == null ? '—' : String(Math.round(v))),
  },
  {
    key: 'maxHr',
    label: 'Max HR',
    unit: 'bpm',
    higherIsBetter: false,
    extract: (l) =>
      l.max_heart_rate != null && l.max_heart_rate > 0
        ? l.max_heart_rate
        : null,
    format: (v) => (v == null ? '—' : String(Math.round(v))),
  },
  {
    key: 'ascent',
    label: 'Ascent',
    unit: 'ft',
    higherIsBetter: true,
    extract: (l) =>
      l.total_ascent_meters == null
        ? null
        : metersToFeet(l.total_ascent_meters),
    format: (v) => (v == null ? '—' : String(Math.round(v))),
  },
  {
    key: 'efficiency',
    label: 'Efficiency',
    unit: 'spd/HR',
    higherIsBetter: true,
    // Speed (mph) carried per heartbeat, scaled ×100 for a readable number.
    // Higher = more speed for less heart rate.
    extract: (l) => {
      if (
        l.avg_speed_mps == null ||
        l.avg_heart_rate == null ||
        l.avg_heart_rate <= 0
      )
        return null
      return round1((l.avg_speed_mps * MPS_TO_MPH * 100) / l.avg_heart_rate)
    },
    format: (v) => (v == null ? '—' : v.toFixed(1)),
  },
]

export function getMetricDef(metric: LapMetric): MetricDef {
  return LAP_METRICS.find((m) => m.key === metric) ?? LAP_METRICS[0]
}

export interface MatrixCell {
  lapIndex: number
  value: number | null
  formatted: string
  /** 0 (worst) .. 1 (best) within the lap column; null when no value or no spread. */
  score: number | null
  /** True when this cell holds the best value in a lap column that has a spread of values. */
  isPR: boolean
}

export interface MatrixRow {
  activityId: string
  startTime: string | null
  cells: MatrixCell[]
}

export interface ColumnSummary {
  lapIndex: number
  best: string
  worst: string
  avg: string
}

export interface ComparisonMatrix {
  lapCount: number
  rows: MatrixRow[]
  summary: ColumnSummary[]
}

interface ColumnStat {
  min: number
  max: number
  best: number
  worst: number
  values: number[]
}

/**
 * Build the lap-comparison matrix for a metric: rows are activities, columns are
 * lap indexes (1..N). Handles activities with differing lap counts (missing laps
 * become null cells) and computes per-column heat-map scores, PR flags, and
 * best/avg/worst summaries.
 */
export function buildComparisonMatrix(
  items: ComparisonItem[],
  metric: LapMetric,
): ComparisonMatrix {
  const def = getMetricDef(metric)

  const lapCount = items.reduce((max, item) => {
    for (const lap of item.laps) {
      if (lap.lap_index > max) max = lap.lap_index
    }
    return max
  }, 0)

  const colStats: (ColumnStat | null)[] = []
  for (let c = 1; c <= lapCount; c++) {
    const values: number[] = []
    for (const item of items) {
      const lap = item.laps.find((l) => l.lap_index === c)
      const v = lap ? def.extract(lap) : null
      if (v != null && Number.isFinite(v)) values.push(v)
    }
    if (values.length === 0) {
      colStats.push(null)
      continue
    }
    const min = Math.min(...values)
    const max = Math.max(...values)
    colStats.push({
      min,
      max,
      best: def.higherIsBetter ? max : min,
      worst: def.higherIsBetter ? min : max,
      values,
    })
  }

  const rows: MatrixRow[] = items.map((item) => {
    const cells: MatrixCell[] = []
    for (let c = 1; c <= lapCount; c++) {
      const lap = item.laps.find((l) => l.lap_index === c)
      const value = lap ? def.extract(lap) : null
      const stat = colStats[c - 1]
      let score: number | null = null
      let isPR = false
      if (value != null && stat && stat.max !== stat.min) {
        const norm = (value - stat.min) / (stat.max - stat.min)
        score = def.higherIsBetter ? norm : 1 - norm
        // Only flag a PR when the column actually has a spread of values, so a
        // column where every activity ties (no-spread) highlights nothing.
        isPR = value === stat.best
      }
      cells.push({
        lapIndex: c,
        value,
        formatted: def.format(value),
        score,
        isPR,
      })
    }
    return {
      activityId: item.activity.activity_id,
      startTime: item.activity.start_time,
      cells,
    }
  })

  const summary: ColumnSummary[] = []
  for (let c = 1; c <= lapCount; c++) {
    const stat = colStats[c - 1]
    if (!stat) {
      summary.push({ lapIndex: c, best: '—', worst: '—', avg: '—' })
      continue
    }
    const avg = stat.values.reduce((a, b) => a + b, 0) / stat.values.length
    summary.push({
      lapIndex: c,
      best: def.format(stat.best),
      worst: def.format(stat.worst),
      avg: def.format(avg),
    })
  }

  return { lapCount, rows, summary }
}

/**
 * Heat-map background for a score in [0,1] (0 = worst/red, 1 = best/green).
 * Uses a low-alpha overlay so it reads on both light and dark themes.
 */
export function heatColor(score: number | null): string | undefined {
  if (score == null) return undefined
  const hue = Math.round(score * 120) // 0 = red, 120 = green
  return `hsl(${hue} 65% 45% / 0.22)`
}

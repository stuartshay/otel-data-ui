import { describe, expect, it } from 'vitest'
import {
  buildComparisonMatrix,
  getMetricDef,
  heatColor,
  type ComparisonItem,
  type ComparisonLap,
  type LapMetric,
} from './lapComparison'

const lap = (overrides: Partial<ComparisonLap> = {}): ComparisonLap => ({
  lap_index: 1,
  duration_seconds: 1500,
  distance_meters: 8046,
  avg_speed_mps: 5,
  avg_heart_rate: 120,
  max_heart_rate: 140,
  total_ascent_meters: 20,
  total_descent_meters: 18,
  calories: 260,
  ...overrides,
})

const items: ComparisonItem[] = [
  {
    activity: { activity_id: 'a1', start_time: '2026-07-05T10:00:00Z' },
    laps: [
      {
        lap_index: 1,
        duration_seconds: 1600,
        distance_meters: 8046,
        avg_speed_mps: 5.0,
        avg_heart_rate: 120,
        max_heart_rate: 140,
        total_ascent_meters: 20,
        total_descent_meters: 18,
        calories: 260,
      },
      {
        lap_index: 2,
        duration_seconds: 1700,
        distance_meters: 8046,
        avg_speed_mps: 4.7,
        avg_heart_rate: 130,
        max_heart_rate: 150,
        total_ascent_meters: 30,
        total_descent_meters: 25,
        calories: 270,
      },
    ],
  },
  {
    activity: { activity_id: 'a2', start_time: '2026-07-04T10:00:00Z' },
    laps: [
      {
        lap_index: 1,
        duration_seconds: 1500,
        distance_meters: 8046,
        avg_speed_mps: 5.4,
        avg_heart_rate: 118,
        max_heart_rate: 138,
        total_ascent_meters: 22,
        total_descent_meters: 19,
        calories: 250,
      },
      // No lap 2 — differing lap counts.
    ],
  },
]

describe('buildComparisonMatrix', () => {
  it('uses the max lap index across activities as the column count', () => {
    const matrix = buildComparisonMatrix(items, 'speed')
    expect(matrix.lapCount).toBe(2)
    expect(matrix.rows).toHaveLength(2)
    expect(matrix.rows[0].cells).toHaveLength(2)
  })

  it('renders missing laps as empty, non-PR cells', () => {
    const matrix = buildComparisonMatrix(items, 'speed')
    const a2Lap2 = matrix.rows[1].cells[1]
    expect(a2Lap2.value).toBeNull()
    expect(a2Lap2.formatted).toBe('—')
    expect(a2Lap2.score).toBeNull()
    expect(a2Lap2.isPR).toBe(false)
  })

  it('flags the fastest lap as PR for a higher-is-better metric (speed)', () => {
    const matrix = buildComparisonMatrix(items, 'speed')
    const a1Lap1 = matrix.rows[0].cells[0]
    const a2Lap1 = matrix.rows[1].cells[0]
    expect(a2Lap1.isPR).toBe(true)
    expect(a1Lap1.isPR).toBe(false)
    expect(a2Lap1.score).toBe(1)
    expect(a1Lap1.score).toBe(0)
  })

  it('flags the shortest time as PR for a lower-is-better metric (time)', () => {
    const matrix = buildComparisonMatrix(items, 'time')
    const a1Lap1 = matrix.rows[0].cells[0]
    const a2Lap1 = matrix.rows[1].cells[0]
    expect(a2Lap1.isPR).toBe(true)
    expect(a2Lap1.score).toBe(1)
    expect(a1Lap1.score).toBe(0)
  })

  it('does not flag PR in a column with a single value', () => {
    const matrix = buildComparisonMatrix(items, 'time')
    const a1Lap2 = matrix.rows[0].cells[1]
    expect(a1Lap2.isPR).toBe(false)
    expect(a1Lap2.score).toBeNull()
  })

  it('does not flag any PR when all values in a column are tied (no spread)', () => {
    const tied: ComparisonItem[] = [
      {
        activity: { activity_id: 't1', start_time: '2026-07-05T10:00:00Z' },
        laps: [
          {
            lap_index: 1,
            duration_seconds: 1500,
            distance_meters: 8046,
            avg_speed_mps: 5,
            avg_heart_rate: 120,
            max_heart_rate: 140,
            total_ascent_meters: 20,
            total_descent_meters: 18,
            calories: 260,
          },
        ],
      },
      {
        activity: { activity_id: 't2', start_time: '2026-07-04T10:00:00Z' },
        laps: [
          {
            lap_index: 1,
            duration_seconds: 1500,
            distance_meters: 8046,
            avg_speed_mps: 5,
            avg_heart_rate: 120,
            max_heart_rate: 140,
            total_ascent_meters: 20,
            total_descent_meters: 18,
            calories: 260,
          },
        ],
      },
    ]
    const matrix = buildComparisonMatrix(tied, 'time')
    expect(matrix.rows.every((r) => r.cells.every((c) => !c.isPR))).toBe(true)
    expect(matrix.rows[0].cells[0].score).toBeNull()
  })

  it('computes best/avg/worst summaries per lap column', () => {
    const matrix = buildComparisonMatrix(items, 'time')
    // Lap 1: 1500 and 1600 -> best 25:00, worst 26:40, avg 25:50
    expect(matrix.summary[0]).toMatchObject({
      best: '25:00',
      worst: '26:40',
      avg: '25:50',
    })
    // Lap 2: only 1700 -> 28:20
    expect(matrix.summary[1]).toMatchObject({
      best: '28:20',
      worst: '28:20',
      avg: '28:20',
    })
  })

  it('uses empty summaries when a lap column has no finite metric values', () => {
    const matrix = buildComparisonMatrix(
      [
        {
          activity: { activity_id: 'empty', start_time: null },
          laps: [lap({ avg_heart_rate: 0 })],
        },
      ],
      'avgHr',
    )

    expect(matrix.rows[0]).toMatchObject({
      activityId: 'empty',
      startTime: null,
      cells: [{ value: null, formatted: '—', score: null, isPR: false }],
    })
    expect(matrix.summary).toEqual([
      { lapIndex: 1, best: '—', worst: '—', avg: '—' },
    ])
  })
})

describe('metric definitions', () => {
  it('marks lower-is-better metrics correctly', () => {
    expect(getMetricDef('time').higherIsBetter).toBe(false)
    expect(getMetricDef('avgHr').higherIsBetter).toBe(false)
    expect(getMetricDef('speed').higherIsBetter).toBe(true)
    expect(getMetricDef('efficiency').higherIsBetter).toBe(true)
  })

  it('falls back to the time definition for an unknown metric', () => {
    expect(getMetricDef('unknown' as LapMetric)).toBe(getMetricDef('time'))
  })

  it('extracts and formats speed values and missing data', () => {
    const def = getMetricDef('speed')
    expect(def.extract(lap({ avg_speed_mps: null }))).toBeNull()
    expect(def.extract(lap())).toBeCloseTo(11.1847)
    expect(def.format(null)).toBe('—')
    expect(def.format(11.1847)).toBe('11.2')
  })

  it.each([
    ['avgHr' as const, 'avg_heart_rate' as const, 123.6, '124'],
    ['maxHr' as const, 'max_heart_rate' as const, 156.4, '156'],
  ])('extracts and formats %s values', (metric, field, value, formatted) => {
    const def = getMetricDef(metric)
    expect(def.extract(lap({ [field]: null }))).toBeNull()
    expect(def.extract(lap({ [field]: 0 }))).toBeNull()
    expect(def.extract(lap({ [field]: value }))).toBe(value)
    expect(def.format(null)).toBe('—')
    expect(def.format(value)).toBe(formatted)
  })

  it('extracts and formats ascent values', () => {
    const def = getMetricDef('ascent')
    expect(def.extract(lap({ total_ascent_meters: null }))).toBeNull()
    expect(def.extract(lap({ total_ascent_meters: 10 }))).toBeCloseTo(32.8084)
    expect(def.format(null)).toBe('—')
    expect(def.format(32.8084)).toBe('33')
  })

  it('extracts and formats efficiency only for valid speed and heart rate', () => {
    const def = getMetricDef('efficiency')
    expect(def.extract(lap({ avg_speed_mps: null }))).toBeNull()
    expect(def.extract(lap({ avg_heart_rate: null }))).toBeNull()
    expect(def.extract(lap({ avg_heart_rate: 0 }))).toBeNull()
    expect(def.extract(lap())).toBe(9.3)
    expect(def.format(null)).toBe('—')
    expect(def.format(9.34)).toBe('9.3')
  })
})

describe('heatColor', () => {
  it('returns undefined when there is no score', () => {
    expect(heatColor(null)).toBeUndefined()
  })

  it('maps 0 to red and 1 to green', () => {
    expect(heatColor(0)).toBe('hsl(0 65% 45% / 0.22)')
    expect(heatColor(1)).toBe('hsl(120 65% 45% / 0.22)')
  })
})

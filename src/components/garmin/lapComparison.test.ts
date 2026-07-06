import { describe, expect, it } from 'vitest'
import {
  buildComparisonMatrix,
  getMetricDef,
  heatColor,
  type ComparisonItem,
} from './lapComparison'

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
})

describe('metric definitions', () => {
  it('marks lower-is-better metrics correctly', () => {
    expect(getMetricDef('time').higherIsBetter).toBe(false)
    expect(getMetricDef('avgHr').higherIsBetter).toBe(false)
    expect(getMetricDef('speed').higherIsBetter).toBe(true)
    expect(getMetricDef('efficiency').higherIsBetter).toBe(true)
  })

  it('returns efficiency as null when heart rate is missing', () => {
    const def = getMetricDef('efficiency')
    expect(
      def.extract({
        lap_index: 1,
        duration_seconds: 1000,
        distance_meters: 1000,
        avg_speed_mps: 5,
        avg_heart_rate: null,
        max_heart_rate: null,
        total_ascent_meters: 0,
        total_descent_meters: 0,
        calories: 0,
      }),
    ).toBeNull()
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

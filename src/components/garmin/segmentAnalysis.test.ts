import { describe, expect, it } from 'vitest'
import type { SavedPoint } from './ActivityChartData'
import { buildSavedSegments, formatPaceMinPerMi } from './segmentAnalysis'

function savedPoint(overrides: Partial<SavedPoint> = {}): SavedPoint {
  return {
    id: overrides.id ?? overrides.timestamp ?? 'p',
    color: '#ff0000',
    timestamp: '2026-05-31T12:00:00Z',
    time: 0,
    distance: null,
    distanceKm: null,
    elevation: null,
    speed: null,
    heartRate: null,
    respirationRate: null,
    latitude: null,
    longitude: null,
    ...overrides,
  }
}

describe('buildSavedSegments', () => {
  it('returns an empty array for fewer than two points', () => {
    expect(buildSavedSegments([])).toEqual([])
    expect(buildSavedSegments([savedPoint()])).toEqual([])
  })

  it('orders points by elapsed time regardless of insertion order', () => {
    const a = savedPoint({ id: 'a', time: 0 })
    const b = savedPoint({ id: 'b', time: 10 })
    const c = savedPoint({ id: 'c', time: 20 })

    const segments = buildSavedSegments([c, a, b])

    expect(segments).toHaveLength(2)
    expect(segments[0].from.id).toBe('a')
    expect(segments[0].to.id).toBe('b')
    expect(segments[1].from.id).toBe('b')
    expect(segments[1].to.id).toBe('c')
    expect(segments[0].index).toBe(1)
    expect(segments[1].index).toBe(2)
  })

  it('computes distance from the cumulative distanceKm delta', () => {
    const from = savedPoint({ id: 'a', time: 0, distanceKm: 1 })
    const to = savedPoint({ id: 'b', time: 6, distanceKm: 2.609344 })

    const [seg] = buildSavedSegments([from, to])

    expect(seg.distanceIsStraightLine).toBe(false)
    expect(seg.distanceMi).toBeCloseTo(1, 4)
    // 6 minutes => 360 seconds
    expect(seg.durationSeconds).toBeCloseTo(360, 5)
    // 1 mile in 6 minutes => 10 mph
    expect(seg.avgSpeedMph).toBeCloseTo(10, 4)
    expect(seg.paceMinPerMi).toBeCloseTo(6, 4)
  })

  it('falls back to the straight-line distance when distanceKm is missing', () => {
    const from = savedPoint({
      id: 'a',
      time: 0,
      latitude: 40.0,
      longitude: -74.0,
    })
    const to = savedPoint({
      id: 'b',
      time: 10,
      latitude: 40.0,
      longitude: -73.9,
    })

    const [seg] = buildSavedSegments([from, to])

    expect(seg.distanceIsStraightLine).toBe(true)
    expect(seg.distanceMi).not.toBeNull()
    expect(seg.distanceMi).toBeGreaterThan(0)
    expect(seg.straightLineMi).toBeCloseTo(seg.distanceMi ?? 0, 6)
  })

  it('computes net elevation change and grade', () => {
    const from = savedPoint({
      id: 'a',
      time: 0,
      distanceKm: 0,
      elevation: 100,
    })
    const to = savedPoint({
      id: 'b',
      time: 6,
      distanceKm: 1.609344,
      elevation: 200,
    })

    const [seg] = buildSavedSegments([from, to])

    expect(seg.elevationChangeFt).toBeCloseTo(100, 5)
    expect(seg.distanceMi).toBeCloseTo(1, 4)
    // 100 ft over 1 mile (5280 ft) => ~1.894%
    expect(seg.gradePercent).toBeCloseTo((100 / 5280) * 100, 4)
  })

  it('leaves metrics null when inputs are unavailable', () => {
    const from = savedPoint({ id: 'a', time: 0 })
    const to = savedPoint({ id: 'b', time: 0 })

    const [seg] = buildSavedSegments([from, to])

    expect(seg.distanceMi).toBeNull()
    expect(seg.durationSeconds).toBe(0)
    expect(seg.avgSpeedMph).toBeNull()
    expect(seg.paceMinPerMi).toBeNull()
    expect(seg.elevationChangeFt).toBeNull()
    expect(seg.gradePercent).toBeNull()
  })

  it('uses the ending point color for the segment', () => {
    const from = savedPoint({ id: 'a', time: 0, color: '#111111' })
    const to = savedPoint({ id: 'b', time: 10, color: '#222222' })

    const [seg] = buildSavedSegments([from, to])

    expect(seg.color).toBe('#222222')
  })
})

describe('formatPaceMinPerMi', () => {
  it('formats minutes and seconds', () => {
    expect(formatPaceMinPerMi(6)).toBe('6:00 /mi')
    expect(formatPaceMinPerMi(7.5)).toBe('7:30 /mi')
  })

  it('carries rounded seconds into the minutes column', () => {
    expect(formatPaceMinPerMi(8.999)).toBe('9:00 /mi')
  })

  it('returns an em dash for null or non-finite values', () => {
    expect(formatPaceMinPerMi(null)).toBe('—')
    expect(formatPaceMinPerMi(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

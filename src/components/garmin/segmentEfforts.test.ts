import { describe, expect, it } from 'vitest'
import {
  bestEffortKey,
  effortKey,
  formatDistanceMi,
  formatElapsed,
  formatSpeedMph,
  formatTolerance,
  sortEfforts,
  type SegmentEffort,
} from './segmentEfforts'

function effort(overrides: Partial<SegmentEffort>): SegmentEffort {
  return {
    rank: 1,
    activity_id: 'a',
    effort_start: '2026-07-01T10:00:00Z',
    effort_end: '2026-07-01T10:01:19Z',
    elapsed_seconds: 79,
    ...overrides,
  }
}

describe('sortEfforts', () => {
  const efforts: SegmentEffort[] = [
    effort({
      activity_id: 'a',
      elapsed_seconds: 82,
      avg_speed_kmh: 19,
      activity_start_time: '2010-06-29T10:00:00Z',
    }),
    effort({
      activity_id: 'b',
      elapsed_seconds: 79,
      avg_speed_kmh: 20,
      activity_start_time: '2025-07-04T12:00:00Z',
    }),
    effort({
      activity_id: 'c',
      elapsed_seconds: 84,
      avg_speed_kmh: 18,
      activity_start_time: '2020-10-04T09:00:00Z',
    }),
  ]

  it('sorts by fastest time', () => {
    expect(sortEfforts(efforts, 'time').map((e) => e.activity_id)).toEqual([
      'b',
      'a',
      'c',
    ])
  })

  it('sorts by top speed', () => {
    expect(sortEfforts(efforts, 'speed').map((e) => e.activity_id)).toEqual([
      'b',
      'a',
      'c',
    ])
  })

  it('sorts by most recent date', () => {
    expect(sortEfforts(efforts, 'date').map((e) => e.activity_id)).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [...efforts]
    sortEfforts(input, 'time')
    expect(input.map((e) => e.activity_id)).toEqual(['a', 'b', 'c'])
  })
})

describe('bestEffortKey', () => {
  it('returns the key of the effort with the lowest elapsed time', () => {
    const efforts = [
      effort({ activity_id: 'a', elapsed_seconds: 82 }),
      effort({ activity_id: 'b', elapsed_seconds: 79 }),
    ]
    expect(bestEffortKey(efforts)).toBe(effortKey(efforts[1]))
  })

  it('returns null for an empty list', () => {
    expect(bestEffortKey([])).toBeNull()
  })

  it('picks the fastest lap, not every lap, when one activity has several', () => {
    // A single ride that laps the segment twice shares one activity_id --
    // only its faster lap should be the PR, not both.
    const efforts = [
      effort({
        activity_id: 'multi-lap-ride',
        effort_start: '2026-07-09T22:03:21Z',
        elapsed_seconds: 1098,
      }),
      effort({
        activity_id: 'multi-lap-ride',
        effort_start: '2026-07-09T22:44:46Z',
        elapsed_seconds: 1199,
      }),
    ]
    expect(bestEffortKey(efforts)).toBe(effortKey(efforts[0]))
    expect(bestEffortKey(efforts)).not.toBe(effortKey(efforts[1]))
  })
})

describe('formatters', () => {
  it('formats elapsed seconds as duration', () => {
    expect(formatElapsed(79)).toBe('1:19')
    expect(formatElapsed(null)).toBe('—')
  })

  it('formats km/h to mph', () => {
    expect(formatSpeedMph(20)).toBe('12.4 mph')
    expect(formatSpeedMph(null)).toBe('—')
  })

  it('formats km to miles', () => {
    expect(formatDistanceMi(1)).toBe('0.62 mi')
    expect(formatDistanceMi(null)).toBe('—')
  })

  it('formats tolerance in meters', () => {
    expect(formatTolerance(35)).toBe('35 m')
    expect(formatTolerance(null)).toBe('—')
  })
})

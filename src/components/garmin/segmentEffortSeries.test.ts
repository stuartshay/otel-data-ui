import { describe, expect, it } from 'vitest'
import {
  binIndexForFraction,
  sampleAtFraction,
  type SegmentEffortSeriesBin,
} from './segmentEffortSeries'

function bin(
  index: number,
  overrides: Partial<SegmentEffortSeriesBin> = {},
): SegmentEffortSeriesBin {
  return {
    index,
    fraction: (index + 0.5) / 10,
    speed_kmh: 18 + index,
    heart_rate: 120 + index,
    ...overrides,
  }
}

describe('binIndexForFraction', () => {
  it('maps fractions to clamped bin indexes', () => {
    expect(binIndexForFraction(0, 10)).toBe(0)
    expect(binIndexForFraction(0.05, 10)).toBe(0)
    expect(binIndexForFraction(0.55, 10)).toBe(5)
    expect(binIndexForFraction(0.999, 10)).toBe(9)
    expect(binIndexForFraction(1, 10)).toBe(9)
  })

  it('clamps out-of-range and invalid inputs', () => {
    expect(binIndexForFraction(-0.5, 10)).toBe(0)
    expect(binIndexForFraction(1.5, 10)).toBe(9)
    expect(binIndexForFraction(Number.NaN, 10)).toBe(0)
    expect(binIndexForFraction(0.5, 0)).toBe(0)
  })
})

describe('sampleAtFraction', () => {
  it('returns the reading from the exact bin', () => {
    const bins = Array.from({ length: 10 }, (_, i) => bin(i))

    expect(sampleAtFraction(bins, 0.55)).toEqual({
      speed_kmh: 23,
      heart_rate: 125,
    })
  })

  it('falls back to the nearest non-empty bin within two bins', () => {
    const bins = Array.from({ length: 10 }, (_, i) =>
      i === 5 || i === 6
        ? bin(i, { speed_kmh: null, heart_rate: null })
        : bin(i),
    )

    // Bin 5 is empty; bin 4 is the nearest neighbor with data.
    expect(sampleAtFraction(bins, 0.55)).toEqual({
      speed_kmh: 22,
      heart_rate: 124,
    })
  })

  it('returns null when no bin within the radius has data', () => {
    const bins = Array.from({ length: 10 }, (_, i) =>
      i >= 3 && i <= 7 ? bin(i, { speed_kmh: null, heart_rate: null }) : bin(i),
    )

    expect(sampleAtFraction(bins, 0.55)).toBeNull()
  })

  it('treats a bin with only one metric as data', () => {
    const bins = [bin(0, { speed_kmh: null, heart_rate: 133 })]

    expect(sampleAtFraction(bins, 0)).toEqual({
      speed_kmh: null,
      heart_rate: 133,
    })
  })

  it('returns null for an empty series', () => {
    expect(sampleAtFraction([], 0.5)).toBeNull()
  })
})

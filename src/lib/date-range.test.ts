import { describe, expect, it } from 'vitest'
import { parseDateRangeParams, toLocalDate } from './date-range'

describe('parseDateRangeParams', () => {
  const bounds = {
    minDate: new Date(2025, 0, 1),
    maxDate: new Date(2026, 5, 1),
  }

  it('returns undefined when no params are provided', () => {
    const result = parseDateRangeParams(null, null, bounds)
    expect(result.dateFrom).toBeUndefined()
    expect(result.dateTo).toBeUndefined()
    expect(result.dateFromParam).toBeUndefined()
    expect(result.dateToParam).toBeUndefined()
  })

  it('parses valid date strings within bounds', () => {
    const result = parseDateRangeParams('2025-06-15', '2026-03-01', bounds)
    expect(result.dateFromParam).toBe('2025-06-15')
    expect(result.dateToParam).toBe('2026-03-01')
  })

  it('clamps dates before minDate to minDate', () => {
    const result = parseDateRangeParams('2024-01-01', null, bounds)
    expect(result.dateFromParam).toBe('2025-01-01')
  })

  it('clamps dates after maxDate to maxDate', () => {
    const result = parseDateRangeParams('2027-01-01', null, bounds)
    expect(result.dateFromParam).toBe('2026-06-01')
  })

  it('swaps from and to when from > to', () => {
    const result = parseDateRangeParams('2026-03-15', '2025-06-01', bounds)
    expect(result.dateFromParam).toBe('2025-06-01')
    expect(result.dateToParam).toBe('2026-03-15')
  })

  it('ignores invalid date strings', () => {
    const result = parseDateRangeParams('not-a-date', 'also-bad', bounds)
    expect(result.dateFrom).toBeUndefined()
    expect(result.dateTo).toBeUndefined()
  })

  it('works without minDate in bounds', () => {
    const boundsNoMin = { maxDate: new Date(2026, 5, 1) }
    const result = parseDateRangeParams('2020-01-01', null, boundsNoMin)
    expect(result.dateFromParam).toBe('2020-01-01')
  })

  it('converts UTC ISO timestamp to local date via toLocalDate', () => {
    const date = toLocalDate('2025-01-01T00:00:00Z')
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import {
  celsiusToFahrenheit,
  formatDuration,
  formatPace,
  kmhToMph,
  kmToMi,
  metersToFeet,
} from './units'

describe('units helpers', () => {
  it('converts metric distances and temperatures', () => {
    expect(kmToMi(5)).toBeCloseTo(3.106855, 5)
    expect(kmhToMph(10)).toBeCloseTo(6.21371, 5)
    expect(metersToFeet(100)).toBeCloseTo(328.084, 3)
    expect(celsiusToFahrenheit(20)).toBe(68)
  })

  it('formats durations for short and long activities', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('formats pace and handles invalid values', () => {
    expect(formatPace(null)).toBe('—')
    expect(formatPace(0)).toBe('—')
    expect(formatPace(9.656064)).toBe('10:00 /mi')
  })
})

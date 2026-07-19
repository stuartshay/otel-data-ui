import { describe, expect, it } from 'vitest'
import {
  describeWeatherCode,
  temperatureRangeF,
  weatherIconKind,
} from './WeatherPanel.helpers'

describe('describeWeatherCode', () => {
  it('maps known WMO codes to descriptions', () => {
    expect(describeWeatherCode(0)).toBe('Clear sky')
    expect(describeWeatherCode(3)).toBe('Overcast')
    expect(describeWeatherCode(61)).toBe('Slight rain')
    expect(describeWeatherCode(95)).toBe('Thunderstorm')
  })

  it('falls back to Unknown for null/unmapped codes', () => {
    expect(describeWeatherCode(null)).toBe('Unknown conditions')
    expect(describeWeatherCode(undefined)).toBe('Unknown conditions')
    expect(describeWeatherCode(12345)).toBe('Unknown conditions')
  })
})

describe('weatherIconKind', () => {
  it('buckets codes into icon categories', () => {
    expect(weatherIconKind(0)).toBe('clear')
    expect(weatherIconKind(2)).toBe('cloud')
    expect(weatherIconKind(45)).toBe('fog')
    expect(weatherIconKind(55)).toBe('drizzle')
    expect(weatherIconKind(65)).toBe('rain')
    expect(weatherIconKind(81)).toBe('rain')
    expect(weatherIconKind(73)).toBe('snow')
    expect(weatherIconKind(86)).toBe('snow')
    expect(weatherIconKind(99)).toBe('thunderstorm')
  })

  it('falls back to unknown for null/unmapped codes', () => {
    expect(weatherIconKind(null)).toBe('unknown')
    expect(weatherIconKind(undefined)).toBe('unknown')
    expect(weatherIconKind(12345)).toBe('unknown')
  })
})

describe('temperatureRangeF', () => {
  it('converts and returns the min/max across known readings', () => {
    // 10C -> 50F, 25C -> 77F
    expect(temperatureRangeF([10, 25])).toEqual({ minF: 50, maxF: 77 })
  })

  it('ignores null/undefined readings', () => {
    expect(temperatureRangeF([10, null, undefined, 25])).toEqual({
      minF: 50,
      maxF: 77,
    })
  })

  it('returns a single-value range when there is only one reading', () => {
    expect(temperatureRangeF([20])).toEqual({ minF: 68, maxF: 68 })
  })

  it('returns null when no readings have a temperature', () => {
    expect(temperatureRangeF([null, undefined])).toBeNull()
    expect(temperatureRangeF([])).toBeNull()
  })
})

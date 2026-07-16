import { describe, expect, it } from 'vitest'
import { describeWeatherCode, weatherIconKind } from './WeatherPanel.helpers'

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

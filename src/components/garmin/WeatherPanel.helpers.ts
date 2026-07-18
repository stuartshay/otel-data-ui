import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
} from 'lucide-react'
import { celsiusToFahrenheit } from '@/lib/units'

// WMO weather interpretation codes as returned by Open-Meteo.
// https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

export function describeWeatherCode(code: number | null | undefined): string {
  if (code == null) return 'Unknown conditions'
  return WMO_DESCRIPTIONS[code] ?? 'Unknown conditions'
}

export type WeatherIconKind =
  | 'clear'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown'

export function weatherIconKind(
  code: number | null | undefined,
): WeatherIconKind {
  if (code == null) return 'unknown'
  if (code === 0) return 'clear'
  if (code === 1 || code === 2 || code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95 && code <= 99) return 'thunderstorm'
  return 'unknown'
}

export const WEATHER_ICONS = {
  clear: Sun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
  unknown: Cloud,
} as const

export function fmtTemp(celsius: number | null | undefined): string {
  return celsius != null ? `${Math.round(celsiusToFahrenheit(celsius))}°F` : '—'
}

export interface TemperatureRange {
  minF: number
  maxF: number
}

/** Min/max temperature (°F) across a set of readings, or null if none have a temperature. */
export function temperatureRangeF(
  temperaturesC: Array<number | null | undefined>,
): TemperatureRange | null {
  const known = temperaturesC
    .filter((c): c is number => c != null)
    .map(celsiusToFahrenheit)
  if (known.length === 0) return null
  return {
    minF: Math.round(Math.min(...known)),
    maxF: Math.round(Math.max(...known)),
  }
}

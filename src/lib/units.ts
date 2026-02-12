const KM_TO_MI = 0.621371
const M_TO_FT = 3.28084

export function kmToMi(km: number): number {
  return km * KM_TO_MI
}

export function kmhToMph(kmh: number): number {
  return kmh * KM_TO_MI
}

export function metersToFeet(m: number): number {
  return m * M_TO_FT
}

export function celsiusToFahrenheit(c: number): number {
  return c * 1.8 + 32
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatPace(avgSpeedKmh: number | null): string {
  if (avgSpeedKmh == null || avgSpeedKmh === 0) return '—'
  const minsPerMi = 60 / kmhToMph(avgSpeedKmh)
  const mins = Math.floor(minsPerMi)
  const secs = Math.round((minsPerMi - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')} /mi`
}

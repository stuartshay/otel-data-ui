export type XAxisMode = 'distance' | 'time'

export function formatXAxisValue(
  value: unknown,
  mode: XAxisMode,
): string | undefined {
  if (value == null || value === '') return undefined

  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return undefined

  return mode === 'distance'
    ? `${numeric.toFixed(1)} mi`
    : `${numeric.toFixed(0)} min`
}

export function coerceTooltipMetricValue(value: unknown): number | null {
  if (value == null || value === '') return null

  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

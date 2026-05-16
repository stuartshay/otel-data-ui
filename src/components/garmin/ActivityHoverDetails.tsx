import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { reverseGeocode } from '@/services/geocoder'
import type { ChartDataPoint } from './ActivityCharts'

interface ActivityHoverDetailsProps {
  point: ChartDataPoint | null
}

type AddressState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; label: string }
  | { status: 'empty' }
  | { status: 'error' }

// Round to ~11m precision so small jitter between adjacent samples reuses the
// cache and we do not flood the geocoder while a cursor sweeps a chart.
function roundCoord(n: number): number {
  return Math.round(n * 10_000) / 10_000
}

const DEBOUNCE_MS = 250
const addressCache = new Map<string, string | null>()

interface CoordKey {
  key: string
  lat: number
  lon: number
}

function coordKey(point: ChartDataPoint | null): CoordKey | null {
  if (
    !point ||
    point.latitude == null ||
    point.longitude == null ||
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude)
  ) {
    return null
  }
  const lat = roundCoord(point.latitude)
  const lon = roundCoord(point.longitude)
  return { key: `${lat},${lon}`, lat, lon }
}

export function ActivityHoverDetails({ point }: ActivityHoverDetailsProps) {
  const target = useMemo(() => coordKey(point), [point])
  const [pendingState, setPendingState] = useState<{
    key: string
    state: AddressState
  } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!target) return
    if (addressCache.has(target.key)) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = window.setTimeout(async () => {
      try {
        const res = await reverseGeocode(target.lat, target.lon, 1)
        if (controller.signal.aborted) return
        const label = res.features[0]?.properties?.label ?? null
        addressCache.set(target.key, label)
        setPendingState({
          key: target.key,
          state: label ? { status: 'ok', label } : { status: 'empty' },
        })
      } catch {
        if (controller.signal.aborted) return
        setPendingState({ key: target.key, state: { status: 'error' } })
      }
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [target])

  const address: AddressState = (() => {
    if (!target) return { status: 'idle' }
    if (addressCache.has(target.key)) {
      const cached = addressCache.get(target.key)
      return cached ? { status: 'ok', label: cached } : { status: 'empty' }
    }
    if (pendingState && pendingState.key === target.key) {
      return pendingState.state
    }
    return { status: 'loading' }
  })()

  if (!point) {
    return (
      <Card data-testid="activity-hover-details">
        <CardContent className="py-3 text-xs text-muted-foreground">
          Hover the Elevation or Speed chart to see details for that point.
        </CardContent>
      </Card>
    )
  }

  const timeStr = new Date(point.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <Card data-testid="activity-hover-details">
      <CardContent className="py-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4 lg:grid-cols-5">
          <Field
            label="Elevation"
            value={
              point.elevation != null ? `${point.elevation.toFixed(1)} ft` : '—'
            }
          />
          <Field
            label="Speed"
            value={point.speed != null ? `${point.speed.toFixed(1)} mph` : '—'}
          />
          <Field
            label="Time"
            value={`${timeStr} (${point.time.toFixed(1)} min)`}
          />
          <Field
            label="Distance"
            value={
              point.distance != null
                ? `${point.distance.toFixed(2)} mi${
                    point.distanceKm != null
                      ? ` (${point.distanceKm.toFixed(2)} km)`
                      : ''
                  }`
                : '—'
            }
          />
          <Field
            label="Lat/Lon"
            value={
              point.latitude != null && point.longitude != null
                ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                : '—'
            }
          />
        </div>
        <div
          className="mt-2 border-t pt-2 text-xs"
          data-testid="activity-hover-address"
        >
          <span className="text-muted-foreground">Address</span>{' '}
          <span
            className="font-medium"
            data-testid="activity-hover-address-value"
          >
            {renderAddress(address)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function renderAddress(state: AddressState): string {
  switch (state.status) {
    case 'loading':
      return 'Resolving…'
    case 'ok':
      return state.label
    case 'empty':
      return 'No address found'
    case 'error':
      return 'Unavailable'
    case 'idle':
    default:
      return '—'
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

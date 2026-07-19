import { useEffect, useMemo, useRef, useState } from 'react'
import { reverseGeocode } from '@/services/geocoder'

export type ReverseGeocodedAddressState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; label: string }
  | { status: 'empty' }
  | { status: 'error' }

// Round to ~11m precision so small jitter between adjacent samples reuses the
// cache and we do not flood the geocoder while a cursor sweeps a chart.
function roundCoord(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

const DEBOUNCE_MS = 250
const addressCache = new Map<string, string | null>()

interface CoordinateTarget {
  key: string
  latitude: number
  longitude: number
}

function coordinateTarget(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): CoordinateTarget | null {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  const roundedLatitude = roundCoord(latitude)
  const roundedLongitude = roundCoord(longitude)
  return {
    key: `${roundedLatitude},${roundedLongitude}`,
    latitude: roundedLatitude,
    longitude: roundedLongitude,
  }
}

export function useReverseGeocodedAddress(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): ReverseGeocodedAddressState {
  const target = useMemo(
    () => coordinateTarget(latitude, longitude),
    [latitude, longitude],
  )
  const [pendingState, setPendingState] = useState<{
    key: string
    state: ReverseGeocodedAddressState
  } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!target || addressCache.has(target.key)) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = window.setTimeout(async () => {
      try {
        const response = await reverseGeocode(
          target.latitude,
          target.longitude,
          1,
        )
        if (controller.signal.aborted) return

        const label = response.features[0]?.properties?.label ?? null
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

  if (!target) return { status: 'idle' }
  if (addressCache.has(target.key)) {
    const cached = addressCache.get(target.key)
    return cached ? { status: 'ok', label: cached } : { status: 'empty' }
  }
  if (pendingState?.key === target.key) return pendingState.state
  return { status: 'loading' }
}

export function formatReverseGeocodedAddress(
  state: ReverseGeocodedAddressState,
): string {
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

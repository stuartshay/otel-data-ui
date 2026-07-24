import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useReverseGeocodePointLazyQuery } from '@/__generated__/graphql'

export type ReverseGeocodedAddressState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; label: string }
  | { status: 'empty' }
  | { status: 'error' }

// Round to ~11m precision so small jitter between adjacent samples reuses the
// cache and we do not flood the geocoder while a cursor sweeps a chart. Also
// the cell size used by otel-data-api's dense point-cell cache, so a rounded
// key here matches one there exactly.
export function roundCoord(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

export function coordinateCacheKey(
  latitude: number,
  longitude: number,
): string {
  return `${roundCoord(latitude)},${roundCoord(longitude)}`
}

const DEBOUNCE_MS = 250
const addressCache = new Map<string, string | null>()

// Mutating addressCache alone does not re-render already-mounted consumers,
// since it is a plain Map rather than React state. Seeding bumps this
// version and notifies subscribers below so a point already on screen when a
// batch prefetch lands picks up the newly-cached address immediately instead
// of waiting on an unrelated re-render.
let cacheVersion = 0
const cacheSubscribers = new Set<() => void>()

/**
 * Seed the module-level address cache from a batch reverse-geocode prefetch
 * (see useReverseGeocodedRouteAddresses). Only 'success' results are cached;
 * 'pending'/'no_coverage'/'error' cells are left unset so the debounced
 * single-point lookup in useReverseGeocodedAddress still runs for them when
 * the cursor actually lands there, instead of permanently showing "No
 * address found" for a point the batch endpoint simply hadn't cached yet.
 */
export function seedReverseGeocodedAddressCache(
  results: readonly {
    latitude: number
    longitude: number
    display_address?: string | null
    status: string
  }[],
): void {
  let seededAny = false
  for (const result of results) {
    if (result.status !== 'success') continue
    const key = coordinateCacheKey(result.latitude, result.longitude)
    if (!addressCache.has(key)) {
      addressCache.set(key, result.display_address ?? null)
      seededAny = true
    }
  }
  if (seededAny) {
    cacheVersion += 1
    for (const notify of cacheSubscribers) notify()
  }
}

function subscribeToCache(onChange: () => void): () => void {
  cacheSubscribers.add(onChange)
  return () => cacheSubscribers.delete(onChange)
}

function getCacheVersion(): number {
  return cacheVersion
}

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
  const [reverseGeocodePoint] = useReverseGeocodePointLazyQuery({
    fetchPolicy: 'no-cache',
  })
  const target = useMemo(
    () => coordinateTarget(latitude, longitude),
    [latitude, longitude],
  )
  const [pendingState, setPendingState] = useState<{
    key: string
    state: ReverseGeocodedAddressState
  } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Re-render when a route-level batch prefetch seeds addressCache, so a
  // point already on screen picks up its address without waiting on an
  // unrelated re-render (the cache itself is a plain Map, not React state).
  useSyncExternalStore(subscribeToCache, getCacheVersion, getCacheVersion)

  useEffect(() => {
    if (!target || addressCache.has(target.key)) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = window.setTimeout(async () => {
      // Re-check the cache: a route-level batch prefetch (see
      // useReverseGeocodedRouteAddresses) can seed this exact cell while this
      // timer was pending, e.g. when both hooks mount together and the batch
      // response resolves synchronously from Apollo's cache. Skip the
      // now-redundant single-point request in that case; the render path
      // below already reads straight from the cache once it is set.
      if (addressCache.has(target.key)) return
      try {
        const response = await reverseGeocodePoint({
          variables: {
            latitude: target.latitude,
            longitude: target.longitude,
          },
        })
        if (controller.signal.aborted) return
        if (response.error) throw response.error

        const point = response.data?.reverseGeocodePoint
        if (
          !point ||
          (point.status !== 'success' && point.status !== 'no_coverage')
        ) {
          setPendingState({ key: target.key, state: { status: 'error' } })
          return
        }

        const label =
          point.status === 'success' ? (point.display_address ?? null) : null
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
  }, [reverseGeocodePoint, target])

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

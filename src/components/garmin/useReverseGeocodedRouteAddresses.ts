import { useEffect, useMemo } from 'react'
import { useReverseGeocodePointsBatchQuery } from '@/__generated__/graphql'
import {
  roundCoord,
  coordinateCacheKey,
  seedReverseGeocodedAddressCache,
} from './useReverseGeocodedAddress'

/** otel-data-api's POST /geocoding/reverse/batch bound (1-300 points). */
const MAX_BATCH_POINTS = 300

interface RoutePoint {
  latitude: number | null | undefined
  longitude: number | null | undefined
}

/**
 * Deduplicate route points to their rounded ~11m cell (matching the cache key
 * used by useReverseGeocodedAddress) and cap at the batch endpoint's limit.
 * A segment's raw GPS points are far denser than its distinct addresses, so
 * this keeps the request well under the bound for any reasonably-scoped
 * segment without needing to chunk into multiple requests.
 */
function dedupedBatchPoints(
  points: readonly RoutePoint[],
): { latitude: number; longitude: number }[] {
  const seen = new Set<string>()
  const result: { latitude: number; longitude: number }[] = []
  for (const point of points) {
    if (
      point.latitude == null ||
      point.longitude == null ||
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude)
    ) {
      continue
    }
    const key = coordinateCacheKey(point.latitude, point.longitude)
    if (seen.has(key)) continue
    seen.add(key)
    // Send the same rounded coordinates the key is derived from, rather than
    // the raw point, so the request is explicit about resolving one address
    // per ~11m cell instead of relying on the server rounding independently.
    result.push({
      latitude: roundCoord(point.latitude),
      longitude: roundCoord(point.longitude),
    })
    if (result.length >= MAX_BATCH_POINTS) break
  }
  return result
}

/**
 * Prefetch addresses for an entire route's points in one batched request when
 * the route loads, seeding useReverseGeocodedAddress's shared cache so
 * playback/hover mostly resolve instantly instead of firing one debounced
 * lookup per animation frame (which never settles during a continuous
 * playback sweep). Points the batch endpoint hasn't cached yet are left for
 * the existing single-point fallback to resolve lazily, same as before this
 * prefetch existed.
 */
export function useReverseGeocodedRouteAddresses(
  routePoints: readonly RoutePoint[],
): void {
  const points = useMemo(() => dedupedBatchPoints(routePoints), [routePoints])

  const { data } = useReverseGeocodePointsBatchQuery({
    variables: { points },
    skip: points.length === 0,
    fetchPolicy: 'cache-first',
  })

  useEffect(() => {
    const items = data?.reverseGeocodePointsBatch.items
    if (items && items.length > 0) {
      seedReverseGeocodedAddressCache(items)
    }
  }, [data])
}

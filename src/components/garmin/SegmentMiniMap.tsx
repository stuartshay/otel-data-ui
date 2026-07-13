import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SegmentMiniMapProps {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
  label: string
  route?: ReadonlyArray<ReadonlyArray<number>> | null
}

/**
 * Compact, non-interactive OpenStreetMap preview for a saved segment shown in
 * the segments list. Draws the real route geometry supplied by the API
 * (`segment.route`, ordered [lat, lon] pairs) as a blue polyline. Falls back to
 * a dashed straight line only when no route is available.
 */
export function SegmentMiniMap({
  startLat,
  startLon,
  endLat,
  endLon,
  label,
  route,
}: Readonly<SegmentMiniMapProps>) {
  const mapRef = useRef<HTMLElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const routeLatLngs = useMemo<L.LatLngTuple[]>(
    () =>
      (route ?? [])
        .filter(
          (point) =>
            point.length >= 2 &&
            Number.isFinite(point[0]) &&
            Number.isFinite(point[1]),
        )
        .map((point) => [point[0], point[1]] as L.LatLngTuple),
    [route],
  )

  useEffect(() => {
    const host = mapRef.current
    /* v8 ignore next -- defensive; React assigns host refs before effects */
    if (!host) return

    const map = L.map(host, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([startLat, startLon], 14)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const hasRoute = routeLatLngs.length >= 2

    if (hasRoute) {
      L.polyline(routeLatLngs, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
    } else {
      L.polyline(
        [
          [startLat, startLon],
          [endLat, endLon],
        ],
        { color: '#6366f1', weight: 3, opacity: 0.8, dashArray: '6 6' },
      ).addTo(map)
    }

    L.circleMarker([startLat, startLon], {
      radius: 5,
      fillColor: '#22c55e',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map)

    L.circleMarker([endLat, endLon], {
      radius: 5,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map)

    const bounds = L.latLngBounds(
      hasRoute
        ? routeLatLngs
        : [
            [startLat, startLon],
            [endLat, endLon],
          ],
    )
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [16, 16], maxZoom: 16 })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [startLat, startLon, endLat, endLon, routeLatLngs])

  return (
    <figure
      ref={mapRef}
      aria-label={`${label} segment map`}
      data-testid="segment-mini-map"
      className="m-0 h-24 w-28 shrink-0 overflow-hidden rounded-md border border-border/70 sm:h-28 sm:w-32"
    />
  )
}

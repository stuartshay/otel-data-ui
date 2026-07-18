import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SegmentStartEndMapProps {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
  routePoints?: Array<{
    latitude: number
    longitude: number
    altitude?: number | null
  }>
  /** Point currently under the elevation-chart cursor. */
  activeLatLng?: { lat: number; lng: number } | null
}

function elevationToColor(
  elevation: number | null,
  minElevation: number | null,
  maxElevation: number | null,
): string {
  if (
    elevation == null ||
    minElevation == null ||
    maxElevation == null ||
    maxElevation <= minElevation
  ) {
    return '#2563eb'
  }

  const ratio = Math.min(
    1,
    Math.max(0, (elevation - minElevation) / (maxElevation - minElevation)),
  )
  if (ratio < 0.25) return '#2563eb'
  if (ratio < 0.5) return '#16a34a'
  if (ratio < 0.75) return '#f59e0b'
  return '#dc2626'
}

/**
 * Compact preview map for a saved segment: green start marker, red finish
 * marker, and the source route between them, fitted to bounds. Uses vanilla
 * Leaflet (circle markers) to avoid marker-icon asset setup, mirroring
 * {@link ActivityRouteMap}.
 */
export function SegmentStartEndMap({
  startLat,
  startLon,
  endLat,
  endLon,
  routePoints = [],
  activeLatLng,
}: Readonly<SegmentStartEndMapProps>) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapRef.current).setView([startLat, startLon], 14)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const routeLatLngs = routePoints.map(
      (point) => [point.latitude, point.longitude] as L.LatLngTuple,
    )
    const hasRoute = routeLatLngs.length >= 2

    if (hasRoute) {
      const elevations = routePoints
        .map((point) => point.altitude)
        .filter(
          (value): value is number => value != null && Number.isFinite(value),
        )
      const minElevation =
        elevations.length > 0 ? Math.min(...elevations) : null
      const maxElevation =
        elevations.length > 0 ? Math.max(...elevations) : null

      for (let index = 0; index < routePoints.length - 1; index++) {
        const point = routePoints[index]
        const nextPoint = routePoints[index + 1]

        L.polyline(
          [
            [point.latitude, point.longitude],
            [nextPoint.latitude, nextPoint.longitude],
          ],
          {
            color: elevationToColor(
              point.altitude ?? null,
              minElevation,
              maxElevation,
            ),
            weight: 5,
            opacity: 0.95,
            lineCap: 'butt',
            lineJoin: 'round',
          },
        ).addTo(map)
      }
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
      radius: 7,
      fillColor: '#22c55e',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .bindPopup('Start')
      .addTo(map)

    L.circleMarker([endLat, endLon], {
      radius: 7,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .bindPopup('Finish')
      .addTo(map)

    const bounds = L.latLngBounds(
      hasRoute
        ? routeLatLngs
        : [
            [startLat, startLon],
            [endLat, endLon],
          ],
    )
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
      hoverMarkerRef.current = null
    }
  }, [startLat, startLon, endLat, endLon, routePoints])

  // Move one marker along the route while the elevation graph is hovered.
  // The map view stays fixed so scrubbing the graph does not disrupt context.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (!activeLatLng) {
      hoverMarkerRef.current?.remove()
      hoverMarkerRef.current = null
      return
    }

    if (hoverMarkerRef.current) {
      hoverMarkerRef.current.setLatLng([activeLatLng.lat, activeLatLng.lng])
    } else {
      hoverMarkerRef.current = L.circleMarker(
        [activeLatLng.lat, activeLatLng.lng],
        {
          radius: 6,
          color: '#111827',
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 1,
          className: 'segment-hover-marker',
        },
      ).addTo(map)
    }
  }, [activeLatLng])

  return (
    <div
      ref={mapRef}
      data-testid="segment-map"
      className="h-64 w-full overflow-hidden rounded-md border"
    />
  )
}

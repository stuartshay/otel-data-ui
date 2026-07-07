import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface SegmentStartEndMapProps {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
}

/**
 * Compact preview map for a saved segment: green start marker, red finish
 * marker, and a dashed line between them, fitted to bounds. Uses vanilla
 * Leaflet (circle markers) to avoid marker-icon asset setup, mirroring
 * {@link ActivityRouteMap}.
 */
export function SegmentStartEndMap({
  startLat,
  startLon,
  endLat,
  endLon,
}: SegmentStartEndMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

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

    L.polyline(
      [
        [startLat, startLon],
        [endLat, endLon],
      ],
      { color: '#6366f1', weight: 3, opacity: 0.8, dashArray: '6 6' },
    ).addTo(map)

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

    const bounds = L.latLngBounds([
      [startLat, startLon],
      [endLat, endLon],
    ])
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [startLat, startLon, endLat, endLon])

  return (
    <div
      ref={mapRef}
      data-testid="segment-map"
      className="h-64 w-full overflow-hidden rounded-md border"
    />
  )
}

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildSegmentPreviewPath } from './segmentPreviewPath'

interface SegmentMiniMapProps {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
  label: string
}

export function SegmentMiniMap({
  startLat,
  startLon,
  endLat,
  endLon,
  label,
}: SegmentMiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapRef.current, {
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      touchZoom: false,
      zoomControl: false,
    }).setView([startLat, startLon], 14)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const latLngs = buildSegmentPreviewPath(startLat, startLon, endLat, endLon)

    L.polyline(latLngs, {
      color: '#2563eb',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 1,
      smoothFactor: 0,
      weight: 3,
    }).addTo(map)

    L.circleMarker([startLat, startLon], {
      color: '#ffffff',
      fillColor: '#22c55e',
      fillOpacity: 1,
      radius: 4,
      weight: 1.5,
    }).addTo(map)

    L.circleMarker([endLat, endLon], {
      color: '#ffffff',
      fillColor: '#ef4444',
      fillOpacity: 1,
      radius: 4,
      weight: 1.5,
    }).addTo(map)

    const bounds = L.latLngBounds(latLngs)
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [14, 14], maxZoom: 15 })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [startLat, startLon, endLat, endLon])

  return (
    <div
      ref={mapRef}
      aria-label={`${label} segment map`}
      className="h-24 w-28 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted sm:h-28 sm:w-32"
      data-testid="segment-mini-map"
      role="img"
    />
  )
}

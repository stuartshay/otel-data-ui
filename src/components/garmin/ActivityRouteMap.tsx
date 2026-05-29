import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface TrackPoint {
  latitude: number
  longitude: number
  speed_kmh?: number | null
}

interface ActivityRouteMapProps {
  trackPoints: TrackPoint[]
  /**
   * Optional point currently under the chart cursor. When provided, the map
   * renders a small marker at that location so users can see where the active
   * elevation/speed reading occurred. The map view is not re-centered.
   */
  activeLatLng?: { lat: number; lng: number } | null
  /**
   * Emits the raw map click coordinate. The page resolves it to the nearest
   * chart point so the map and charts stay synchronized on full-resolution
   * data, even when the displayed route is simplified.
   */
  onMapPointSelect?: (latLng: { lat: number; lng: number }) => void
}

function speedToColor(
  speed: number,
  minSpeed: number,
  maxSpeed: number,
): string {
  if (maxSpeed <= minSpeed) return '#3b82f6'
  const ratio = Math.min(
    1,
    Math.max(0, (speed - minSpeed) / (maxSpeed - minSpeed)),
  )
  if (ratio < 0.25) return '#3b82f6' // blue - slow
  if (ratio < 0.5) return '#22c55e' // green
  if (ratio < 0.75) return '#eab308' // yellow
  return '#ef4444' // red - fast
}

export function ActivityRouteMap({
  trackPoints,
  activeLatLng,
  onMapPointSelect,
}: ActivityRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null)

  useEffect(() => {
    if (!mapRef.current || trackPoints.length === 0) return

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapRef.current).setView(
      [trackPoints[0].latitude, trackPoints[0].longitude],
      13,
    )
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    // Compute speed range for color mapping
    const speeds = trackPoints.map((p) => p.speed_kmh ?? 0).filter((s) => s > 0)
    const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 1

    // Draw speed-colored polyline segments
    const bounds = L.latLngBounds([])
    for (let i = 0; i < trackPoints.length - 1; i++) {
      const p1 = trackPoints[i]
      const p2 = trackPoints[i + 1]
      const speed = p1.speed_kmh ?? 0
      const color = speedToColor(speed, minSpeed, maxSpeed)

      L.polyline(
        [
          [p1.latitude, p1.longitude],
          [p2.latitude, p2.longitude],
        ],
        { color, weight: 4, opacity: 0.85 },
      ).addTo(map)

      bounds.extend([p1.latitude, p1.longitude])
    }

    // Extend bounds with last point
    const last = trackPoints[trackPoints.length - 1]
    bounds.extend([last.latitude, last.longitude])

    // Start marker (green circle)
    L.circleMarker([trackPoints[0].latitude, trackPoints[0].longitude], {
      radius: 7,
      fillColor: '#22c55e',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .bindPopup('Start')
      .addTo(map)

    // End marker (red circle)
    L.circleMarker([last.latitude, last.longitude], {
      radius: 7,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    })
      .bindPopup('Finish')
      .addTo(map)

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      onMapPointSelect?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      })
    }
    map.on('click', handleMapClick)

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] })
    }

    return () => {
      map.off('click', handleMapClick)
      map.remove()
      mapInstanceRef.current = null
      hoverMarkerRef.current = null
    }
  }, [trackPoints, onMapPointSelect])

  // Sync hover marker with the active chart point. Avoid re-fitting bounds so
  // the map stays put while the user scrubs the charts.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (!activeLatLng) {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.remove()
        hoverMarkerRef.current = null
      }
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
          className: 'activity-hover-marker',
        },
      ).addTo(map)
    }
  }, [activeLatLng])

  if (trackPoints.length === 0) return null

  return (
    <Card data-testid="activity-route-map">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Route</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4 px-4">
        <div
          ref={mapRef}
          className="h-[400px] w-full rounded-lg overflow-hidden"
        />
        {/* Speed legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
            Slow
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
            Moderate
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
            Fast
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
            Sprint
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

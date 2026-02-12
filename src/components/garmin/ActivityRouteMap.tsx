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

export function ActivityRouteMap({ trackPoints }: ActivityRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

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

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [trackPoints])

  if (trackPoints.length === 0) return null

  return (
    <Card>
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

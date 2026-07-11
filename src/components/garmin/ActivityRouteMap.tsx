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
   * Points the user has saved (via chart double-click, map click, or the
   * details panel). Each renders a persistent color-coded marker. Clicking a
   * saved marker removes it via {@link onSavedPointRemove}.
   */
  savedPoints?: Array<{ id: string; lat: number; lng: number; color: string }>
  /** Removes a saved point when its marker is clicked. */
  onSavedPointRemove?: (id: string) => void
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
  savedPoints = [],
  onSavedPointRemove,
  onMapPointSelect,
}: Readonly<ActivityRouteMapProps>) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null)
  const savedMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  // Keep the latest remove handler in a ref so marker click listeners (bound
  // once per marker) always call the current callback without re-binding.
  const onSavedPointRemoveRef = useRef(onSavedPointRemove)
  useEffect(() => {
    onSavedPointRemoveRef.current = onSavedPointRemove
  }, [onSavedPointRemove])

  useEffect(() => {
    if (!mapRef.current || trackPoints.length === 0) return

    // The saved-markers map is a stable ref object; capture it so the cleanup
    // closure doesn't read a possibly-changed ref value at teardown time.
    const savedMarkers = savedMarkersRef.current

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
    const last = trackPoints.at(-1)
    if (!last) return
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
      savedMarkers.clear()
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

  // Keep the saved-point markers in sync with the saved set. Each marker is
  // color-coded and clickable to remove its point; the map stays put so saving
  // points never re-centers the view.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const markers = savedMarkersRef.current
    const nextIds = new Set(savedPoints.map((p) => p.id))

    // Drop markers whose points are no longer saved.
    for (const [id, marker] of markers) {
      if (!nextIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }

    // Add or update markers for the current saved points.
    for (const p of savedPoints) {
      const existing = markers.get(p.id)
      if (existing) {
        existing.setLatLng([p.lat, p.lng])
        existing.setStyle({ color: p.color, fillColor: p.color })
      } else {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: p.color,
          weight: 3,
          fillColor: p.color,
          fillOpacity: 0.9,
          className: 'activity-saved-marker',
        })
          .bindTooltip('Saved point — click to remove', {
            direction: 'top',
            offset: [0, -8],
          })
          .addTo(map)
        marker.on('click', (event: L.LeafletMouseEvent) => {
          // Stop the map 'click' handler from saving a new point on top.
          L.DomEvent.stopPropagation(event)
          onSavedPointRemoveRef.current?.(p.id)
        })
        markers.set(p.id, marker)
      }
    }
  }, [savedPoints])

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
            <span>Slow</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
            <span>Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
            <span>Sprint</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGarminChartDataQuery } from '@/__generated__/graphql'
import { getSegmentRoutePoints } from './segmentRoute'

interface SegmentMiniMapProps {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
  label: string
  sourceActivityId?: string | null
}

/**
 * Compact, non-interactive OpenStreetMap preview for a saved segment shown in
 * the segments list. Recovers the real route geometry from the source
 * activity's GPS track (snapped to the segment start/end) and draws it as a
 * blue polyline, mirroring {@link SegmentStartEndMap} on the detail page. Falls
 * back to a dashed straight line only when the source track is unavailable.
 */
export function SegmentMiniMap({
  startLat,
  startLon,
  endLat,
  endLon,
  label,
  sourceActivityId,
}: SegmentMiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const { data: chartData } = useGarminChartDataQuery({
    variables: { activity_id: sourceActivityId ?? '' },
    skip: !sourceActivityId,
  })

  const routePoints = useMemo(
    () =>
      getSegmentRoutePoints(
        chartData?.garminChartData ?? [],
        { lat: startLat, lon: startLon },
        { lat: endLat, lon: endLon },
      ),
    [chartData?.garminChartData, startLat, startLon, endLat, endLon],
  )

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapRef.current, {
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

    const routeLatLngs = routePoints.map(
      (point) => [point.latitude, point.longitude] as L.LatLngTuple,
    )
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
  }, [startLat, startLon, endLat, endLon, routePoints])

  return (
    <div
      ref={mapRef}
      aria-label={`${label} segment map`}
      role="img"
      data-testid="segment-mini-map"
      className="h-24 w-28 shrink-0 overflow-hidden rounded-md border border-border/70 sm:h-28 sm:w-32"
    />
  )
}

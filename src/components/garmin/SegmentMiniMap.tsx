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
  sourceActivityId?: string | null
  label: string
}

interface MiniMapPoint {
  latitude: number
  longitude: number
}

const MAX_PREVIEW_POINTS = 28

function simplifyPreviewPoints<T extends MiniMapPoint>(
  points: readonly T[],
): MiniMapPoint[] {
  if (points.length <= MAX_PREVIEW_POINTS) return [...points]

  const step = (points.length - 1) / (MAX_PREVIEW_POINTS - 1)
  return Array.from({ length: MAX_PREVIEW_POINTS }, (_, index) => {
    const sourceIndex =
      index === MAX_PREVIEW_POINTS - 1
        ? points.length - 1
        : Math.round(index * step)

    return {
      latitude: points[sourceIndex].latitude,
      longitude: points[sourceIndex].longitude,
    }
  })
}

export function SegmentMiniMap({
  startLat,
  startLon,
  endLat,
  endLon,
  sourceActivityId,
  label,
}: SegmentMiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const { data: sourceTrackData } = useGarminChartDataQuery({
    variables: { activity_id: sourceActivityId ?? '' },
    skip: !sourceActivityId,
  })

  const previewPoints = useMemo(() => {
    const routePoints = getSegmentRoutePoints(
      sourceTrackData?.garminChartData ?? [],
      { lat: startLat, lon: startLon },
      { lat: endLat, lon: endLon },
    )

    const points: MiniMapPoint[] =
      routePoints.length >= 2
        ? routePoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }))
        : [
            { latitude: startLat, longitude: startLon },
            { latitude: endLat, longitude: endLon },
          ]

    return simplifyPreviewPoints(points)
  }, [sourceTrackData?.garminChartData, startLat, startLon, endLat, endLon])

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapRef.current, {
      attributionControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      touchZoom: false,
      zoomControl: false,
    }).setView([startLat, startLon], 14)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    const latLngs = previewPoints.map(
      (point) => [point.latitude, point.longitude] as L.LatLngTuple,
    )

    L.polyline(latLngs, {
      color: '#2563eb',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 1,
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
  }, [startLat, startLon, endLat, endLon, previewPoints])

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

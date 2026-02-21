import { useEffect, useRef } from 'react'
import { useUnifiedGpsQuery } from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const { data, loading, error, refetch } = useUnifiedGpsQuery({
    variables: { limit: 500, order: 'desc' },
  })

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [40.736, -74.039],
      12,
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current)

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !data?.unifiedGps?.items) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    const points = data.unifiedGps.items ?? []

    if (points.length === 0) return

    const bounds = L.latLngBounds([])

    points.forEach((pt) => {
      const color = pt.source === 'owntracks' ? '#3b82f6' : '#ef4444'
      const marker = L.circleMarker([pt.latitude, pt.longitude], {
        radius: 3,
        fillColor: color,
        color: color,
        fillOpacity: 0.6,
        weight: 1,
      })

      marker.bindPopup(
        `<strong>${pt.source}</strong><br/>` +
          `${pt.identifier}<br/>` +
          `${new Date(pt.timestamp).toLocaleString()}`,
      )

      marker.addTo(map)
      bounds.extend([pt.latitude, pt.longitude])
    })

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [data])

  if (loading && !data) return <LoadingState message="Loading map data..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const total = data?.unifiedGps?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Map</h1>
          <p className="text-muted-foreground">
            Showing {Math.min(500, total).toLocaleString()} of{' '}
            {total.toLocaleString()} points
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-500">OwnTracks</Badge>
          <Badge className="bg-red-500">Garmin</Badge>
        </div>
      </div>

      <div
        ref={mapRef}
        className="h-[calc(100vh-14rem)] w-full rounded-lg border"
      />
    </div>
  )
}

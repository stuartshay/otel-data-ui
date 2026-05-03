import { useCallback, useEffect, useRef } from 'react'
import type { UnifiedGpsPoint } from '@/__generated__/graphql'
import { cn } from '@/lib/utils'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type UnifiedGpsMapPoint = Pick<
  UnifiedGpsPoint,
  'source' | 'identifier' | 'latitude' | 'longitude' | 'timestamp'
>

interface UnifiedGpsMapProps {
  points: UnifiedGpsMapPoint[]
  className?: string
  testId?: string
}

export function UnifiedGpsMap({
  points,
  className,
  testId = 'unified-map-container',
}: UnifiedGpsMapProps) {
  const mapInstanceRef = useRef<L.Map | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const mapContainerRef = useCallback((container: HTMLDivElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    if (!container) return

    const map = L.map(container).setView([40.736, -74.039], 12)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    let disposed = false
    const invalidate = () => {
      if (disposed) return
      map.invalidateSize()
    }

    let innerRafId = 0
    const outerRafId = requestAnimationFrame(() => {
      innerRafId = requestAnimationFrame(invalidate)
    })

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(invalidate)
      resizeObserver.observe(container)
    }

    cleanupRef.current = () => {
      disposed = true
      cancelAnimationFrame(outerRafId)
      cancelAnimationFrame(innerRafId)
      resizeObserver?.disconnect()
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    if (points.length === 0) return

    const bounds = L.latLngBounds([])

    points.forEach((point) => {
      const color = point.source === 'owntracks' ? '#3b82f6' : '#ef4444'
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 3,
        fillColor: color,
        color,
        fillOpacity: 0.6,
        weight: 1,
      })

      marker.bindPopup(
        `<strong>${point.source}</strong><br/>` +
          `${point.identifier}<br/>` +
          `${new Date(point.timestamp).toLocaleString()}`,
      )

      marker.addTo(map)
      bounds.extend([point.latitude, point.longitude])
    })

    if (bounds.isValid()) {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [points])

  return (
    <div
      ref={mapContainerRef}
      data-testid={testId}
      className={cn(
        'relative z-0 h-[calc(100vh-14rem)] w-full rounded-lg border',
        className,
      )}
    />
  )
}

import { useCallback, useEffect, useRef } from 'react'
import type { UnifiedGpsPoint } from '@/__generated__/graphql'
import { cn } from '@/lib/utils'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type UnifiedGpsMapPoint = Pick<
  UnifiedGpsPoint,
  'source' | 'identifier' | 'latitude' | 'longitude' | 'timestamp'
> &
  Partial<
    Pick<UnifiedGpsPoint, 'battery' | 'speed_kmh' | 'heart_rate' | 'accuracy'>
  >

export type ColorBy = 'source' | 'speed' | 'heart_rate' | 'battery'

interface UnifiedGpsMapProps {
  points: UnifiedGpsMapPoint[]
  className?: string
  testId?: string
  showTrack?: boolean
  colorBy?: ColorBy
  focusKey?: string
  onMarkerClick?: (point: UnifiedGpsMapPoint, key: string) => void
}

function pointKey(point: UnifiedGpsMapPoint, index: number): string {
  return `${point.source}-${point.identifier}-${point.timestamp}-${index}`
}

function clampRatio(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

function ratioToColor(ratio: number): string {
  // blue -> green -> yellow -> red gradient
  if (ratio < 0.25) return '#3b82f6'
  if (ratio < 0.5) return '#22c55e'
  if (ratio < 0.75) return '#eab308'
  return '#ef4444'
}

function extractMetric(
  point: UnifiedGpsMapPoint,
  colorBy: ColorBy,
): number | null {
  switch (colorBy) {
    case 'speed':
      return point.speed_kmh ?? null
    case 'heart_rate':
      return point.heart_rate ?? null
    case 'battery':
      return point.battery ?? null
    default:
      return null
  }
}

function colorForPoint(
  point: UnifiedGpsMapPoint,
  colorBy: ColorBy,
  min: number,
  max: number,
): string {
  if (colorBy === 'source') {
    return point.source === 'owntracks' ? '#3b82f6' : '#ef4444'
  }

  const value = extractMetric(point, colorBy)
  if (value == null) return '#9ca3af' // neutral gray for missing data

  return ratioToColor(clampRatio(value, min, max))
}

function buildPopupContent(point: UnifiedGpsMapPoint): HTMLDivElement {
  // Build popup as DOM elements using textContent to avoid HTML injection
  // (identifiers may contain <, &, etc. when coming from device names).
  const container = document.createElement('div')
  container.className = 'unified-gps-popup'

  const source = document.createElement('strong')
  source.textContent = point.source
  container.appendChild(source)
  container.appendChild(document.createElement('br'))

  const identifier = document.createElement('span')
  identifier.textContent = point.identifier
  container.appendChild(identifier)
  container.appendChild(document.createElement('br'))

  const timestamp = document.createElement('span')
  timestamp.textContent = new Date(point.timestamp).toLocaleString()
  container.appendChild(timestamp)

  const details: string[] = []
  if (point.speed_kmh != null)
    details.push(`${point.speed_kmh.toFixed(1)} km/h`)
  if (point.heart_rate != null) details.push(`${point.heart_rate} bpm`)
  if (point.battery != null) details.push(`${point.battery}% battery`)

  if (details.length > 0) {
    container.appendChild(document.createElement('br'))
    const meta = document.createElement('span')
    meta.textContent = details.join(' · ')
    container.appendChild(meta)
  }

  return container
}

export function UnifiedGpsMap({
  points,
  className,
  testId = 'unified-map-container',
  showTrack = false,
  colorBy = 'source',
  focusKey,
  onMarkerClick,
}: UnifiedGpsMapProps) {
  const mapInstanceRef = useRef<L.Map | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const onMarkerClickRef = useRef(onMarkerClick)

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick
  }, [onMarkerClick])

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
      markersRef.current.clear()
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
      if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })
    markersRef.current.clear()

    if (points.length === 0) return

    // Compute min/max for color scaling when colorBy is not 'source'.
    let min = 0
    let max = 1
    if (colorBy !== 'source') {
      const values = points
        .map((p) => extractMetric(p, colorBy))
        .filter((v): v is number => v != null)
      if (values.length > 0) {
        min = Math.min(...values)
        max = Math.max(...values)
      }
    }

    const bounds = L.latLngBounds([])

    // Optionally draw a polyline per source (ordered by timestamp).
    if (showTrack) {
      const bySource = new Map<string, UnifiedGpsMapPoint[]>()
      for (const point of points) {
        const existing = bySource.get(point.source) ?? []
        existing.push(point)
        bySource.set(point.source, existing)
      }
      for (const [source, sourcePoints] of bySource.entries()) {
        const sorted = [...sourcePoints].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        const latlngs: L.LatLngTuple[] = sorted.map((p) => [
          p.latitude,
          p.longitude,
        ])
        const color = source === 'owntracks' ? '#3b82f6' : '#ef4444'
        L.polyline(latlngs, {
          color,
          weight: 2,
          opacity: 0.5,
        }).addTo(map)
      }
    }

    points.forEach((point, index) => {
      const color = colorForPoint(point, colorBy, min, max)
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 3,
        fillColor: color,
        color,
        fillOpacity: 0.6,
        weight: 1,
      })

      marker.bindPopup(buildPopupContent(point))

      const key = pointKey(point, index)
      marker.on('click', () => {
        onMarkerClickRef.current?.(point, key)
      })

      marker.addTo(map)
      markersRef.current.set(key, marker)
      bounds.extend([point.latitude, point.longitude])
    })

    if (bounds.isValid()) {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [points, showTrack, colorBy])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !focusKey) return

    const marker = markersRef.current.get(focusKey)
    if (!marker) return

    const latLng = marker.getLatLng()
    map.setView(latLng, Math.max(map.getZoom(), 15), { animate: true })
    marker.openPopup()
  }, [focusKey])

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

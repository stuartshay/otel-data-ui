import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import {
  useUnifiedGpsQuery,
  useLocationDateRangeQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { data: dateRangeData } = useLocationDateRangeQuery()
  const dataMinDate = dateRangeData?.locationDateRange?.min_date
    ? new Date(dateRangeData.locationDateRange.min_date)
    : undefined
  const dataMaxDate = dateRangeData?.locationDateRange?.max_date
    ? new Date(dateRangeData.locationDateRange.max_date)
    : new Date()

  // Clamp selectedDate into [dataMinDate, dataMaxDate] when date-range data loads
  const clampedDate = useMemo(() => {
    if (!dateRangeData) return selectedDate
    if (dataMaxDate && selectedDate > dataMaxDate) return dataMaxDate
    if (dataMinDate && selectedDate < dataMinDate) return dataMinDate
    return selectedDate
  }, [dateRangeData, selectedDate, dataMinDate, dataMaxDate])

  const dateFrom = format(clampedDate, 'yyyy-MM-dd')
  const dateTo = dateFrom

  const { data, loading, error, refetch } = useUnifiedGpsQuery({
    variables: {
      date_from: dateFrom,
      date_to: dateTo,
      limit: 5000,
      order: 'desc',
      exclude_stationary: true,
      deduplicate: true,
    },
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
    if (!map) return

    // Clear existing markers when date changes or data refreshes
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    if (!data?.unifiedGps?.items) return

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
  }, [data, clampedDate])

  if (loading && !data) return <LoadingState message="Loading map data..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const total = data?.unifiedGps?.total ?? 0
  const displayed = data?.unifiedGps?.items?.length ?? 0
  const isToday =
    format(clampedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Map</h1>
          <p className="text-muted-foreground">
            {format(clampedDate, 'MMMM d, yyyy')}
            {isToday ? ' (Today)' : ''} &middot; {displayed.toLocaleString()} of{' '}
            {total.toLocaleString()} points
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                setSelectedDate(today > dataMaxDate ? dataMaxDate : today)
              }}
            >
              Today
            </Button>
          )}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-1 h-4 w-4" />
                {format(clampedDate, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={clampedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setCalendarOpen(false)
                  }
                }}
                disabled={[
                  { after: dataMaxDate },
                  ...(dataMinDate ? [{ before: dataMinDate }] : []),
                ]}
                fromDate={dataMinDate}
                toDate={dataMaxDate}
                startMonth={dataMinDate}
                endMonth={dataMaxDate}
              />
            </PopoverContent>
          </Popover>
          <Badge className="bg-blue-500">OwnTracks</Badge>
          <Badge className="bg-red-500">Garmin</Badge>
        </div>
      </div>

      <div
        ref={mapRef}
        data-testid="unified-map-container"
        className="relative z-0 h-[calc(100vh-14rem)] w-full rounded-lg border"
      />
    </div>
  )
}

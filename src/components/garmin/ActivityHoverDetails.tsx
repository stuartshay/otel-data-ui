import { Card, CardContent } from '@/components/ui/card'
import type { ChartDataPoint } from './ActivityCharts'

interface ActivityHoverDetailsProps {
  point: ChartDataPoint | null
}

export function ActivityHoverDetails({ point }: ActivityHoverDetailsProps) {
  if (!point) {
    return (
      <Card data-testid="activity-hover-details">
        <CardContent className="py-3 text-xs text-muted-foreground">
          Hover the Elevation or Speed chart to see details for that point.
        </CardContent>
      </Card>
    )
  }

  const timeStr = new Date(point.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <Card data-testid="activity-hover-details">
      <CardContent className="py-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4 lg:grid-cols-5">
          <Field
            label="Elevation"
            value={
              point.elevation != null ? `${point.elevation.toFixed(1)} ft` : '—'
            }
          />
          <Field
            label="Speed"
            value={point.speed != null ? `${point.speed.toFixed(1)} mph` : '—'}
          />
          <Field
            label="Time"
            value={`${timeStr} (${point.time.toFixed(1)} min)`}
          />
          <Field
            label="Distance"
            value={
              point.distance != null
                ? `${point.distance.toFixed(2)} mi${
                    point.distanceKm != null
                      ? ` (${point.distanceKm.toFixed(2)} km)`
                      : ''
                  }`
                : '—'
            }
          />
          <Field
            label="Lat/Lon"
            value={
              point.latitude != null && point.longitude != null
                ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                : '—'
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

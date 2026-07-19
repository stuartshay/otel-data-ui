import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ChartDataPoint } from './ActivityChartData'
import {
  formatReverseGeocodedAddress,
  useReverseGeocodedAddress,
} from './useReverseGeocodedAddress'

interface ActivityHoverDetailsProps {
  point: ChartDataPoint | null
  /** Whether the displayed point is already in the saved set. */
  isSaved?: boolean
  /** Adds the displayed point to the saved set (or removes it if saved). */
  onToggleSave?: () => void
}

export function ActivityHoverDetails({
  point,
  isSaved = false,
  onToggleSave,
}: Readonly<ActivityHoverDetailsProps>) {
  const address = useReverseGeocodedAddress(point?.latitude, point?.longitude)

  if (!point) {
    return (
      <Card data-testid="activity-hover-details">
        <CardContent className="py-3 text-xs text-muted-foreground">
          Hover the Elevation or Speed chart, or click the map, to see details
          for that point.
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
        {onToggleSave && (
          <div className="mb-2 flex justify-end">
            <Button
              size="sm"
              variant={isSaved ? 'secondary' : 'outline'}
              onClick={onToggleSave}
              data-testid="activity-hover-toggle-save"
            >
              {isSaved ? 'Remove point' : 'Add point'}
            </Button>
          </div>
        )}
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
            label="Heart Rate"
            value={point.heartRate != null ? `${point.heartRate} bpm` : '—'}
          />
          <Field
            label="Heart Rate Zone"
            value={
              point.heartRateZone != null ? `Zone ${point.heartRateZone}` : '—'
            }
          />
          <Field
            label="Respiration Rate"
            value={
              point.respirationRate != null
                ? `${point.respirationRate} breaths/min`
                : '—'
            }
          />
          <Field
            label="Time"
            value={`${timeStr} (${point.time.toFixed(1)} min)`}
          />
          <Field label="Distance" value={formatHoverDistance(point)} />
          <Field
            label="Lat/Lon"
            value={
              point.latitude != null && point.longitude != null
                ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                : '—'
            }
          />
        </div>
        <div
          className="mt-2 border-t pt-2 text-xs"
          data-testid="activity-hover-address"
        >
          <span className="text-muted-foreground">Address</span>{' '}
          <span
            className="font-medium"
            data-testid="activity-hover-address-value"
          >
            {formatReverseGeocodedAddress(address)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Format the hover distance in miles, appending the km value when available.
function formatHoverDistance(point: ChartDataPoint): string {
  if (point.distance == null) return '—'
  const km =
    point.distanceKm != null ? ` (${point.distanceKm.toFixed(2)} km)` : ''
  return `${point.distance.toFixed(2)} mi${km}`
}

function Field({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

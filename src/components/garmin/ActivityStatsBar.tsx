import { Card, CardContent } from '@/components/ui/card'
import { kmToMi, kmhToMph, metersToFeet, formatDuration } from '@/lib/units'

interface ActivityStatsBarProps {
  distanceKm?: number | null
  durationSeconds?: number | null
  avgSpeedKmh?: number | null
  totalAscentM?: number | null
}

function StatItem({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <Card className="flex-1">
      <CardContent className="p-4 text-center">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
          {unit}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

export function ActivityStatsBar({
  distanceKm,
  durationSeconds,
  avgSpeedKmh,
  totalAscentM,
}: ActivityStatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatItem
        label="Distance"
        value={distanceKm != null ? kmToMi(distanceKm).toFixed(2) : '—'}
        unit="mi"
      />
      <StatItem
        label="Time"
        value={formatDuration(durationSeconds ?? null)}
        unit=""
      />
      <StatItem
        label="Avg Speed"
        value={avgSpeedKmh != null ? kmhToMph(avgSpeedKmh).toFixed(1) : '—'}
        unit="mph"
      />
      <StatItem
        label="Elevation Gain"
        value={
          totalAscentM != null ? metersToFeet(totalAscentM).toFixed(0) : '—'
        }
        unit="ft"
      />
    </div>
  )
}

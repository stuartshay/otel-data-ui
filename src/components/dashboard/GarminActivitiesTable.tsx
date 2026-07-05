import { Link } from 'react-router-dom'

import { formatDurationShort, kmToMi } from '@/lib/units'

export interface GarminActivityTableRow {
  activity_id: string
  sport: string
  distance_km?: number | null
  duration_seconds?: number | null
}

interface GarminActivitiesTableProps {
  activities: GarminActivityTableRow[]
  distanceUnit?: 'km' | 'mi'
  linkSport?: boolean
  onSportClick?: () => void
  rowTestId?: string
  sportLinkTestId?: string
}

function formatDistance(
  distanceKm: number | null | undefined,
  unit: 'km' | 'mi',
) {
  if (distanceKm == null) return '—'
  const value = unit === 'mi' ? kmToMi(distanceKm) : distanceKm
  return `${value.toFixed(2)} ${unit}`
}

export function GarminActivitiesTable({
  activities,
  distanceUnit = 'km',
  linkSport = false,
  onSportClick,
  rowTestId = 'garmin-activity-table-row',
  sportLinkTestId = 'garmin-activity-table-sport-link',
}: GarminActivitiesTableProps) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-popover">
        <tr className="border-b">
          <th className="px-3 py-1 text-left font-medium text-muted-foreground">
            Sport
          </th>
          <th className="px-2 py-1 text-right font-medium text-muted-foreground">
            Distance
          </th>
          <th className="px-3 py-1 text-right font-medium text-muted-foreground">
            Duration
          </th>
        </tr>
      </thead>
      <tbody>
        {activities.map((activity) => (
          <tr
            key={activity.activity_id}
            className="border-b last:border-b-0 hover:bg-muted/50"
            data-testid={rowTestId}
          >
            <td className="px-3 py-1">
              {linkSport ? (
                <Link
                  to={`/garmin/${activity.activity_id}`}
                  onClick={onSportClick}
                  className="font-medium capitalize text-primary hover:underline"
                  data-testid={sportLinkTestId}
                >
                  {activity.sport}
                </Link>
              ) : (
                <span className="font-medium capitalize">{activity.sport}</span>
              )}
            </td>
            <td className="px-2 py-1 text-right tabular-nums">
              {formatDistance(activity.distance_km, distanceUnit)}
            </td>
            <td className="px-3 py-1 text-right tabular-nums">
              {formatDurationShort(activity.duration_seconds)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

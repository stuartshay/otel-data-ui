import type { GarminActivityClimbsQuery } from '@/__generated__/graphql'
import type { ActivityChartTrackPoint } from '@/components/garmin/ActivityChartData'

type ActivityClimb = GarminActivityClimbsQuery['garminActivityClimbs'][number]

export interface GradeBucket {
  label: string
  color: string
  className: string
}

export const GRADE_BUCKETS: GradeBucket[] = [
  { label: '<3%', color: '#22c55e', className: 'bg-green-500' },
  { label: '3-6%', color: '#facc15', className: 'bg-yellow-400' },
  { label: '6-9%', color: '#f97316', className: 'bg-orange-500' },
  { label: '9-12%', color: '#ef4444', className: 'bg-red-500' },
  { label: '>12%', color: '#dc2626', className: 'bg-red-600' },
]

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function getGradeBucket(gradePercent: number): GradeBucket {
  if (gradePercent < 3) return GRADE_BUCKETS[0]
  if (gradePercent < 6) return GRADE_BUCKETS[1]
  if (gradePercent < 9) return GRADE_BUCKETS[2]
  if (gradePercent < 12) return GRADE_BUCKETS[3]
  return GRADE_BUCKETS[4]
}

export function getClimbSegmentPoints(
  climb: ActivityClimb,
  chartPoints: ActivityChartTrackPoint[],
): ActivityChartTrackPoint[] {
  const startTime = parseTime(climb.start_time)
  const endTime = parseTime(climb.end_time)
  if (startTime == null || endTime == null) return []

  return chartPoints.filter((point) => {
    const pointTime = parseTime(point.timestamp)
    return pointTime != null && pointTime >= startTime && pointTime <= endTime
  })
}

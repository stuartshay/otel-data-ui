import { TableCell } from '@/components/ui/table'
import { useGarminSegmentEffortSeriesQuery } from '@/__generated__/graphql'
import {
  formatHeartRate,
  formatSpeedMph,
  type SegmentEffort,
} from './segmentEfforts'
import { sampleAtFraction } from './segmentEffortSeries'

interface SegmentEffortLiveCellsProps {
  segmentId: number
  effort: SegmentEffort
  /**
   * Current playback/hover position as a 0..1 fraction of the segment, or
   * null when idle. The series is only fetched once a position is active.
   */
  activeFraction: number | null
  /** Only top-ranked rows fetch series data; disabled rows render em dashes. */
  enabled: boolean
}

/**
 * The two live-value cells ("Speed @ pt" / "HR @ pt") for one leaderboard row.
 * Owns the per-effort series query so each row loads lazily and caches
 * independently; an effort's window is immutable, so the series never needs
 * refetching.
 */
export function SegmentEffortLiveCells({
  segmentId,
  effort,
  activeFraction,
  enabled,
}: Readonly<SegmentEffortLiveCellsProps>) {
  const { data, loading } = useGarminSegmentEffortSeriesQuery({
    variables: {
      id: segmentId,
      activity_id: effort.activity_id,
      effort_start: effort.effort_start,
      effort_end: effort.effort_end,
    },
    skip: !enabled || activeFraction == null,
    fetchPolicy: 'cache-first',
  })

  const sample =
    activeFraction != null && data
      ? sampleAtFraction(data.garminSegmentEffortSeries.bins, activeFraction)
      : null

  if (activeFraction != null && enabled && loading) {
    return (
      <>
        <TableCell className="tabular-nums text-muted-foreground">…</TableCell>
        <TableCell className="tabular-nums text-muted-foreground">…</TableCell>
      </>
    )
  }

  return (
    <>
      <TableCell
        className="tabular-nums"
        data-testid="segment-effort-live-speed"
      >
        {sample ? formatSpeedMph(sample.speed_kmh) : '—'}
      </TableCell>
      <TableCell className="tabular-nums" data-testid="segment-effort-live-hr">
        {sample ? formatHeartRate(sample.heart_rate) : '—'}
      </TableCell>
    </>
  )
}

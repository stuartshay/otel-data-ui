import { TableCell } from '@/components/ui/table'
import { formatHeartRate, formatSpeedMph } from './segmentEfforts'
import {
  sampleAtFraction,
  type SegmentEffortSeriesBin,
} from './segmentEffortSeries'

interface SegmentEffortLiveCellsProps {
  /**
   * This effort's series bins from the batched leaderboard-level fetch, or
   * undefined while the batch is loading/hasn't been requested for this row.
   */
  bins: readonly SegmentEffortSeriesBin[] | undefined
  /**
   * Current playback/hover position as a 0..1 fraction of the segment, or
   * null when idle.
   */
  activeFraction: number | null
  /** Whether this row is within the batch's fetch window (top N rows). */
  enabled: boolean
  /** Whether the batch request covering this row is in flight. */
  loading: boolean
}

/**
 * The two live-value cells ("Speed @ pt" / "HR @ pt") for one leaderboard
 * row. Purely presentational: the leaderboard fetches one batched series
 * request for all visible rows and passes each row its own slice, so
 * re-sorting or scrubbing playback never fans out into per-row requests.
 */
export function SegmentEffortLiveCells({
  bins,
  activeFraction,
  enabled,
  loading,
}: Readonly<SegmentEffortLiveCellsProps>) {
  const sample =
    activeFraction != null && bins
      ? sampleAtFraction(bins, activeFraction)
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

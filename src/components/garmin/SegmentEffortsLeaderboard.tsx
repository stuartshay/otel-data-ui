import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { useGarminSegmentEffortSeriesBatchQuery } from '@/__generated__/graphql'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { SegmentEffortLiveCells } from './SegmentEffortLiveCells'
import type { SegmentEffortSeriesBin } from './segmentEffortSeries'
import {
  EFFORT_SORTS,
  bestEffortKey,
  effortKey,
  formatDistanceMi,
  formatEffortDate,
  formatElapsed,
  formatHeartRate,
  formatSpeedMph,
  sortEfforts,
  type EffortSort,
  type SegmentEffort,
} from './segmentEfforts'

/**
 * Only this many top rows (under the current sort) fetch live series data.
 * Matches the batch endpoint's request cap (SegmentEffortSeriesBatchRequest,
 * otel-data-api's app/models/garmin.py) -- raising this further requires
 * raising that limit too. Combined with the segment page's date-range
 * filter, this keeps request fan-out bounded on segments with hundreds of
 * efforts while covering the rows users actually watch.
 */
const LIVE_ROW_LIMIT = 50

interface SegmentEffortsLeaderboardProps {
  efforts: SegmentEffort[]
  /** Saved segment id, required for the batched live series query. */
  segmentId?: number
  /**
   * Current playback/hover position as a 0..1 fraction of the segment, or
   * null when idle. When set, top rows show speed/HR at that position.
   */
  activeFraction?: number | null
}

export function SegmentEffortsLeaderboard({
  efforts,
  segmentId,
  activeFraction = null,
}: Readonly<SegmentEffortsLeaderboardProps>) {
  const [sort, setSort] = useState<EffortSort>('date')

  const bestKey = useMemo(() => bestEffortKey(efforts), [efforts])
  const sorted = useMemo(() => sortEfforts(efforts, sort), [efforts, sort])
  const liveRows = useMemo(() => sorted.slice(0, LIVE_ROW_LIMIT), [sorted])

  // One batched request covers every live row, however the leaderboard is
  // currently sorted, instead of a request per row. Re-sorting changes which
  // efforts are in the batch and triggers a refetch; scrubbing playback/hover just
  // re-samples the already-fetched bins client-side.
  const { data: batchData, loading: batchLoading } =
    useGarminSegmentEffortSeriesBatchQuery({
      variables: {
        id: segmentId ?? 0,
        efforts: liveRows.map((effort) => ({
          activity_id: effort.activity_id,
          effort_start: effort.effort_start,
          effort_end: effort.effort_end,
        })),
      },
      skip:
        segmentId == null || activeFraction == null || liveRows.length === 0,
      fetchPolicy: 'cache-first',
    })
  const binsByKey = useMemo(() => {
    const map = new Map<string, readonly SegmentEffortSeriesBin[]>()
    const items = batchData?.garminSegmentEffortSeriesBatch.items ?? []
    liveRows.forEach((effort, index) => {
      const item = items[index]
      if (item) map.set(effortKey(effort), item.bins)
    })
    return map
  }, [batchData, liveRows])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by</span>
        <div className="flex flex-wrap gap-1">
          {EFFORT_SORTS.map((s) => (
            <Button
              key={s.key}
              variant={sort === s.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Avg speed</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Avg HR</TableHead>
              <TableHead>Max HR</TableHead>
              <TableHead>Speed @ pt</TableHead>
              <TableHead>HR @ pt</TableHead>
              <TableHead className="text-right">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((effort, index) => {
              const isPR = effortKey(effort) === bestKey
              return (
                <TableRow
                  key={effortKey(effort)}
                  className={cn(isPR && 'bg-primary/5')}
                  data-testid="segment-effort-row"
                >
                  <TableCell className="font-medium tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {formatEffortDate(
                      effort.activity_start_time ?? effort.effort_start,
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      {formatElapsed(effort.elapsed_seconds)}
                      {isPR && (
                        <Badge
                          variant="secondary"
                          className="gap-1"
                          data-testid="segment-effort-pr"
                        >
                          <Trophy className="h-3 w-3" />
                          PR
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatSpeedMph(effort.avg_speed_kmh)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDistanceMi(effort.distance_km)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatHeartRate(effort.avg_heart_rate)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatHeartRate(effort.max_heart_rate)}
                  </TableCell>
                  <SegmentEffortLiveCells
                    bins={binsByKey.get(effortKey(effort))}
                    activeFraction={activeFraction}
                    enabled={index < LIVE_ROW_LIMIT}
                    loading={batchLoading}
                  />
                  <TableCell className="text-right">
                    <Link
                      to={`/garmin/${effort.activity_id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

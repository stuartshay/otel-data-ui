import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
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

interface SegmentEffortsLeaderboardProps {
  efforts: SegmentEffort[]
}

export function SegmentEffortsLeaderboard({
  efforts,
}: Readonly<SegmentEffortsLeaderboardProps>) {
  const [sort, setSort] = useState<EffortSort>('date')

  const bestKey = useMemo(() => bestEffortKey(efforts), [efforts])
  const sorted = useMemo(() => sortEfforts(efforts, sort), [efforts, sort])

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

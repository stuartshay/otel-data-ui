import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDuration, metersToFeet } from '@/lib/units'
import { cn } from '@/lib/utils'
import { buildLapSummary, type ActivityLap } from './ActivityLapsTable.helpers'

const METERS_PER_MILE = 1609.344
const MPS_TO_MPH = 2.2369362921

interface ActivityLapsTableProps {
  laps: ActivityLap[]
}

function formatDistanceMeters(value: number | null | undefined): string {
  if (value == null) return '—'
  return (value / METERS_PER_MILE).toFixed(2)
}

function formatSpeedMps(value: number | null | undefined): string {
  if (value == null) return '—'
  return (value * MPS_TO_MPH).toFixed(1)
}

function formatHeartRate(value: number | null | undefined): string {
  return value != null && value > 0 ? String(Math.round(value)) : '—'
}

function formatAscent(value: number | null | undefined): string {
  if (value == null) return '—'
  return String(Math.round(metersToFeet(value)))
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value)}%`
}

function surfacePercent(
  surfaceMeters: number | null | undefined,
  distanceMeters: number | null | undefined,
): number | null {
  if (surfaceMeters == null || distanceMeters == null || distanceMeters <= 0) {
    return null
  }
  return (surfaceMeters / distanceMeters) * 100
}

export function ActivityLapsTable({ laps }: ActivityLapsTableProps) {
  const [selectedLapIndex, setSelectedLapIndex] = useState<number | null>(null)
  const orderedLaps = useMemo(
    () => [...laps].sort((a, b) => a.lap_index - b.lap_index),
    [laps],
  )
  const rows = useMemo(() => {
    return orderedLaps.reduce<
      Array<{ lap: ActivityLap; cumulativeSeconds: number }>
    >((acc, lap) => {
      const cumulativeSeconds =
        (acc.at(-1)?.cumulativeSeconds ?? 0) + (lap.duration_seconds ?? 0)
      acc.push({ lap, cumulativeSeconds })
      return acc
    }, [])
  }, [orderedLaps])
  const summary = useMemo(() => buildLapSummary(orderedLaps), [orderedLaps])

  if (orderedLaps.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No laps found for this activity.
      </div>
    )
  }

  return (
    <Card data-testid="activity-laps-table">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[920px] text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Laps</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Cumulative Time</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead className="text-right">Paved</TableHead>
                <TableHead className="text-right">Unpaved</TableHead>
                <TableHead className="text-right">Avg Speed</TableHead>
                <TableHead className="text-right">Avg HR</TableHead>
                <TableHead className="text-right">Max HR</TableHead>
                <TableHead className="text-right">Total Ascent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ lap, cumulativeSeconds }) => {
                const selected = selectedLapIndex === lap.lap_index

                return (
                  <TableRow
                    key={lap.id}
                    data-selected={selected}
                    data-testid={`lap-row-${lap.lap_index}`}
                    className={cn(
                      'cursor-pointer',
                      selected
                        ? 'bg-blue-100 hover:bg-blue-100 dark:bg-blue-950/40'
                        : '',
                    )}
                    onClick={() => setSelectedLapIndex(lap.lap_index)}
                  >
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        aria-pressed={selected}
                        className="rounded-sm px-1 text-left font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedLapIndex(lap.lap_index)
                        }}
                      >
                        {lap.lap_index}
                      </button>
                    </TableCell>
                    <TableCell>
                      {formatDuration(lap.duration_seconds ?? null)}
                    </TableCell>
                    <TableCell>{formatDuration(cumulativeSeconds)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDistanceMeters(lap.distance_meters)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(
                        surfacePercent(
                          lap.paved_distance_meters,
                          lap.distance_meters,
                        ),
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(
                        surfacePercent(
                          lap.unpaved_distance_meters,
                          lap.distance_meters,
                        ),
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatSpeedMps(lap.avg_speed_mps)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatHeartRate(lap.avg_heart_rate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatHeartRate(lap.max_heart_rate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAscent(lap.total_ascent_meters)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <tfoot>
              <tr className="border-t font-semibold">
                <td className="p-2">Summary</td>
                <td className="p-2">
                  {formatDuration(summary.durationSeconds)}
                </td>
                <td className="p-2">
                  {formatDuration(summary.durationSeconds)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatDistanceMeters(summary.distanceMeters)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatPercent(summary.pavedPercent)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatPercent(summary.unpavedPercent)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatSpeedMps(summary.avgSpeedMps)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatHeartRate(summary.avgHeartRate)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatHeartRate(summary.maxHeartRate)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatAscent(summary.totalAscentMeters)}
                </td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

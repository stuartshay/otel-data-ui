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
import type { ActivityChartTrackPoint } from './ActivityChartData'
import { toRoutePoints } from './ActivityLapRoutePoints'
import { ActivityRouteMap } from './ActivityRouteMap'
import { SaveSegmentPopover } from './SaveSegmentPopover'
import {
  buildLapSummary,
  getLapSegmentPoints,
  getLapTimeWindow,
  type ActivityLap,
} from './ActivityLapsTable.helpers'

const METERS_PER_MILE = 1609.344
const MPS_TO_MPH = 2.2369362921

interface ActivityLapsTableProps {
  laps: ActivityLap[]
  chartPoints?: ActivityChartTrackPoint[]
  sport?: string | null
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

function formatFeet(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(metersToFeet(value))} ft`
}

function formatMiles(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${(value / METERS_PER_MILE).toFixed(2)} mi`
}

function formatMph(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${(value * MPS_TO_MPH).toFixed(1)} mph`
}

function formatCalories(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value)} kcal`
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
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

function LapStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function ActivityLapDetailsPanel({
  lap,
  laps,
  chartPoints,
  sport,
}: {
  lap: ActivityLap
  laps: ActivityLap[]
  chartPoints: ActivityChartTrackPoint[]
  sport?: string | null
}) {
  const segmentPoints = useMemo(
    () => getLapSegmentPoints(lap, chartPoints, laps),
    [lap, chartPoints, laps],
  )
  const routePoints = useMemo(
    () => toRoutePoints(segmentPoints),
    [segmentPoints],
  )
  const timeWindow = useMemo(() => getLapTimeWindow(lap), [lap])

  const canSaveSegment = routePoints.length >= 2
  const segmentStart = canSaveSegment ? routePoints[0] : null
  const segmentEnd = canSaveSegment ? routePoints[routePoints.length - 1] : null

  return (
    <div className="space-y-4" data-testid="activity-lap-details-panel">
      <Card>
        <CardContent className="space-y-5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Lap {lap.lap_index}</h3>
              <p className="text-sm text-muted-foreground">
                {formatTimestamp(lap.start_time)} –{' '}
                {formatTimestamp(
                  timeWindow
                    ? new Date(timeWindow.endTime).toISOString()
                    : null,
                )}
              </p>
            </div>
            {segmentStart && segmentEnd && (
              <SaveSegmentPopover
                activityId={lap.activity_id}
                lapIndex={lap.lap_index}
                sport={sport}
                startLatitude={segmentStart.latitude}
                startLongitude={segmentStart.longitude}
                endLatitude={segmentEnd.latitude}
                endLongitude={segmentEnd.longitude}
                distanceMeters={lap.distance_meters}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LapStat
              label="Timer Time"
              value={formatDuration(lap.duration_seconds ?? null)}
            />
            <LapStat
              label="Elapsed Time"
              value={formatDuration(lap.elapsed_duration_seconds ?? null)}
            />
            <LapStat
              label="Moving Time"
              value={formatDuration(lap.moving_duration_seconds ?? null)}
            />
            <LapStat
              label="Distance"
              value={formatMiles(lap.distance_meters)}
            />
            <LapStat
              label="Paved"
              value={formatPercent(
                surfacePercent(lap.paved_distance_meters, lap.distance_meters),
              )}
            />
            <LapStat
              label="Unpaved"
              value={formatPercent(
                surfacePercent(
                  lap.unpaved_distance_meters,
                  lap.distance_meters,
                ),
              )}
            />
            <LapStat label="Avg Speed" value={formatMph(lap.avg_speed_mps)} />
            <LapStat
              label="Avg HR"
              value={formatHeartRate(lap.avg_heart_rate)}
            />
            <LapStat
              label="Max HR"
              value={formatHeartRate(lap.max_heart_rate)}
            />
            <LapStat
              label="Ascent"
              value={formatFeet(lap.total_ascent_meters)}
            />
            <LapStat
              label="Descent"
              value={formatFeet(lap.total_descent_meters)}
            />
            <LapStat label="Calories" value={formatCalories(lap.calories)} />
          </div>
        </CardContent>
      </Card>

      {routePoints.length > 0 ? (
        <ActivityRouteMap trackPoints={routePoints} />
      ) : (
        <div
          className="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
          data-testid="activity-lap-route-empty"
        >
          No route points available for this lap.
        </div>
      )}
    </div>
  )
}

export function ActivityLapsTable({
  laps,
  chartPoints = [],
  sport,
}: ActivityLapsTableProps) {
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
  const selectedLap =
    selectedLapIndex == null
      ? null
      : (orderedLaps.find((lap) => lap.lap_index === selectedLapIndex) ?? null)

  if (orderedLaps.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No laps found for this activity.
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
      {selectedLap && (
        <ActivityLapDetailsPanel
          lap={selectedLap}
          laps={orderedLaps}
          chartPoints={chartPoints}
          sport={sport}
        />
      )}
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/units'
import type { SavedPoint } from './ActivityChartData'
import { SaveSegmentPopover } from './SaveSegmentPopover'
import {
  buildSavedSegments,
  formatPaceMinPerMi,
  type SavedSegment,
} from './segmentAnalysis'

const METERS_PER_MILE = 1609.344

interface SegmentAnalysisProps {
  points: SavedPoint[]
  activityId?: string | null
  sport?: string | null
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function canSaveSegment(segment: SavedSegment): boolean {
  return (
    isFiniteNumber(segment.from.latitude) &&
    isFiniteNumber(segment.from.longitude) &&
    isFiniteNumber(segment.to.latitude) &&
    isFiniteNumber(segment.to.longitude)
  )
}

function formatDistance(segment: SavedSegment): string {
  if (segment.distanceMi == null) return '—'
  const suffix = segment.distanceIsStraightLine ? ' (direct)' : ''
  return `${segment.distanceMi.toFixed(2)} mi${suffix}`
}

function formatSpeed(value: number | null): string {
  return value != null ? `${value.toFixed(1)} mph` : '—'
}

function formatElevation(value: number | null): string {
  if (value == null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(0)} ft`
}

function formatGrade(value: number | null): string {
  if (value == null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Shows distance and performance metrics for the stretch of activity between
 * each pair of consecutive saved points. Renders nothing until at least two
 * points are saved (i.e. there is a segment to analyze).
 */
export function SegmentAnalysis({
  points,
  activityId,
  sport,
}: Readonly<SegmentAnalysisProps>) {
  const segments = buildSavedSegments(points)
  if (segments.length === 0) return null

  return (
    <Card data-testid="segment-analysis">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Segment Analysis ({segments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-3 font-medium">Segment</th>
              <th className="py-1 pr-3 font-medium">Distance</th>
              <th className="py-1 pr-3 font-medium">Duration</th>
              <th className="py-1 pr-3 font-medium">Avg Speed</th>
              <th className="py-1 pr-3 font-medium">Pace</th>
              <th className="py-1 pr-3 font-medium">Elev Δ</th>
              <th className="py-1 pr-3 font-medium">Grade</th>
              <th className="py-1 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => (
              <tr
                key={s.id}
                className="border-t border-border"
                data-testid="segment-row"
              >
                <td className="py-1 pr-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      #{s.index}→{s.index + 1}
                    </span>
                  </span>
                </td>
                <td className="py-1 pr-3 tabular-nums">{formatDistance(s)}</td>
                <td className="py-1 pr-3 tabular-nums">
                  {formatDuration(s.durationSeconds)}
                </td>
                <td className="py-1 pr-3 tabular-nums">
                  {formatSpeed(s.avgSpeedMph)}
                </td>
                <td className="py-1 pr-3 tabular-nums">
                  {formatPaceMinPerMi(s.paceMinPerMi)}
                </td>
                <td className="py-1 pr-3 tabular-nums">
                  {formatElevation(s.elevationChangeFt)}
                </td>
                <td className="py-1 pr-3 tabular-nums">
                  {formatGrade(s.gradePercent)}
                </td>
                <td className="py-1">
                  {canSaveSegment(s) && (
                    <SaveSegmentPopover
                      activityId={activityId}
                      sport={sport}
                      sourceLabel="range"
                      startLatitude={s.from.latitude as number}
                      startLongitude={s.from.longitude as number}
                      endLatitude={s.to.latitude as number}
                      endLongitude={s.to.longitude as number}
                      distanceMeters={
                        s.distanceMi != null
                          ? s.distanceMi * METERS_PER_MILE
                          : null
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

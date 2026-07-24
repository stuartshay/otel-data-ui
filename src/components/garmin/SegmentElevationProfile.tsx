import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ActivityChartTrackPoint } from '@/components/garmin/ActivityChartData'
import { Button } from '@/components/ui/button'
import {
  buildSegmentElevationProfile,
  type SegmentElevationChartPoint,
  type SegmentElevationProfileData,
} from './SegmentElevationProfile.helpers'

/** Total wall-clock time to animate from start to finish, in milliseconds. */
const PLAYBACK_DURATION_MS = 6000

type TooltipState =
  Readonly<{ activeTooltipIndex?: number | string | null }> | undefined

function pointFromTooltipState(
  state: TooltipState,
  points: readonly SegmentElevationChartPoint[],
): SegmentElevationChartPoint | null {
  const rawIndex = state?.activeTooltipIndex
  const index =
    typeof rawIndex === 'number'
      ? rawIndex
      : typeof rawIndex === 'string' && rawIndex.trim() !== ''
        ? Number(rawIndex)
        : Number.NaN

  return Number.isInteger(index) && points[index] ? points[index] : null
}

function isSameProfilePoint(
  previous: SegmentElevationChartPoint | null,
  next: SegmentElevationChartPoint | null,
): boolean {
  if (previous === next) return true
  if (!previous || !next) return false

  return (
    previous.distanceMiles === next.distanceMiles &&
    previous.elevationFeet === next.elevationFeet &&
    previous.latitude === next.latitude &&
    previous.longitude === next.longitude
  )
}

function formatFeet(value: number): string {
  return `${Math.round(value).toLocaleString()} ft`
}

function ElevationStat({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

export function SegmentElevationProfile({
  routePoints,
  precomputedProfile,
  loading = false,
  onActivePointChange,
}: Readonly<{
  routePoints: readonly ActivityChartTrackPoint[]
  /** Reuse a profile already built by the parent when it also needs the data. */
  precomputedProfile?: SegmentElevationProfileData | null
  loading?: boolean
  onActivePointChange?: (point: SegmentElevationChartPoint | null) => void
}>) {
  const pendingActivePointRef = useRef<SegmentElevationChartPoint | null>(null)
  const lastActivePointRef = useRef<SegmentElevationChartPoint | null>(null)
  const activePointFrameRef = useRef<number | null>(null)

  const queueActivePointChange = useCallback(
    (point: SegmentElevationChartPoint | null) => {
      if (!onActivePointChange) return

      pendingActivePointRef.current = point
      if (activePointFrameRef.current != null) return

      activePointFrameRef.current = window.requestAnimationFrame(() => {
        activePointFrameRef.current = null
        const nextPoint = pendingActivePointRef.current
        if (isSameProfilePoint(lastActivePointRef.current, nextPoint)) {
          return
        }
        lastActivePointRef.current = nextPoint
        onActivePointChange(nextPoint)
      })
    },
    [onActivePointChange],
  )

  useEffect(
    () => () => {
      if (activePointFrameRef.current != null) {
        window.cancelAnimationFrame(activePointFrameRef.current)
      }
    },
    [],
  )

  const profile = useMemo(
    () =>
      precomputedProfile === undefined
        ? buildSegmentElevationProfile(routePoints)
        : precomputedProfile,
    [precomputedProfile, routePoints],
  )

  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  // Whether the animation loop is actively advancing. Distinct from
  // playingIndex != null, which stays set while paused so the marker and
  // Speed/HR cells keep showing the paused position instead of resetting.
  const [isAnimating, setIsAnimating] = useState(false)
  // The index playback was paused at, so Play resumes from there instead of
  // always restarting at the beginning. Cleared whenever playback runs to
  // completion or the route changes, so a finished or freshly-loaded route
  // starts over from index 0.
  const [pausedIndex, setPausedIndex] = useState<number | null>(null)
  const playbackFrameRef = useRef<number | null>(null)

  // True stop/reset: cancels the animation frame and clears the active point
  // entirely. Used when the route changes or the chart is hovered (which
  // takes over the active-point display), not by the Pause button itself --
  // that calls pausePlayback below so position is kept.
  const stopPlayback = useCallback(() => {
    if (playbackFrameRef.current != null) {
      window.cancelAnimationFrame(playbackFrameRef.current)
      playbackFrameRef.current = null
    }
    setIsAnimating(false)
    setPlayingIndex(null)
    setPausedIndex(null)
    queueActivePointChange(null)
  }, [queueActivePointChange])

  // Pauses in place: cancels the animation frame but keeps the current
  // position (both the displayed active point and pausedIndex), so a
  // subsequent Play resumes from here instead of restarting.
  const pausePlayback = useCallback(() => {
    if (playbackFrameRef.current != null) {
      window.cancelAnimationFrame(playbackFrameRef.current)
      playbackFrameRef.current = null
    }
    setIsAnimating(false)
    setPausedIndex(playingIndex)
  }, [playingIndex])

  const startPlayback = useCallback(() => {
    if (!profile || profile.points.length < 2) return

    const totalPoints = profile.points.length
    const startIndex = pausedIndex ?? 0
    // Back-date the start time so elapsed/PLAYBACK_DURATION_MS already
    // reflects startIndex's progress -- resuming partway through plays only
    // the remaining distance, over its proportional share of the full
    // duration, rather than restarting the full 6s from the resume point.
    const startTime =
      performance.now() -
      (startIndex / (totalPoints - 1)) * PLAYBACK_DURATION_MS
    setIsAnimating(true)
    setPausedIndex(null)

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / PLAYBACK_DURATION_MS)
      const index = Math.min(
        totalPoints - 1,
        Math.floor(progress * (totalPoints - 1)),
      )

      setPlayingIndex(index)
      queueActivePointChange(profile.points[index])

      if (progress >= 1) {
        playbackFrameRef.current = null
        setIsAnimating(false)
        setPlayingIndex(null)
        return
      }
      playbackFrameRef.current = window.requestAnimationFrame(step)
    }

    playbackFrameRef.current = window.requestAnimationFrame(step)
  }, [profile, pausedIndex, queueActivePointChange])

  const togglePlayback = useCallback(() => {
    if (isAnimating) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }, [isAnimating, pausePlayback, startPlayback])

  // Stop any in-flight playback when the underlying route changes (e.g. a
  // different segment is viewed), so the button doesn't get stuck showing
  // Pause with no animation running, and a new route always starts fresh.
  useEffect(() => {
    return () => {
      if (playbackFrameRef.current != null) {
        window.cancelAnimationFrame(playbackFrameRef.current)
        playbackFrameRef.current = null
      }
      setIsAnimating(false)
      setPlayingIndex(null)
      setPausedIndex(null)
    }
  }, [routePoints])

  if (loading) {
    return (
      <div
        role="status"
        className="rounded-md border px-4 py-5 text-sm text-muted-foreground"
      >
        Loading elevation profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div
        data-testid="segment-elevation-profile-empty"
        className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground"
      >
        Elevation profile unavailable for this segment.
      </div>
    )
  }

  const hasPlaybackPosition = playingIndex != null
  const playingPoint = hasPlaybackPosition ? profile.points[playingIndex] : null
  const accessibleSummary = `Elevation profile from ${formatFeet(profile.startElevationFeet)} at the segment start to ${formatFeet(profile.finishElevationFeet)} at the finish, with ${formatFeet(profile.elevationGainFeet)} of elevation gain over ${profile.distanceMiles.toFixed(2)} miles.`

  return (
    <section
      data-testid="segment-elevation-profile"
      className="rounded-md border bg-muted/20 p-4"
      aria-labelledby="segment-elevation-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div>
            <h3
              id="segment-elevation-heading"
              className="text-sm font-semibold"
            >
              Elevation
            </h3>
            <p className="text-xs text-muted-foreground">Start to finish</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="segment-elevation-play-button"
            aria-label={
              isAnimating ? 'Pause route playback' : 'Play route playback'
            }
            onClick={togglePlayback}
            disabled={profile.points.length < 2}
          >
            {isAnimating ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <dl className="grid grid-cols-3 gap-x-5">
          <ElevationStat
            label="Start"
            value={formatFeet(profile.startElevationFeet)}
          />
          <ElevationStat
            label="Finish"
            value={formatFeet(profile.finishElevationFeet)}
          />
          <ElevationStat
            label="Gain"
            value={formatFeet(profile.elevationGainFeet)}
          />
        </dl>
      </div>

      <div
        role="img"
        aria-label={accessibleSummary}
        className="mt-3 h-44 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={profile.points}
            margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
            onMouseMove={(state: {
              activeTooltipIndex?: number | string | null
            }) => {
              if (hasPlaybackPosition) stopPlayback()
              const point = pointFromTooltipState(state, profile.points)
              if (point) queueActivePointChange(point)
            }}
            onMouseLeave={() => {
              if (hasPlaybackPosition) return
              queueActivePointChange(null)
            }}
          >
            <defs>
              <linearGradient
                id="segmentElevationFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="distanceMiles"
              type="number"
              domain={[0, profile.distanceMiles]}
              tickFormatter={(value: number) => value.toFixed(2)}
              label={{ value: 'Distance (mi)', position: 'insideBottomRight' }}
              className="text-xs"
            />
            <YAxis
              domain={profile.yDomain}
              tickFormatter={(value: number) => Math.round(value).toString()}
              width={46}
              unit=" ft"
              className="text-xs"
            />
            <Tooltip
              formatter={(value) => [formatFeet(Number(value)), 'Elevation']}
              labelFormatter={(value) => `${Number(value).toFixed(2)} mi`}
            />
            <Area
              type="monotone"
              dataKey="elevationFeet"
              stroke="#16a34a"
              strokeWidth={2}
              fill="url(#segmentElevationFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            {playingPoint && (
              <ReferenceDot
                x={playingPoint.distanceMiles}
                y={playingPoint.elevationFeet}
                r={5}
                stroke="#111827"
                strokeWidth={2}
                fill="#ffffff"
                ifOverflow="extendDomain"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

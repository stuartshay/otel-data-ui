import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ActivityChartTrackPoint } from '@/components/garmin/ActivityChartData'
import { buildSegmentElevationProfile } from './SegmentElevationProfile.helpers'

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
  loading = false,
}: Readonly<{
  routePoints: readonly ActivityChartTrackPoint[]
  loading?: boolean
}>) {
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

  const profile = buildSegmentElevationProfile(routePoints)

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

  const accessibleSummary = `Elevation profile from ${formatFeet(profile.startElevationFeet)} at the segment start to ${formatFeet(profile.finishElevationFeet)} at the finish, with ${formatFeet(profile.elevationGainFeet)} of elevation gain over ${profile.distanceMiles.toFixed(2)} miles.`

  return (
    <section
      data-testid="segment-elevation-profile"
      className="rounded-md border bg-muted/20 p-4"
      aria-labelledby="segment-elevation-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="segment-elevation-heading" className="text-sm font-semibold">
            Elevation
          </h3>
          <p className="text-xs text-muted-foreground">Start to finish</p>
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

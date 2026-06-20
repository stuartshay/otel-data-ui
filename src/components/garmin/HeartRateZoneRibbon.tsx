import type { ChartDataPoint } from './ActivityChartData'
import { CHART_MARGIN_RIGHT, CHART_Y_AXIS_WIDTH } from './chartLayout'
import { buildHeartRateZoneSegments, ZONE_COLORS } from './heartRateZones'

export function HeartRateZoneRibbon({
  data,
  xKey,
}: {
  data: ChartDataPoint[]
  xKey: 'distance' | 'time'
}) {
  const segments = buildHeartRateZoneSegments(data, xKey)
  if (segments.length === 0) return null

  return (
    <div
      className="mt-1 space-y-1"
      style={{
        marginLeft: CHART_Y_AXIS_WIDTH,
        marginRight: CHART_MARGIN_RIGHT,
      }}
    >
      <div
        aria-label="Heart rate zones across activity"
        className="relative h-2 overflow-hidden rounded-full bg-muted/40"
        data-testid="heart-rate-zone-ribbon"
        role="img"
      >
        {segments.map((segment, index) => (
          <span
            aria-hidden="true"
            className="absolute inset-y-0"
            data-zone={segment.zone}
            key={`${segment.startPercent}-${segment.zone}-${index}`}
            style={{
              backgroundColor: ZONE_COLORS[segment.zone],
              left: `${segment.startPercent}%`,
              width: `${segment.widthPercent}%`,
            }}
            title={`Heart rate zone ${segment.zone}`}
          />
        ))}
      </div>
      <div
        aria-label="Heart rate zone legend"
        className="flex justify-end gap-3 text-[10px] text-muted-foreground"
      >
        {[1, 2, 3, 4, 5].map((zone) => (
          <span className="flex items-center gap-1" key={zone}>
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: ZONE_COLORS[zone] }}
            />
            Z{zone}
          </span>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  buildActivityChartData,
  type ActivityChartTrackPoint,
  type ChartDataPoint,
  type SavedPoint,
} from './ActivityChartData'

interface ActivityChartsProps {
  trackPoints: ActivityChartTrackPoint[]
  activePoint?: ChartDataPoint | null
  /**
   * Points the user has saved. Each renders a persistent crosshair in its own
   * color on both charts so multiple selections stay visible at once.
   */
  savedPoints?: SavedPoint[]
  /**
   * Notifies the parent which chart point is currently under the cursor so the
   * page can render a shared details panel and a map hover marker. The two
   * charts share this state via Recharts' syncId — both charts show a
   * crosshair at the same x-position and emit the same active index.
   */
  onActivePointChange?: (point: ChartDataPoint | null) => void
  /**
   * Adds the current chart point to the saved set (or removes it if already
   * saved). Triggered by double-clicking a chart.
   */
  onPointToggle?: (point: ChartDataPoint) => void
}

type XAxisMode = 'distance' | 'time'

interface ChartConfig {
  title: string
  dataKey: string
  color: string
  unit: string
  hasData: boolean
}

function activeMetricValue(
  point: ChartDataPoint | null | undefined,
  dataKey: string,
): number | null {
  if (dataKey !== 'elevation' && dataKey !== 'speed') return null
  const value = point?.[dataKey]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function pointFromTooltipState(
  state: { activeTooltipIndex?: number | string | null } | undefined,
  chartData: ChartDataPoint[],
): ChartDataPoint | null {
  const raw = state?.activeTooltipIndex
  // Recharts 3 may emit the index as a string; normalize it.
  const i =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw !== ''
        ? Number(raw)
        : NaN

  return Number.isInteger(i) && chartData[i] ? chartData[i] : null
}

export function ActivityCharts({
  trackPoints,
  activePoint,
  savedPoints = [],
  onActivePointChange,
  onPointToggle,
}: ActivityChartsProps) {
  const [xMode, setXMode] = useState<XAxisMode>('distance')

  if (trackPoints.length === 0) return null

  const { chartData, hasReliableDistance } = buildActivityChartData(trackPoints)

  // Fall back to time if distance data is too sparse
  const effectiveXMode =
    xMode === 'distance' && !hasReliableDistance ? 'time' : xMode
  const xKey = effectiveXMode === 'distance' ? 'distance' : 'time'
  const xLabel = effectiveXMode === 'distance' ? 'Distance (mi)' : 'Time (min)'
  const activeX =
    activePoint?.[xKey] != null && Number.isFinite(activePoint[xKey])
      ? activePoint[xKey]
      : null

  const hasElevation = chartData.some((d) => d.elevation != null)
  const hasSpeed = chartData.some((d) => d.speed != null)

  const charts: ChartConfig[] = [
    {
      title: 'Elevation',
      dataKey: 'elevation',
      color: '#6b7280',
      unit: 'ft',
      hasData: hasElevation,
    },
    {
      title: 'Speed',
      dataKey: 'speed',
      color: '#3b82f6',
      unit: 'mph',
      hasData: hasSpeed,
    },
  ]

  const activeCharts = charts.filter((c) => c.hasData)

  if (activeCharts.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2">
        <span
          title={
            !hasReliableDistance
              ? 'Distance data unavailable for this activity'
              : undefined
          }
        >
          <Button
            size="sm"
            variant={effectiveXMode === 'distance' ? 'default' : 'outline'}
            onClick={() => setXMode('distance')}
            disabled={!hasReliableDistance}
          >
            Distance
          </Button>
        </span>
        <Button
          size="sm"
          variant={effectiveXMode === 'time' ? 'default' : 'outline'}
          onClick={() => setXMode('time')}
        >
          Time
        </Button>
      </div>

      {activeCharts.map((chart) => (
        <Card key={chart.dataKey} data-testid={`chart-${chart.dataKey}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                syncId="garmin-activity"
                onMouseMove={(state: {
                  activeTooltipIndex?: number | string | null
                }) => {
                  const point = pointFromTooltipState(state, chartData)
                  if (point) onActivePointChange?.(point)
                }}
                onDoubleClick={(state: {
                  activeTooltipIndex?: number | string | null
                }) => {
                  const point = pointFromTooltipState(state, chartData)
                  if (point) onPointToggle?.(point)
                }}
                onMouseLeave={() => onActivePointChange?.(null)}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey={xKey}
                  type="number"
                  domain={[0, 'dataMax']}
                  tickFormatter={(v: number) =>
                    v != null
                      ? v.toFixed(effectiveXMode === 'distance' ? 1 : 0)
                      : ''
                  }
                  label={{
                    value: xLabel,
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(v: number) => (v != null ? v.toFixed(0) : '')}
                  className="text-xs"
                  width={50}
                />
                <Tooltip
                  cursor={{ stroke: 'currentColor', strokeOpacity: 0.4 }}
                  content={() => null}
                />
                {activeX != null && (
                  <ReferenceLine
                    x={activeX}
                    stroke="currentColor"
                    strokeOpacity={0.55}
                    ifOverflow="extendDomain"
                  />
                )}
                {activeX != null &&
                  activeMetricValue(activePoint, chart.dataKey) != null && (
                    <ReferenceDot
                      x={activeX}
                      y={activeMetricValue(activePoint, chart.dataKey) ?? 0}
                      r={4}
                      stroke="currentColor"
                      strokeWidth={2}
                      fill="var(--background)"
                      ifOverflow="extendDomain"
                    />
                  )}
                {savedPoints.map((sp) => {
                  const x = sp[xKey]
                  if (x == null || !Number.isFinite(x)) return null
                  return (
                    <ReferenceLine
                      key={`saved-line-${sp.id}`}
                      x={x}
                      stroke={sp.color}
                      strokeOpacity={0.8}
                      strokeDasharray="4 2"
                      ifOverflow="extendDomain"
                    />
                  )
                })}
                {savedPoints.map((sp) => {
                  const x = sp[xKey]
                  const y = activeMetricValue(sp, chart.dataKey)
                  if (x == null || !Number.isFinite(x) || y == null) return null
                  return (
                    <ReferenceDot
                      key={`saved-dot-${sp.id}`}
                      x={x}
                      y={y}
                      r={4}
                      stroke={sp.color}
                      strokeWidth={2}
                      fill={sp.color}
                      ifOverflow="extendDomain"
                    />
                  )
                })}
                <Area
                  type="monotone"
                  dataKey={chart.dataKey}
                  stroke={chart.color}
                  fill={chart.color}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

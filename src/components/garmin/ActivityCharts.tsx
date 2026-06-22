import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleHelp, ChevronDown, ChevronUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ReferenceArea,
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
import {
  coerceTooltipMetricValue,
  formatXAxisValue,
  type XAxisMode,
} from './ActivityChartTooltip'
import { getActivityYAxisConfig } from './ActivityChartYAxis'
import { CHART_MARGIN_RIGHT, CHART_Y_AXIS_WIDTH } from './chartLayout'
import { HeartRateZoneRibbon } from './HeartRateZoneRibbon'

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
  /**
   * Garmin's activity-level average cadence (rpm). Used for the Cadence chart's
   * average label so it matches Garmin (which excludes coasting), instead of
   * the per-point mean.
   */
  cadenceAverage?: number | null
}

type MetricKey =
  | 'elevation'
  | 'speed'
  | 'heartRate'
  | 'respirationRate'
  | 'cadence'

interface ChartConfig {
  title: string
  dataKey: MetricKey
  color: string
  unit: string
  hasData: boolean
  precision: number
  description?: string
}

interface MetricStatistics {
  average: number | null
  minimum: number | null
  maximum: number | null
}

function activeMetricValue(
  point: ChartDataPoint | null | undefined,
  dataKey: MetricKey,
): number | null {
  const value = point?.[dataKey]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function metricStatistics(
  data: ChartDataPoint[],
  dataKey: MetricKey,
): MetricStatistics {
  let sum = 0
  let count = 0
  let minimum = Infinity
  let maximum = -Infinity

  for (const point of data) {
    const value = activeMetricValue(point, dataKey)
    if (value == null) continue

    sum += value
    count += 1
    minimum = Math.min(minimum, value)
    maximum = Math.max(maximum, value)
  }

  return {
    average: count > 0 ? sum / count : null,
    minimum: count > 0 ? minimum : null,
    maximum: count > 0 ? maximum : null,
  }
}

function formatNumber(value: number | null, precision: number): string {
  return value != null ? value.toFixed(precision) : '--'
}

function formatMetricValue(
  value: number | null,
  chart: Pick<ChartConfig, 'precision' | 'unit'>,
): string {
  return `${formatNumber(value, chart.precision)} ${chart.unit}`
}

interface ChartTooltipProps {
  label?: unknown
  payload?: ReadonlyArray<{ value?: unknown }>
  chart: ChartConfig
  xMode: XAxisMode
}

function ChartTooltip({ label, payload, chart, xMode }: ChartTooltipProps) {
  const metricValue = coerceTooltipMetricValue(payload?.[0]?.value)
  const xValue = formatXAxisValue(label, xMode)

  return (
    <div className="space-y-1 rounded bg-neutral-950/90 px-2 py-1 text-xs text-white shadow-md">
      {xValue && <div>{xValue}</div>}
      <div>{formatMetricValue(metricValue, chart)}</div>
    </div>
  )
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
  cadenceAverage,
}: ActivityChartsProps) {
  const [xMode, setXMode] = useState<XAxisMode>('distance')
  const [smoothRespiration, setSmoothRespiration] = useState(false)
  const [collapsedCharts, setCollapsedCharts] = useState<Set<MetricKey>>(
    () => new Set(),
  )
  const { chartData, hasReliableDistance } = useMemo(
    () => buildActivityChartData(trackPoints),
    [trackPoints],
  )
  const pendingActivePointRef = useRef<ChartDataPoint | null>(null)
  const lastActivePointRef = useRef<ChartDataPoint | null>(null)
  const activePointFrameRef = useRef<number | null>(null)

  const queueActivePointChange = useCallback(
    (point: ChartDataPoint | null) => {
      if (!onActivePointChange) return

      pendingActivePointRef.current = point
      if (activePointFrameRef.current != null) return

      activePointFrameRef.current = window.requestAnimationFrame(() => {
        activePointFrameRef.current = null
        const nextPoint = pendingActivePointRef.current
        if (
          nextPoint !== null &&
          lastActivePointRef.current?.timestamp === nextPoint.timestamp
        ) {
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

  if (trackPoints.length === 0) return null

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
  const hasHeartRate = chartData.some((d) => d.heartRate != null)
  const hasRespirationRate = chartData.some((d) => d.respirationRate != null)
  const hasCadence = chartData.some((d) => d.cadence != null)

  // Shaded regions between consecutive saved points (ordered along the x-axis).
  const savedPointsByX = savedPoints
    .filter((sp) => sp[xKey] != null && Number.isFinite(sp[xKey]))
    .map((sp) => ({ id: sp.id, color: sp.color, x: sp[xKey] as number }))
    .sort((a, b) => a.x - b.x)
  const savedSegments = savedPointsByX.slice(0, -1).map((sp, i) => {
    const next = savedPointsByX[i + 1]
    return {
      fromId: sp.id,
      toId: next.id,
      color: next.color,
      x1: sp.x,
      x2: next.x,
    }
  })

  const charts: ChartConfig[] = [
    {
      title: 'Elevation',
      dataKey: 'elevation',
      color: '#55b922',
      unit: 'ft',
      hasData: hasElevation,
      precision: 0,
    },
    {
      title: 'Speed',
      dataKey: 'speed',
      color: '#3b82f6',
      unit: 'mph',
      hasData: hasSpeed,
      precision: 1,
    },
    {
      title: 'Heart Rate',
      dataKey: 'heartRate',
      color: '#ef4444',
      unit: 'bpm',
      hasData: hasHeartRate,
      precision: 0,
    },
    {
      title: 'Cadence',
      dataKey: 'cadence',
      color: '#f59e0b',
      unit: 'rpm',
      hasData: hasCadence,
      precision: 0,
    },
    {
      title: 'Respiration Rate',
      dataKey: 'respirationRate',
      color: '#3fc1d3',
      unit: 'breaths/min',
      hasData: hasRespirationRate,
      precision: 0,
      description:
        'Estimated breaths per minute recorded by Garmin. Higher values often accompany harder effort; brief spikes or drops may reflect sensor noise.',
    },
  ]

  const activeCharts = charts.filter((c) => c.hasData)
  const activeChartLabels = activeCharts.map((chart) => {
    const statistics = metricStatistics(chartData, chart.dataKey)
    // Prefer Garmin's activity-level average cadence (excludes coasting) over
    // the per-point mean so the label matches Garmin Connect.
    const averageValue =
      chart.dataKey === 'cadence' && cadenceAverage != null
        ? cadenceAverage
        : statistics.average
    return {
      chart,
      stats: statistics,
      yAxisConfig: getActivityYAxisConfig(chart.dataKey),
      averageLabel: formatMetricValue(averageValue, chart),
    }
  })

  if (activeCharts.length === 0) return null

  const toggleChart = (dataKey: MetricKey) => {
    setCollapsedCharts((current) => {
      const next = new Set(current)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

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

      {activeChartLabels.map(({ chart, stats, yAxisConfig, averageLabel }) => (
        <Card key={chart.dataKey} data-testid={`chart-${chart.dataKey}`}>
          <CardHeader
            className={collapsedCharts.has(chart.dataKey) ? 'pb-6' : 'pb-2'}
          >
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full"
                  style={{ backgroundColor: chart.color }}
                />
                {chart.title}
                {chart.description && (
                  <span
                    aria-label={`About ${chart.title}: ${chart.description}`}
                    className="inline-flex text-muted-foreground"
                    role="note"
                    tabIndex={0}
                    title={chart.description}
                  >
                    <CircleHelp aria-hidden="true" className="size-4" />
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {chart.dataKey === 'respirationRate' ? (
                  <>
                    <div
                      aria-label={`Respiration Rate statistics: average ${formatNumber(stats.average, 0)}, minimum ${formatNumber(stats.minimum, 0)}, maximum ${formatNumber(stats.maximum, 0)} breaths per minute`}
                      className="rounded bg-neutral-950/70 px-2 py-1 text-xs text-white"
                    >
                      Avg {formatNumber(stats.average, 0)} · Min{' '}
                      {formatNumber(stats.minimum, 0)} · Max{' '}
                      {formatNumber(stats.maximum, 0)} breaths/min
                    </div>
                    <div
                      aria-label="Respiration rate display"
                      className="flex rounded border p-0.5"
                      role="group"
                    >
                      <Button
                        aria-pressed={!smoothRespiration}
                        className="h-6 px-2 text-xs"
                        onClick={() => setSmoothRespiration(false)}
                        size="sm"
                        variant={!smoothRespiration ? 'secondary' : 'ghost'}
                      >
                        Raw
                      </Button>
                      <Button
                        aria-pressed={smoothRespiration}
                        className="h-6 px-2 text-xs"
                        onClick={() => setSmoothRespiration(true)}
                        size="sm"
                        variant={smoothRespiration ? 'secondary' : 'ghost'}
                      >
                        Smoothed
                      </Button>
                    </div>
                  </>
                ) : (
                  <div
                    aria-label={`${chart.title} average ${averageLabel}`}
                    className="rounded bg-neutral-950/70 px-2 py-1 text-xs text-white"
                  >
                    Avg: {averageLabel}
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`${collapsedCharts.has(chart.dataKey) ? 'Expand' : 'Minimize'} ${chart.title} graph`}
                  title={`${collapsedCharts.has(chart.dataKey) ? 'Expand' : 'Minimize'} ${chart.title} graph`}
                  aria-controls={`chart-content-${chart.dataKey}`}
                  aria-expanded={!collapsedCharts.has(chart.dataKey)}
                  onClick={() => toggleChart(chart.dataKey)}
                >
                  {collapsedCharts.has(chart.dataKey) ? (
                    <ChevronDown aria-hidden="true" />
                  ) : (
                    <ChevronUp aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent
            id={`chart-content-${chart.dataKey}`}
            hidden={collapsedCharts.has(chart.dataKey)}
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={
                  chart.dataKey === 'respirationRate' && smoothRespiration
                    ? chartData.map((point) => ({
                        ...point,
                        respirationRate: point.respirationRateSmoothed ?? null,
                      }))
                    : chartData
                }
                margin={{
                  top: 5,
                  right: CHART_MARGIN_RIGHT,
                  left: 0,
                  bottom: 5,
                }}
                syncId="garmin-activity"
                onMouseMove={(state: {
                  activeTooltipIndex?: number | string | null
                }) => {
                  const point = pointFromTooltipState(state, chartData)
                  if (point) queueActivePointChange(point)
                }}
                onDoubleClick={(state: {
                  activeTooltipIndex?: number | string | null
                }) => {
                  const point = pointFromTooltipState(state, chartData)
                  if (point) onPointToggle?.(point)
                }}
                onMouseLeave={() => queueActivePointChange(null)}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                {savedSegments.map((seg) => (
                  <ReferenceArea
                    key={`seg-${seg.fromId}-${seg.toId}`}
                    x1={seg.x1}
                    x2={seg.x2}
                    fill={seg.color}
                    fillOpacity={0.08}
                    ifOverflow="extendDomain"
                  />
                ))}
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
                  {...yAxisConfig}
                  tickFormatter={(v: number) => (v != null ? v.toFixed(0) : '')}
                  className="text-xs"
                  width={CHART_Y_AXIS_WIDTH}
                />
                <Tooltip
                  cursor={{ stroke: 'currentColor', strokeOpacity: 0.4 }}
                  content={({ label, payload }) => (
                    <ChartTooltip
                      label={label}
                      payload={payload}
                      chart={chart}
                      xMode={effectiveXMode}
                    />
                  )}
                />
                {chart.dataKey === 'respirationRate' &&
                  stats.average != null && (
                    <ReferenceLine
                      ifOverflow="extendDomain"
                      label={{
                        value: `Avg ${formatNumber(stats.average, 0)}`,
                        position: 'insideTopRight',
                        fill: chart.color,
                        fontSize: 10,
                      }}
                      stroke={chart.color}
                      strokeDasharray="5 4"
                      strokeOpacity={0.8}
                      y={stats.average}
                    />
                  )}
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
            {chart.dataKey === 'heartRate' && (
              <HeartRateZoneRibbon data={chartData} xKey={xKey} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

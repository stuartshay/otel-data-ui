import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  kmToMi,
  metersToFeet,
  kmhToMph,
  celsiusToFahrenheit,
} from '@/lib/units'

interface TrackPoint {
  distance_from_start_km?: number | null
  timestamp: string
  altitude?: number | null
  speed_kmh?: number | null
  heart_rate?: number | null
  temperature_c?: number | null
}

interface ActivityChartsProps {
  trackPoints: TrackPoint[]
}

type XAxisMode = 'distance' | 'time'

function downsample<T>(data: T[], target: number): T[] {
  if (data.length <= target) return data
  const step = data.length / target
  const result: T[] = []
  for (let i = 0; i < target; i++) {
    result.push(data[Math.floor(i * step)])
  }
  // Always include last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1])
  }
  return result
}

interface ChartConfig {
  title: string
  dataKey: string
  color: string
  unit: string
  hasData: boolean
}

export function ActivityCharts({ trackPoints }: ActivityChartsProps) {
  const [xMode, setXMode] = useState<XAxisMode>('distance')

  if (trackPoints.length === 0) return null

  // Build chart data with unit conversions
  const sampled = downsample(trackPoints, 800)
  const startTime = new Date(sampled[0].timestamp).getTime()

  const chartData = sampled.map((pt) => ({
    distance:
      pt.distance_from_start_km != null ? kmToMi(pt.distance_from_start_km) : 0,
    time: (new Date(pt.timestamp).getTime() - startTime) / 60000, // minutes
    elevation: pt.altitude != null ? metersToFeet(pt.altitude) : null,
    speed: pt.speed_kmh != null ? kmhToMph(pt.speed_kmh) : null,
    heartRate: pt.heart_rate ?? null,
    temperature:
      pt.temperature_c != null ? celsiusToFahrenheit(pt.temperature_c) : null,
  }))

  const xKey = xMode === 'distance' ? 'distance' : 'time'
  const xLabel = xMode === 'distance' ? 'Distance (mi)' : 'Time (min)'

  const hasElevation = chartData.some((d) => d.elevation != null)
  const hasSpeed = chartData.some((d) => d.speed != null)
  const hasHR = chartData.some((d) => d.heartRate != null)
  const hasTemp = chartData.some((d) => d.temperature != null)

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
    {
      title: 'Heart Rate',
      dataKey: 'heartRate',
      color: '#ef4444',
      unit: 'bpm',
      hasData: hasHR,
    },
    {
      title: 'Temperature',
      dataKey: 'temperature',
      color: '#f97316',
      unit: '°F',
      hasData: hasTemp,
    },
  ]

  const activeCharts = charts.filter((c) => c.hasData)

  if (activeCharts.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={xMode === 'distance' ? 'default' : 'outline'}
          onClick={() => setXMode('distance')}
        >
          Distance
        </Button>
        <Button
          size="sm"
          variant={xMode === 'time' ? 'default' : 'outline'}
          onClick={() => setXMode('time')}
        >
          Time
        </Button>
      </div>

      {activeCharts.map((chart) => (
        <Card key={chart.dataKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey={xKey}
                  tickFormatter={(v: number) =>
                    v.toFixed(xMode === 'distance' ? 1 : 0)
                  }
                  label={{
                    value: xLabel,
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(v: number) => v.toFixed(0)}
                  className="text-xs"
                  width={50}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} ${chart.unit}`,
                    chart.title,
                  ]}
                  labelFormatter={(label) =>
                    xMode === 'distance'
                      ? `${Number(label).toFixed(2)} mi`
                      : `${Number(label).toFixed(0)} min`
                  }
                />
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

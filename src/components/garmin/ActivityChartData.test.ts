import { describe, expect, it } from 'vitest'
import {
  buildActivityChartData,
  getActivityChartContext,
  toChartDataPoint,
  type ActivityChartTrackPoint,
} from './ActivityChartData'

function point(
  index: number,
  overrides: Partial<ActivityChartTrackPoint> = {},
): ActivityChartTrackPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1, 12, 0, index)).toISOString(),
    distance_from_start_km: index,
    altitude: 100,
    speed_kmh: 16.0934,
    respiration_rate: 27,
    latitude: 40 + index / 1000,
    longitude: -74 - index / 1000,
    ...overrides,
  }
}

describe('ActivityChartData', () => {
  it('converts a raw track point into chart units', () => {
    const chartPoint = toChartDataPoint(
      point(5),
      Date.UTC(2026, 0, 1, 12),
      true,
    )

    expect(chartPoint.distance).toBeCloseTo(3.10686)
    expect(chartPoint.distanceKm).toBe(5)
    expect(chartPoint.time).toBeCloseTo(5 / 60)
    expect(chartPoint.elevation).toBeCloseTo(328.084)
    expect(chartPoint.speed).toBeCloseTo(10)
    expect(chartPoint.respirationRate).toBe(27)
    expect(chartPoint.latitude).toBe(40.005)
    expect(chartPoint.longitude).toBe(-74.005)
  })

  it('omits distance when the series does not have reliable distance data', () => {
    const chartPoint = toChartDataPoint(
      point(5, { distance_from_start_km: 5 }),
      Date.UTC(2026, 0, 1, 12),
      false,
    )

    expect(chartPoint.distance).toBeNull()
    expect(chartPoint.distanceKm).toBe(5)
  })

  it('returns no context or chart data for an empty series', () => {
    expect(getActivityChartContext([])).toBeNull()
    expect(buildActivityChartData([])).toEqual({
      chartData: [],
      hasReliableDistance: false,
    })
  })

  it('downsamples long series while keeping the final track point', () => {
    const points = Array.from({ length: 1000 }, (_, i) => point(i))

    const result = buildActivityChartData(points)

    expect(result.hasReliableDistance).toBe(true)
    expect(result.chartData).toHaveLength(801)
    expect(result.chartData[0].timestamp).toBe(points[0].timestamp)
    expect(result.chartData.at(-1)?.timestamp).toBe(points.at(-1)?.timestamp)
  })

  it('marks distance as unreliable when fewer than half the sampled points include distance', () => {
    const points = Array.from({ length: 10 }, (_, i) =>
      point(i, { distance_from_start_km: i < 4 ? i : null }),
    )

    const result = buildActivityChartData(points)

    expect(result.hasReliableDistance).toBe(false)
    expect(result.chartData.every((p) => p.distance == null)).toBe(true)
  })
})

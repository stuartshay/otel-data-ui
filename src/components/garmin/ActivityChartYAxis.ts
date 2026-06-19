type ActivityChartMetric = 'elevation' | 'speed' | 'heartRate'

interface ActivityYAxisConfig {
  domain?: [number, number]
  ticks?: number[]
}

export function getActivityYAxisConfig(
  dataKey: ActivityChartMetric,
): ActivityYAxisConfig {
  if (dataKey === 'heartRate') {
    return {
      domain: [100, 200],
      ticks: [100, 150, 200],
    }
  }

  return {}
}

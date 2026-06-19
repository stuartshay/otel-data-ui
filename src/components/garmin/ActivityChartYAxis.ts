type ActivityChartMetric = 'elevation' | 'speed' | 'heartRate'

interface ActivityYAxisConfig {
  domain?: [(dataMinimum: number) => number, (dataMaximum: number) => number]
  ticks?: number[]
}

export function getActivityYAxisConfig(
  dataKey: ActivityChartMetric,
): ActivityYAxisConfig {
  if (dataKey === 'heartRate') {
    return {
      domain: [
        (dataMinimum) => Math.min(dataMinimum, 100),
        (dataMaximum) => Math.max(dataMaximum, 200),
      ],
      ticks: [100, 150, 200],
    }
  }

  return {}
}

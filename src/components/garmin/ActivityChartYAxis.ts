type ActivityChartMetric =
  | 'elevation'
  | 'speed'
  | 'heartRate'
  | 'respirationRate'
  | 'cadence'

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

  if (dataKey === 'respirationRate') {
    return {
      domain: [
        (dataMinimum) => Math.min(dataMinimum, 16),
        (dataMaximum) => Math.max(dataMaximum, 40),
      ],
      ticks: [16, 24, 32, 40],
    }
  }

  if (dataKey === 'cadence') {
    return {
      domain: [
        (dataMinimum) => Math.min(dataMinimum, 0),
        (dataMaximum) => Math.max(dataMaximum, 100),
      ],
      ticks: [0, 50, 100],
    }
  }

  return {}
}

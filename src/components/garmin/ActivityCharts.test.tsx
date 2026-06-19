import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityCharts } from './ActivityCharts'
import { getActivityYAxisConfig } from './ActivityChartYAxis'
import {
  coerceTooltipMetricValue,
  formatXAxisValue,
} from './ActivityChartTooltip'

describe('ActivityCharts', () => {
  it('uses Garmin-style Y-axis ticks only for heart rate', () => {
    const heartRateAxis = getActivityYAxisConfig('heartRate')
    const [minimumDomain, maximumDomain] = heartRateAxis.domain ?? []

    expect(heartRateAxis.ticks).toEqual([100, 150, 200])
    expect(minimumDomain?.(120)).toBe(100)
    expect(minimumDomain?.(80)).toBe(80)
    expect(maximumDomain?.(180)).toBe(200)
    expect(maximumDomain?.(220)).toBe(220)
    expect(getActivityYAxisConfig('elevation')).toEqual({})
    expect(getActivityYAxisConfig('speed')).toEqual({})
  })

  it('renders a heart-rate chart when heart-rate data is present', () => {
    render(
      <ActivityCharts
        trackPoints={[
          {
            timestamp: '2026-03-14T09:00:00Z',
            distance_from_start_km: 0,
            altitude: 10,
            speed_kmh: 22,
            heart_rate: 118,
            latitude: 40.7,
            longitude: -74,
          },
          {
            timestamp: '2026-03-14T09:10:00Z',
            distance_from_start_km: 5,
            altitude: 30,
            speed_kmh: 28,
            heart_rate: 152,
            latitude: 40.71,
            longitude: -74.01,
          },
        ]}
      />,
    )

    expect(screen.getByTestId('chart-heartRate')).toBeInTheDocument()
    expect(screen.getByText('Heart Rate')).toBeInTheDocument()
  })

  it('renders Garmin-style labels and average values for each chart', () => {
    render(
      <ActivityCharts
        trackPoints={[
          {
            timestamp: '2026-03-14T09:00:00Z',
            distance_from_start_km: 0,
            altitude: 10,
            speed_kmh: 22,
            heart_rate: 118,
            latitude: 40.7,
            longitude: -74,
          },
          {
            timestamp: '2026-03-14T09:10:00Z',
            distance_from_start_km: 5,
            altitude: 30,
            speed_kmh: 28,
            heart_rate: 152,
            latitude: 40.71,
            longitude: -74.01,
          },
        ]}
      />,
    )

    expect(screen.getByLabelText('Elevation average 66 ft')).toBeInTheDocument()
    expect(screen.getByLabelText('Speed average 15.5 mph')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Heart Rate average 135 bpm'),
    ).toBeInTheDocument()
  })

  it('ignores nullish and empty x-axis tooltip labels', () => {
    expect(formatXAxisValue(null, 'distance')).toBeUndefined()
    expect(formatXAxisValue(undefined, 'time')).toBeUndefined()
    expect(formatXAxisValue('', 'distance')).toBeUndefined()
  })

  it('formats numeric x-axis tooltip labels', () => {
    expect(formatXAxisValue(1.234, 'distance')).toBe('1.2 mi')
    expect(formatXAxisValue('12', 'time')).toBe('12 min')
    expect(formatXAxisValue('not-a-number', 'distance')).toBeUndefined()
  })

  it('coerces numeric tooltip payload values', () => {
    expect(coerceTooltipMetricValue(12.5)).toBe(12.5)
    expect(coerceTooltipMetricValue('12.5')).toBe(12.5)
    expect(coerceTooltipMetricValue(null)).toBeNull()
    expect(coerceTooltipMetricValue('')).toBeNull()
    expect(coerceTooltipMetricValue('not-a-number')).toBeNull()
  })
})

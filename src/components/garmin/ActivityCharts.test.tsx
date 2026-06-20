import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ActivityCharts } from './ActivityCharts'
import { getActivityYAxisConfig } from './ActivityChartYAxis'
import {
  coerceTooltipMetricValue,
  formatXAxisValue,
} from './ActivityChartTooltip'

describe('ActivityCharts', () => {
  it('uses Garmin-style Y-axis ticks for heart rate and respiration', () => {
    const heartRateAxis = getActivityYAxisConfig('heartRate')
    const [minimumDomain, maximumDomain] = heartRateAxis.domain ?? []

    expect(heartRateAxis.ticks).toEqual([100, 150, 200])
    expect(minimumDomain?.(120)).toBe(100)
    expect(minimumDomain?.(80)).toBe(80)
    expect(maximumDomain?.(180)).toBe(200)
    expect(maximumDomain?.(220)).toBe(220)

    const respirationAxis = getActivityYAxisConfig('respirationRate')
    const [minimumRespiration, maximumRespiration] =
      respirationAxis.domain ?? []
    expect(respirationAxis.ticks).toEqual([16, 24, 32, 40])
    expect(minimumRespiration?.(24)).toBe(16)
    expect(minimumRespiration?.(12)).toBe(12)
    expect(maximumRespiration?.(32)).toBe(40)
    expect(maximumRespiration?.(44)).toBe(44)
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

  it('renders respiration below heart rate only when samples exist', () => {
    const points = [
      {
        timestamp: '2026-03-14T09:00:00Z',
        distance_from_start_km: 0,
        heart_rate: 118,
        respiration_rate: 24,
      },
      {
        timestamp: '2026-03-14T09:10:00Z',
        distance_from_start_km: 5,
        heart_rate: 152,
        respiration_rate: 30,
      },
    ]
    const { rerender } = render(<ActivityCharts trackPoints={points} />)

    const heartRateChart = screen.getByTestId('chart-heartRate')
    const respirationChart = screen.getByTestId('chart-respirationRate')
    expect(heartRateChart.compareDocumentPosition(respirationChart)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(screen.getByText('Respiration Rate')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Respiration Rate average 27 brpm'),
    ).toBeInTheDocument()

    rerender(
      <ActivityCharts
        trackPoints={points.map((point) => ({
          ...point,
          respiration_rate: null,
        }))}
      />,
    )
    expect(
      screen.queryByTestId('chart-respirationRate'),
    ).not.toBeInTheDocument()
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
            respiration_rate: 24,
            latitude: 40.7,
            longitude: -74,
          },
          {
            timestamp: '2026-03-14T09:10:00Z',
            distance_from_start_km: 5,
            altitude: 30,
            speed_kmh: 28,
            heart_rate: 152,
            respiration_rate: 30,
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
    expect(
      screen.getByLabelText('Respiration Rate average 27 brpm'),
    ).toBeInTheDocument()
  })

  it('minimizes and restores each chart independently while keeping its header', async () => {
    const user = userEvent.setup()
    render(
      <ActivityCharts
        trackPoints={[
          {
            timestamp: '2026-03-14T09:00:00Z',
            distance_from_start_km: 0,
            altitude: 10,
            speed_kmh: 22,
            heart_rate: 118,
            respiration_rate: 24,
          },
          {
            timestamp: '2026-03-14T09:10:00Z',
            distance_from_start_km: 5,
            altitude: 30,
            speed_kmh: 28,
            heart_rate: 152,
            respiration_rate: 30,
          },
        ]}
      />,
    )

    const minimizeElevation = screen.getByRole('button', {
      name: 'Minimize Elevation graph',
    })
    expect(
      screen.getAllByRole('button', { name: /^Minimize .* graph$/ }),
    ).toHaveLength(4)
    expect(minimizeElevation).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('chart-content-elevation')).toBeVisible()
    expect(document.getElementById('chart-content-speed')).toBeInTheDocument()

    await user.click(minimizeElevation)

    expect(
      screen.getByRole('button', { name: 'Expand Elevation graph' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById('chart-content-elevation')).not.toBeVisible()
    expect(document.getElementById('chart-content-speed')).toBeVisible()
    expect(screen.getByText('Elevation')).toBeInTheDocument()
    expect(screen.getByLabelText('Elevation average 66 ft')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Expand Elevation graph' }),
    )

    expect(
      screen.getByRole('button', { name: 'Minimize Elevation graph' }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('chart-content-elevation')).toBeVisible()
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

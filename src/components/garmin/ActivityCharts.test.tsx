import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ActivityCharts } from './ActivityCharts'
import type { ChartDataPoint } from './ActivityChartData'
import { buildHeartRateZoneSegments } from './heartRateZones'
import { getActivityYAxisConfig } from './ActivityChartYAxis'
import {
  coerceTooltipMetricValue,
  formatXAxisValue,
} from './ActivityChartTooltip'

describe('ActivityCharts', () => {
  it('uses Garmin-style Y-axis ticks for heart rate, respiration, and cadence', () => {
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

    const cadenceAxis = getActivityYAxisConfig('cadence')
    const [minimumCadence, maximumCadence] = cadenceAxis.domain ?? []
    expect(cadenceAxis.ticks).toEqual([0, 50, 100])
    expect(minimumCadence?.(40)).toBe(0)
    expect(minimumCadence?.(-5)).toBe(0)
    expect(maximumCadence?.(80)).toBe(100)
    expect(maximumCadence?.(140)).toBe(140)
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

  it('renders a cadence chart with an average label only when cadence data exists', () => {
    const points = [
      {
        timestamp: '2026-03-14T09:00:00Z',
        distance_from_start_km: 0,
        heart_rate: 118,
        cadence: 70,
      },
      {
        timestamp: '2026-03-14T09:10:00Z',
        distance_from_start_km: 5,
        heart_rate: 135,
        cadence: 72,
      },
    ]
    const { rerender } = render(<ActivityCharts trackPoints={points} />)

    const cadenceChart = screen.getByTestId('chart-cadence')
    expect(cadenceChart).toBeInTheDocument()
    expect(screen.getByText('Cadence')).toBeInTheDocument()
    // Cadence counts toward an Avg: N rpm label (mean of 70 and 72 = 71).
    expect(screen.getByLabelText('Cadence average 71 rpm')).toBeInTheDocument()

    rerender(
      <ActivityCharts
        trackPoints={points.map((point) => ({ ...point, cadence: null }))}
      />,
    )
    expect(screen.queryByTestId('chart-cadence')).not.toBeInTheDocument()
  })

  it('uses Garmin avg cadence for the label and excludes coasting (0 rpm)', () => {
    const points = [
      {
        timestamp: '2026-03-14T09:00:00Z',
        distance_from_start_km: 0,
        cadence: 80,
      },
      {
        timestamp: '2026-03-14T09:05:00Z',
        distance_from_start_km: 2,
        cadence: 0,
      },
      {
        timestamp: '2026-03-14T09:10:00Z',
        distance_from_start_km: 5,
        cadence: 90,
      },
    ]

    // When Garmin's activity avg_cadence is supplied, the label uses it.
    const { rerender } = render(
      <ActivityCharts trackPoints={points} cadenceAverage={71} />,
    )
    expect(screen.getByLabelText('Cadence average 71 rpm')).toBeInTheDocument()

    // Without it, the computed average excludes the 0-rpm coasting point
    // (mean of 80 and 90 = 85, not 57 if zeros were included).
    rerender(<ActivityCharts trackPoints={points} />)
    expect(screen.getByLabelText('Cadence average 85 rpm')).toBeInTheDocument()
  })

  it('renders heart-rate zones as an aligned ribbon and hides it without zone data', () => {
    const points = [
      {
        timestamp: '2026-03-14T09:00:00Z',
        distance_from_start_km: 0,
        heart_rate: 118,
        hr_zone: 2,
      },
      {
        timestamp: '2026-03-14T09:10:00Z',
        distance_from_start_km: 5,
        heart_rate: 135,
        hr_zone: 2,
      },
      {
        timestamp: '2026-03-14T09:20:00Z',
        distance_from_start_km: 10,
        heart_rate: 158,
        hr_zone: 4,
      },
      {
        timestamp: '2026-03-14T09:30:00Z',
        distance_from_start_km: 15,
        heart_rate: 148,
        hr_zone: 3,
      },
    ]
    const { rerender } = render(<ActivityCharts trackPoints={points} />)

    expect(screen.getByTestId('heart-rate-zone-ribbon')).toBeInTheDocument()
    expect(screen.getByLabelText('Heart rate zone legend')).toHaveTextContent(
      'Z1Z2Z3Z4Z5',
    )

    rerender(
      <ActivityCharts
        trackPoints={points.map((point) => ({ ...point, hr_zone: null }))}
      />,
    )
    expect(
      screen.queryByTestId('heart-rate-zone-ribbon'),
    ).not.toBeInTheDocument()
  })

  it('consolidates adjacent heart-rate zone samples into ribbon segments', () => {
    expect(
      buildHeartRateZoneSegments(
        [
          { distance: 0, time: 0, heartRateZone: 2 },
          { distance: 1, time: 1, heartRateZone: 2 },
          { distance: 2, time: 2, heartRateZone: 4 },
          { distance: 4, time: 4, heartRateZone: 3 },
        ] as ChartDataPoint[],
        'distance',
      ),
    ).toEqual([
      { zone: 2, startPercent: 0, widthPercent: 50 },
      { zone: 4, startPercent: 50, widthPercent: 50 },
    ])
  })

  it('renders a full-width segment for a single zoned point', () => {
    expect(
      buildHeartRateZoneSegments(
        [{ distance: 3, time: 3, heartRateZone: 2 }] as ChartDataPoint[],
        'distance',
      ),
    ).toEqual([{ zone: 2, startPercent: 0, widthPercent: 100 }])
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
      screen.getByLabelText(
        'Respiration Rate statistics: average 27, minimum 24, maximum 30 breaths per minute',
      ),
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
      screen.getByLabelText(
        'Respiration Rate statistics: average 27, minimum 24, maximum 30 breaths per minute',
      ),
    ).toBeInTheDocument()
  })

  it('explains respiration rate and toggles between raw and smoothed data', async () => {
    const user = userEvent.setup()
    render(
      <ActivityCharts
        trackPoints={[
          {
            timestamp: '2026-03-14T09:00:00Z',
            distance_from_start_km: 0,
            respiration_rate: 24,
          },
          {
            timestamp: '2026-03-14T09:01:00Z',
            distance_from_start_km: 1,
            respiration_rate: 30,
          },
        ]}
      />,
    )

    expect(screen.getByLabelText(/^About Respiration Rate/)).toHaveAttribute(
      'title',
      expect.stringContaining('Estimated breaths per minute'),
    )
    const raw = screen.getByRole('button', { name: 'Raw' })
    const smoothed = screen.getByRole('button', { name: 'Smoothed' })
    expect(raw).toHaveAttribute('aria-pressed', 'true')
    expect(smoothed).toHaveAttribute('aria-pressed', 'false')

    await user.click(smoothed)

    expect(raw).toHaveAttribute('aria-pressed', 'false')
    expect(smoothed).toHaveAttribute('aria-pressed', 'true')
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

import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChartDataPoint } from './ActivityChartData'

const geocoderMocks = vi.hoisted(() => ({
  reverseGeocode: vi.fn(),
}))

vi.mock('@/services/geocoder', () => geocoderMocks)

import { ActivityHoverDetails } from './ActivityHoverDetails'

function chartPoint(overrides: Partial<ChartDataPoint> = {}): ChartDataPoint {
  return {
    timestamp: '2026-05-31T12:34:56Z',
    time: 12.5,
    distance: 3.14,
    distanceKm: 5.05,
    elevation: 120.4,
    speed: 9.8,
    heartRate: 142,
    heartRateZone: 3,
    respirationRate: 27,
    cadence: 84,
    latitude: 40.71234,
    longitude: -74.00567,
    ...overrides,
  }
}

describe('ActivityHoverDetails', () => {
  beforeEach(() => {
    geocoderMocks.reverseGeocode.mockReset()
  })

  it('shows instructional copy when no point is selected', () => {
    render(<ActivityHoverDetails point={null} />)

    expect(
      screen.getByText(/Hover the Elevation or Speed chart/i),
    ).toBeInTheDocument()
    expect(geocoderMocks.reverseGeocode).not.toHaveBeenCalled()
  })

  it('renders metrics and resolves the point address', async () => {
    geocoderMocks.reverseGeocode.mockResolvedValue({
      type: 'FeatureCollection',
      features: [
        {
          properties: {
            label: 'Brooklyn Bridge, New York, NY, USA',
          },
        },
      ],
    })

    render(<ActivityHoverDetails point={chartPoint()} />)

    expect(screen.getByText('120.4 ft')).toBeInTheDocument()
    expect(screen.getByText('9.8 mph')).toBeInTheDocument()
    expect(screen.getByText('Zone 3')).toBeInTheDocument()
    expect(screen.getByText('27 breaths/min')).toBeInTheDocument()
    expect(screen.getByText('3.14 mi (5.05 km)')).toBeInTheDocument()
    expect(screen.getByText('40.71234, -74.00567')).toBeInTheDocument()
    expect(screen.getByText('Resolving…')).toBeInTheDocument()

    await waitFor(() =>
      expect(geocoderMocks.reverseGeocode).toHaveBeenCalledWith(
        40.7123,
        -74.0057,
        1,
      ),
    )
    expect(
      await screen.findByText('Brooklyn Bridge, New York, NY, USA'),
    ).toBeInTheDocument()
  })

  it('shows empty, unavailable, and missing metric fallbacks', async () => {
    geocoderMocks.reverseGeocode.mockResolvedValueOnce({
      type: 'FeatureCollection',
      features: [],
    })

    const { rerender } = render(
      <ActivityHoverDetails
        point={chartPoint({
          latitude: 40.71291,
          longitude: -74.00611,
          elevation: null,
          speed: null,
          heartRate: null,
          heartRateZone: null,
          respirationRate: null,
          distance: null,
          distanceKm: null,
        })}
      />,
    )

    expect(screen.getAllByText('—')).toHaveLength(6)
    expect(await screen.findByText('No address found')).toBeInTheDocument()

    geocoderMocks.reverseGeocode.mockRejectedValueOnce(new Error('offline'))
    rerender(
      <ActivityHoverDetails
        point={chartPoint({ latitude: 40.71341, longitude: -74.00661 })}
      />,
    )

    expect(await screen.findByText('Unavailable')).toBeInTheDocument()
  })
})

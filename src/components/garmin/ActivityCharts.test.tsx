import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityCharts } from './ActivityCharts'

describe('ActivityCharts', () => {
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
})

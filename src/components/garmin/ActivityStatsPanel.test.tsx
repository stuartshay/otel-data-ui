import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityStatsPanel } from './ActivityStatsPanel'

describe('ActivityStatsPanel', () => {
  it('renders converted metrics across activity sections', () => {
    render(
      <ActivityStatsPanel
        activity={{
          distance_km: 10,
          duration_seconds: 3661,
          total_elapsed_time: 4000,
          total_timer_time: 3600,
          total_ascent_m: 100,
          total_descent_m: 80,
          avg_speed_kmh: 9.656064,
          max_speed_kmh: 15,
          avg_heart_rate: 145,
          max_heart_rate: 176,
          avg_cadence: 88,
          max_cadence: 98,
          avg_temperature_c: 20,
          min_temperature_c: 18,
          max_temperature_c: 25,
          calories: 720,
        }}
      />,
    )

    expect(screen.getByText('6.21 mi')).toBeInTheDocument()
    expect(screen.getByText('10.00 km')).toBeInTheDocument()
    expect(screen.getByText('1:01:01')).toBeInTheDocument()
    expect(screen.getByText('10:00 /mi')).toBeInTheDocument()
    expect(screen.getByText('145 bpm')).toBeInTheDocument()
    expect(screen.getByText('68 °F')).toBeInTheDocument()
    expect(screen.getByText('720 kcal')).toBeInTheDocument()
  })

  it('hides HR-dependent sections when hr data is unavailable', () => {
    render(
      <ActivityStatsPanel
        activity={{
          distance_km: 10,
          duration_seconds: 3661,
          hr_available: false,
        }}
      />,
    )

    expect(screen.queryByText('Heart Rate')).not.toBeInTheDocument()
    expect(screen.queryByText('Training Effect')).not.toBeInTheDocument()
    expect(screen.queryByText('Respiration')).not.toBeInTheDocument()
    expect(screen.queryByText('Intensity Minutes')).not.toBeInTheDocument()
  })
})

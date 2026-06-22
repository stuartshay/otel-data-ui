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
          total_strokes: 1793,
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
    expect(screen.getByText((1793).toLocaleString())).toBeInTheDocument()
  })

  it('shows a fallback when total strokes is unavailable', () => {
    render(<ActivityStatsPanel activity={{ total_strokes: null }} />)

    const totalStrokesLabel = screen.getByText('Total Strokes')
    expect(totalStrokesLabel.nextElementSibling).toHaveTextContent('—')
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

  it('counts vigorous intensity minutes as 2x in the total and shows an x2 badge', () => {
    render(
      <ActivityStatsPanel
        activity={{
          distance_km: 10,
          duration_seconds: 3661,
          avg_heart_rate: 145,
          moderate_intensity_minutes: 21,
          vigorous_intensity_minutes: 13,
          // Intentionally stale/incorrect stored total (naive 21 + 13).
          total_intensity_minutes: 34,
        }}
      />,
    )

    expect(screen.getByText('Intensity Minutes')).toBeInTheDocument()
    expect(screen.getByText('21 min')).toBeInTheDocument()
    expect(screen.getByText('13 min')).toBeInTheDocument()
    // Total is computed as 21 + 13 * 2 = 47, not the stale stored 34.
    expect(screen.getByText('47 min')).toBeInTheDocument()
    expect(screen.queryByText('34 min')).not.toBeInTheDocument()
    expect(screen.getByText('x2')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityStatsPanel } from './ActivityStatsPanel'
import { buildHeartRateZoneSummaries } from './heartRateZoneSummary'

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

  it('treats zero heart-rate values as unavailable', () => {
    render(
      <ActivityStatsPanel
        activity={{
          avg_heart_rate: 113,
          max_heart_rate: 136,
          min_heart_rate: 0,
        }}
      />,
    )

    expect(screen.getByText('113 bpm')).toBeInTheDocument()
    expect(screen.getByText('136 bpm')).toBeInTheDocument()
    const minHeartRateLabel = screen.getByText('Min Heart Rate')
    expect(minHeartRateLabel.nextElementSibling).toHaveTextContent('—')
  })

  it('hides heart-rate sections when only sentinel heart-rate values are present', () => {
    render(
      <ActivityStatsPanel
        activity={{
          avg_heart_rate: 0,
          max_heart_rate: -1,
          min_heart_rate: 0,
          hr_available: true,
        }}
      />,
    )

    expect(screen.queryByText('Heart Rate')).not.toBeInTheDocument()
    expect(screen.queryByText('Training Effect')).not.toBeInTheDocument()
    expect(screen.queryByText('Respiration')).not.toBeInTheDocument()
    expect(screen.queryByText('Intensity Minutes')).not.toBeInTheDocument()
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

  it('falls back to the stored total and hides the x2 badge when vigorous minutes are missing', () => {
    render(
      <ActivityStatsPanel
        activity={{
          distance_km: 10,
          duration_seconds: 3661,
          avg_heart_rate: 145,
          moderate_intensity_minutes: 21,
          // vigorous_intensity_minutes intentionally omitted.
          total_intensity_minutes: 30,
        }}
      />,
    )

    expect(screen.getByText('Intensity Minutes')).toBeInTheDocument()
    expect(screen.getByText('21 min')).toBeInTheDocument()
    // Total falls back to the stored value when a component is missing.
    expect(screen.getByText('30 min')).toBeInTheDocument()
    // No x2 badge when vigorous minutes are absent.
    expect(screen.queryByText('x2')).not.toBeInTheDocument()
  })

  it('renders heart-rate zone time totals when zoned chart points are available', () => {
    render(
      <ActivityStatsPanel
        activity={{
          avg_heart_rate: 145,
          max_heart_rate: 176,
          hr_available: true,
        }}
        heartRateZonePoints={[
          {
            timestamp: '2026-03-14T09:00:00Z',
            heart_rate: 118,
            hr_zone: 2,
          },
          {
            timestamp: '2026-03-14T09:10:00Z',
            heart_rate: 135,
            hr_zone: 2,
          },
          {
            timestamp: '2026-03-14T09:20:00Z',
            heart_rate: 158,
            hr_zone: 4,
          },
          {
            timestamp: '2026-03-14T09:30:00Z',
            heart_rate: 148,
            hr_zone: 3,
          },
          {
            timestamp: '2026-03-14T09:40:00Z',
            heart_rate: 149,
            hr_zone: 3,
          },
        ]}
      />,
    )

    expect(screen.getByTestId('heart-rate-zone-breakdown')).toBeInTheDocument()
    expect(screen.getByText('Zone 4')).toBeInTheDocument()
    expect(screen.getByText(/158 bpm/)).toBeInTheDocument()
    expect(screen.getByText(/148 - 149 bpm/)).toBeInTheDocument()
    expect(screen.getByLabelText('Zone 2: 20:00 (50%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Zone 4: 10:00 (25%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Zone 3: 10:00 (25%)')).toBeInTheDocument()
  })

  it('does not render heart-rate zone totals without valid zone durations', () => {
    render(
      <ActivityStatsPanel
        activity={{ avg_heart_rate: 145, hr_available: true }}
        heartRateZonePoints={[
          { timestamp: '2026-03-14T09:00:00Z', heart_rate: 118 },
          { timestamp: '2026-03-14T09:10:00Z', heart_rate: 135 },
        ]}
      />,
    )

    expect(
      screen.queryByTestId('heart-rate-zone-breakdown'),
    ).not.toBeInTheDocument()
  })

  it('builds heart-rate zone summaries from consecutive timestamp deltas', () => {
    expect(
      buildHeartRateZoneSummaries([
        {
          timestamp: '2026-03-14T09:00:00Z',
          heart_rate: 100,
          hr_zone: 1,
        },
        {
          timestamp: '2026-03-14T09:05:00Z',
          heart_rate: 120,
          hr_zone: 2,
        },
        {
          timestamp: '2026-03-14T09:15:00Z',
          heart_rate: 130,
          hr_zone: 2,
        },
        {
          timestamp: '2026-03-14T09:15:00Z',
          heart_rate: 170,
          hr_zone: 5,
        },
        {
          timestamp: '2026-03-14T09:20:00Z',
          heart_rate: 180,
          hr_zone: 8,
        },
      ]),
    ).toEqual([
      {
        zone: 5,
        seconds: 300,
        percent: 25,
        minHeartRate: 170,
        maxHeartRate: 170,
      },
      {
        zone: 4,
        seconds: 0,
        percent: 0,
        minHeartRate: null,
        maxHeartRate: null,
      },
      {
        zone: 3,
        seconds: 0,
        percent: 0,
        minHeartRate: null,
        maxHeartRate: null,
      },
      {
        zone: 2,
        seconds: 600,
        percent: 50,
        minHeartRate: 120,
        maxHeartRate: 130,
      },
      {
        zone: 1,
        seconds: 300,
        percent: 25,
        minHeartRate: 100,
        maxHeartRate: 100,
      },
    ])
  })
})

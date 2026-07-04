import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityLapsTable } from './ActivityLapsTable'
import { buildLapSummary, type ActivityLap } from './ActivityLapsTable.helpers'

function lap(overrides: Partial<ActivityLap> = {}): ActivityLap {
  return {
    id: overrides.lap_index ?? 1,
    lap_index: 1,
    duration_seconds: 60,
    distance_meters: 1609.344,
    paved_distance_meters: 1609.344,
    unpaved_distance_meters: 0,
    avg_speed_mps: 4,
    avg_heart_rate: 120,
    max_heart_rate: 140,
    total_ascent_meters: 10,
    ...overrides,
  }
}

describe('ActivityLapsTable', () => {
  it('builds weighted summary values', () => {
    const summary = buildLapSummary([
      lap({ lap_index: 1, duration_seconds: 100, avg_heart_rate: 120 }),
      lap({ lap_index: 2, duration_seconds: 200, avg_heart_rate: 150 }),
    ])

    expect(summary.durationSeconds).toBe(300)
    expect(summary.distanceMeters).toBeCloseTo(3218.688)
    expect(summary.avgSpeedMps).toBeCloseTo(10.72896)
    expect(summary.avgHeartRate).toBe(140)
    expect(summary.maxHeartRate).toBe(140)
  })

  it('preserves zero summary percentages and ignores unavailable heart rate values', () => {
    const summary = buildLapSummary([
      lap({
        lap_index: 1,
        distance_meters: 1000,
        paved_distance_meters: 0,
        unpaved_distance_meters: 1000,
        avg_heart_rate: 0,
      }),
      lap({
        lap_index: 2,
        distance_meters: 1000,
        paved_distance_meters: 0,
        unpaved_distance_meters: 1000,
        avg_heart_rate: null,
      }),
    ])

    expect(summary.pavedPercent).toBe(0)
    expect(summary.unpavedPercent).toBe(100)
    expect(summary.avgHeartRate).toBeNull()
  })

  it('falls back to distance weighting when heart-rate laps have zero duration', () => {
    const summary = buildLapSummary([
      lap({
        lap_index: 1,
        duration_seconds: 0,
        distance_meters: 1000,
        avg_heart_rate: 120,
      }),
      lap({
        lap_index: 2,
        duration_seconds: 0,
        distance_meters: 3000,
        avg_heart_rate: 160,
      }),
    ])

    expect(summary.avgHeartRate).toBe(150)
  })

  it('renders laps in lap order with cumulative time and summary', () => {
    render(
      <ActivityLapsTable
        laps={[
          lap({ id: 2, lap_index: 2, duration_seconds: 90 }),
          lap({ id: 1, lap_index: 1, duration_seconds: 60 }),
        ]}
      />,
    )

    const rows = screen.getAllByTestId(/lap-row-/)
    const firstCells = within(rows[0]).getAllByRole('cell')
    const secondCells = within(rows[1]).getAllByRole('cell')
    expect(firstCells[0]).toHaveTextContent('1')
    expect(firstCells[1]).toHaveTextContent('1:00')
    expect(firstCells[2]).toHaveTextContent('1:00')
    expect(secondCells[0]).toHaveTextContent('2')
    expect(secondCells[1]).toHaveTextContent('1:30')
    expect(secondCells[2]).toHaveTextContent('2:30')
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getAllByText('2.00')[0]).toBeInTheDocument()
  })

  it('supports selecting rows with click and keyboard', () => {
    render(
      <ActivityLapsTable
        laps={[lap({ lap_index: 1 }), lap({ lap_index: 2 })]}
      />,
    )

    const first = screen.getByTestId('lap-row-1')
    const second = screen.getByTestId('lap-row-2')

    fireEvent.click(first)
    expect(first).toHaveAttribute('data-selected', 'true')

    fireEvent.click(within(second).getByRole('button', { name: '2' }))
    expect(second).toHaveAttribute('data-selected', 'true')
    expect(within(second).getByRole('button', { name: '2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('renders an empty state when no laps are available', () => {
    render(<ActivityLapsTable laps={[]} />)

    expect(
      screen.getByText('No laps found for this activity.'),
    ).toBeInTheDocument()
  })
})

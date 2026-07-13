import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '@/test/renderWithRouter'

const garminHooks = vi.hoisted(() => ({
  useGarminLapsComparisonQuery: vi.fn(),
  useGarminDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => garminHooks)
vi.mock('@/components/shared/DateRangePicker', () => ({
  DateRangePicker: ({
    onRangeChange,
  }: {
    onRangeChange: (from: Date | undefined, to: Date | undefined) => void
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onRangeChange(new Date(2026, 0, 2), new Date(2026, 1, 3))
        }
      >
        Set dates
      </button>
      <button type="button" onClick={() => onRangeChange(undefined, undefined)}>
        Clear dates
      </button>
    </div>
  ),
}))

import { LapComparisonPage } from './LapComparisonPage'

const sampleData = {
  garminLapsComparison: {
    total: 2,
    limit: 50,
    offset: 0,
    items: [
      {
        activity: {
          activity_id: 'a1',
          sport: 'cycling',
          sub_sport: 'road',
          start_time: '2026-07-05T10:00:00Z',
          distance_km: 52,
          duration_seconds: 6000,
          avg_speed_kmh: 27,
          avg_heart_rate: 120,
          max_heart_rate: 150,
          total_ascent_m: 100,
        },
        laps: [
          {
            id: 1,
            activity_id: 'a1',
            lap_index: 1,
            start_time: null,
            end_time: null,
            duration_seconds: 1600,
            distance_meters: 8046,
            avg_speed_mps: 5.0,
            avg_heart_rate: 120,
            max_heart_rate: 140,
            total_ascent_meters: 20,
            total_descent_meters: 18,
            calories: 260,
          },
        ],
      },
      {
        activity: {
          activity_id: 'a2',
          sport: 'cycling',
          sub_sport: 'road',
          start_time: '2026-07-04T10:00:00Z',
          distance_km: 52,
          duration_seconds: 5900,
          avg_speed_kmh: 28,
          avg_heart_rate: 118,
          max_heart_rate: 148,
          total_ascent_m: 100,
        },
        laps: [
          {
            id: 2,
            activity_id: 'a2',
            lap_index: 1,
            start_time: null,
            end_time: null,
            duration_seconds: 1500,
            distance_meters: 8046,
            avg_speed_mps: 5.4,
            avg_heart_rate: 118,
            max_heart_rate: 138,
            total_ascent_meters: 22,
            total_descent_meters: 19,
            calories: 250,
          },
        ],
      },
    ],
  },
}

describe('LapComparisonPage', () => {
  beforeEach(() => {
    garminHooks.useGarminLapsComparisonQuery.mockReset()
    garminHooks.useGarminDateRangeQuery.mockReset()

    garminHooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: {
          min_date: '2025-01-01T00:00:00Z',
          max_date: '2026-07-06T00:00:00Z',
        },
      },
    })

    garminHooks.useGarminLapsComparisonQuery.mockReturnValue({
      data: sampleData,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
  })

  it('renders the matrix with activities and lap columns (default metric: speed)', () => {
    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })

    expect(
      screen.getByRole('heading', { name: /lap comparison/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Lap 1')).toBeInTheDocument()
    expect(screen.getByText('Jul 5, 2026')).toBeInTheDocument()
    expect(screen.getByText('Jul 4, 2026')).toBeInTheDocument()
    // Speed cells: 5.4 mps -> 12.1 mph (PR), 5.0 mps -> 11.2 mph
    expect(screen.getAllByText('12.1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('11.2').length).toBeGreaterThanOrEqual(1)
  })

  it('updates the cells when the metric toggle changes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })

    await user.click(screen.getByRole('button', { name: 'Lap Time' }))

    // Durations: 1600 -> 26:40, 1500 -> 25:00
    expect(screen.getAllByText('26:40').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('25:00').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the empty state when there are no laps', () => {
    garminHooks.useGarminLapsComparisonQuery.mockReturnValue({
      data: {
        garminLapsComparison: { total: 0, limit: 50, offset: 0, items: [] },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })
    expect(screen.getByText(/no laps to compare/i)).toBeInTheDocument()
  })

  it('shows the error state and retries when the Retry button is clicked', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    garminHooks.useGarminLapsComparisonQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'boom' },
      refetch,
    })

    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })
    expect(screen.getByText('boom')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows the loading state while comparison data is unavailable', () => {
    garminHooks.useGarminLapsComparisonQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })
    expect(screen.getByText('Loading laps...')).toBeInTheDocument()
  })

  it('sets and clears date range query variables', async () => {
    const user = userEvent.setup()
    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })

    await user.click(screen.getByRole('button', { name: 'Set dates' }))
    expect(garminHooks.useGarminLapsComparisonQuery).toHaveBeenLastCalledWith({
      variables: {
        sport: 'cycling',
        date_from: '2026-01-02',
        date_to: '2026-02-03',
        limit: 50,
      },
    })

    await user.click(screen.getByRole('button', { name: 'Clear dates' }))
    expect(garminHooks.useGarminLapsComparisonQuery).toHaveBeenLastCalledWith({
      variables: {
        sport: 'cycling',
        date_from: undefined,
        date_to: undefined,
        limit: 50,
      },
    })
  })

  it('uses date and comparison fallbacks when metadata is absent', () => {
    garminHooks.useGarminDateRangeQuery.mockReturnValue({ data: undefined })
    garminHooks.useGarminLapsComparisonQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderWithRouter(<LapComparisonPage />, { route: '/garmin/compare' })
    expect(screen.getByText(/no laps to compare/i)).toBeInTheDocument()
  })
})

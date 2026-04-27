import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { format } from 'date-fns'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let latestBarChartData: Array<Record<string, unknown>> = []

const hooks = vi.hoisted(() => ({
  useGarminActivityTotalsQuery: vi.fn(),
  useGarminDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => hooks)

// Keep Recharts mocked/lightweight and expose BarChart data for assertions.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 800, height: 400 }}>{children}</div>
  ),
  BarChart: ({
    data,
    children,
  }: {
    data?: Array<Record<string, unknown>>
    children?: React.ReactNode
  }) => {
    latestBarChartData = data ?? []
    return <div data-testid="bar-chart">{children}</div>
  },
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Bar: () => null,
}))

import { GarminActivityTotals } from './GarminActivityTotals'

describe('GarminActivityTotals', () => {
  beforeEach(() => {
    latestBarChartData = []
    hooks.useGarminActivityTotalsQuery.mockReset()
    hooks.useGarminDateRangeQuery.mockReset()
    hooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: { min_date: '2010-01-01', max_date: '2026-12-31' },
      },
      loading: false,
    })
  })

  it('renders a loading state while totals are loading', () => {
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GarminActivityTotals />)

    expect(screen.getByText(/Loading activity totals/i)).toBeInTheDocument()
  })

  it('renders an error state and retries on click', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('totals failed'),
      refetch,
    })

    render(<GarminActivityTotals />)

    expect(screen.getByText(/totals failed/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetch).toHaveBeenCalled()
  })

  it('renders an empty state when no buckets are returned', () => {
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: { garminActivityTotals: [] },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GarminActivityTotals />)

    expect(
      screen.getByText(/No activities found for this period/i),
    ).toBeInTheDocument()
  })

  it('passes the selected period to the query and switches metric', async () => {
    const user = userEvent.setup()
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: {
        garminActivityTotals: [
          {
            period_start: '2026-03-01',
            activity_count: 3,
            total_distance_km: 42.5,
            total_duration_seconds: 7200,
            total_ascent_m: 150,
            total_calories: 1800,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GarminActivityTotals />)

    // Default: month period, distance metric
    const currentMonth = new Date().getMonth()
    const expectedFrom = `2010-${String(currentMonth + 1).padStart(2, '0')}-01`
    const expectedTo = format(new Date(2026, currentMonth + 1, 0), 'yyyy-MM-dd')
    expect(hooks.useGarminActivityTotalsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          period: 'month',
          date_from: expectedFrom,
          date_to: expectedTo,
        }),
      }),
    )

    // Switch to weekly
    await user.click(screen.getByRole('radio', { name: 'Weekly' }))
    const lastCall = hooks.useGarminActivityTotalsQuery.mock.calls.at(-1)?.[0]
    expect(lastCall?.variables?.period).toBe('week')

    // Switch metric to Calories — radio should reflect it
    await user.click(screen.getByRole('radio', { name: 'Calories' }))
    expect(screen.getByRole('radio', { name: 'Calories' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('shows month selector and aggregates selected month buckets by year', () => {
    const selectedMonth = new Date().getMonth()
    const currentMonth = String(selectedMonth + 1).padStart(2, '0')
    const excludedMonth = String(((selectedMonth + 1) % 12) + 1).padStart(
      2,
      '0',
    )
    const currentMonthName = new Date().toLocaleString('en-US', {
      month: 'long',
    })

    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: {
        garminActivityTotals: [
          {
            period_start: `2024-${currentMonth}-01`,
            activity_count: 2,
            total_distance_km: 10,
            total_duration_seconds: 3600,
            total_ascent_m: 100,
            total_calories: 500,
          },
          {
            period_start: `2024-${currentMonth}-15`,
            activity_count: 1,
            total_distance_km: 5,
            total_duration_seconds: 1800,
            total_ascent_m: 50,
            total_calories: 200,
          },
          {
            period_start: `2025-${currentMonth}-01`,
            activity_count: 1,
            total_distance_km: 7,
            total_duration_seconds: 2400,
            total_ascent_m: 70,
            total_calories: 300,
          },
          {
            period_start: `2025-${excludedMonth}-01`,
            activity_count: 4,
            total_distance_km: 99,
            total_duration_seconds: 9999,
            total_ascent_m: 999,
            total_calories: 999,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GarminActivityTotals />)

    // Monthly mode shows the month selector and default month context.
    const monthSelect = screen.getByRole('combobox', { name: /select month/i })
    expect(monthSelect).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${currentMonthName} by year`, 'i')),
    ).toBeInTheDocument()

    // Date range should be constrained to selected month across min/max years.
    const lastCall = hooks.useGarminActivityTotalsQuery.mock.calls.at(-1)?.[0]
    expect(lastCall?.variables?.date_from).toBe(`2010-${currentMonth}-01`)
    expect(lastCall?.variables?.date_to).toBe(
      format(new Date(2026, selectedMonth + 1, 0), 'yyyy-MM-dd'),
    )

    // Chart data is aggregated by year for selected month only.
    expect(latestBarChartData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: '2024',
          activity_count: 3,
          distance_km: 15,
          total_ascent_m: 150,
          total_calories: 700,
        }),
        expect.objectContaining({
          label: '2025',
          activity_count: 1,
          distance_km: 7,
          total_ascent_m: 70,
          total_calories: 300,
        }),
      ]),
    )
    expect(latestBarChartData).toHaveLength(2)
  })
})

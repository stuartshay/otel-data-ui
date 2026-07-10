import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { format, subDays } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Freeze the system clock so weekly-mode tests that derive labels and query
// variables from `new Date()` are deterministic regardless of when CI runs.
const FROZEN_NOW = new Date('2026-04-15T12:00:00Z')

let latestBarChartData: Array<Record<string, unknown>> = []

const hooks = vi.hoisted(() => ({
  useGarminActivityTotalsQuery: vi.fn(),
  useGarminDateRangeQuery: vi.fn(),
  GarminActivityTotalsDocument: { kind: 'Document' },
}))

const apolloMocks = vi.hoisted(() => ({
  useApolloClient: vi.fn(),
  query: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => hooks)
vi.mock('@apollo/client/react', () => ({
  useApolloClient: apolloMocks.useApolloClient,
}))

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
    vi.useFakeTimers({
      now: FROZEN_NOW,
      shouldAdvanceTime: true,
      toFake: ['Date'],
    })
    latestBarChartData = []
    hooks.useGarminActivityTotalsQuery.mockReset()
    hooks.useGarminDateRangeQuery.mockReset()
    hooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: { min_date: '2010-01-01', max_date: '2026-12-31' },
      },
      loading: false,
    })
    apolloMocks.useApolloClient.mockReset()
    apolloMocks.query.mockReset()
    apolloMocks.query.mockResolvedValue({
      data: { garminActivityTotals: [] },
    })
    apolloMocks.useApolloClient.mockReturnValue({ query: apolloMocks.query })
  })

  afterEach(() => {
    vi.useRealTimers()
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

    // Switch to weekly: main hook is skipped; per-year imperative queries fire.
    await user.click(screen.getByRole('radio', { name: 'Weekly' }))
    await waitFor(() => {
      expect(apolloMocks.query).toHaveBeenCalled()
    })
    const lastApolloCall = apolloMocks.query.mock.calls.at(-1)?.[0]
    expect(lastApolloCall?.variables?.period).toBe('week')
    // Default window: today minus 6 days … today, projected per year.
    const today = new Date()
    const start = subDays(today, 6)
    // Most recent year query should target the current-year window.
    const currentYearCalls = apolloMocks.query.mock.calls.filter((c) => {
      const v = c[0]?.variables
      return v?.date_to === format(today, 'yyyy-MM-dd')
    })
    expect(currentYearCalls.length).toBeGreaterThan(0)
    expect(currentYearCalls[0][0].variables.date_from).toBe(
      format(start, 'yyyy-MM-dd'),
    )

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
            period_start: `2010-${currentMonth}-01`,
            activity_count: 1,
            total_distance_km: 3,
            total_duration_seconds: 1200,
            total_ascent_m: 20,
            total_calories: 100,
          },
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

    // Chart data is aggregated by year for selected month only, with all
    // years in the Garmin date range zero-filled so the x-axis is continuous.
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
    // 2010..2026 inclusive = 17 years.
    expect(latestBarChartData).toHaveLength(17)
    // Years without activity should appear as zero buckets.
    expect(latestBarChartData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: '2011',
          activity_count: 0,
          distance_km: 0,
        }),
      ]),
    )
  })

  it('omits empty years before the earliest returned activity bucket', () => {
    const selectedMonth = new Date().getMonth()
    const currentMonth = String(selectedMonth + 1).padStart(2, '0')
    hooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: { min_date: '1999-01-01', max_date: '2026-12-31' },
      },
      loading: false,
    })
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: {
        garminActivityTotals: [
          {
            period_start: `2010-${currentMonth}-01`,
            activity_count: 1,
            total_distance_km: 10,
            total_duration_seconds: 3600,
            total_ascent_m: 100,
            total_calories: 500,
          },
          {
            period_start: `2012-${currentMonth}-01`,
            activity_count: 1,
            total_distance_km: 12,
            total_duration_seconds: 3600,
            total_ascent_m: 120,
            total_calories: 600,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GarminActivityTotals />)

    expect(latestBarChartData[0]).toEqual(
      expect.objectContaining({ label: '2010', distance_km: 10 }),
    )
    expect(latestBarChartData.map(({ label }) => label)).not.toContain('1999')
    expect(latestBarChartData.map(({ label }) => label)).not.toContain('2009')
    expect(latestBarChartData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '2011', distance_km: 0 }),
        expect.objectContaining({ label: '2012', distance_km: 12 }),
      ]),
    )
  })

  it('yearly mode omits imported pre-2010 buckets but preserves later gaps', async () => {
    hooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: { min_date: '1999-01-01', max_date: '2026-12-31' },
      },
      loading: false,
    })
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: {
        garminActivityTotals: [
          {
            period_start: '1999-01-01',
            activity_count: 1,
            total_distance_km: 9.52,
            total_duration_seconds: 3132,
            total_ascent_m: 31,
            total_calories: 172,
          },
          {
            period_start: '2009-01-01',
            activity_count: 4,
            total_distance_km: 0,
            total_duration_seconds: 0,
            total_ascent_m: 0,
            total_calories: 0,
          },
          {
            period_start: '2010-01-01',
            activity_count: 1,
            total_distance_km: 10,
            total_duration_seconds: 3600,
            total_ascent_m: 100,
            total_calories: 500,
          },
          {
            period_start: '2012-01-01',
            activity_count: 1,
            total_distance_km: 12,
            total_duration_seconds: 3600,
            total_ascent_m: 120,
            total_calories: 600,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    const user = userEvent.setup()
    render(<GarminActivityTotals />)

    await user.click(screen.getByRole('radio', { name: 'Yearly' }))

    await waitFor(() => {
      expect(latestBarChartData[0]).toEqual(
        expect.objectContaining({ label: '2010', distance_km: 10 }),
      )
    })
    expect(latestBarChartData.map(({ label }) => label)).not.toContain('1999')
    expect(latestBarChartData.map(({ label }) => label)).not.toContain('2009')
    expect(latestBarChartData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '2011', distance_km: 0 }),
        expect.objectContaining({ label: '2012', distance_km: 12 }),
      ]),
    )
  })

  it('weekly mode omits leading zero projected years but preserves later gaps', async () => {
    hooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: { min_date: '1999-01-01', max_date: '2026-12-31' },
      },
      loading: false,
    })
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    apolloMocks.query.mockImplementation(({ variables }) => {
      const year = Number(variables.date_to.slice(0, 4))
      const distanceByYear = new Map([
        [2010, 10],
        [2012, 12],
      ])
      const distance = distanceByYear.get(year) ?? 0
      return Promise.resolve({
        data: {
          garminActivityTotals:
            distance > 0
              ? [
                  {
                    period_start: variables.date_from,
                    activity_count: 1,
                    total_distance_km: distance,
                    total_duration_seconds: 3600,
                    total_ascent_m: 100,
                    total_calories: 500,
                  },
                ]
              : [],
        },
      })
    })

    const user = userEvent.setup()
    render(<GarminActivityTotals />)

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))

    await waitFor(() => {
      expect(latestBarChartData[0]).toEqual(
        expect.objectContaining({ label: '2010', distance_km: 10 }),
      )
    })
    expect(latestBarChartData.map(({ label }) => label)).not.toContain('1999')
    expect(latestBarChartData.map(({ label }) => label)).not.toContain('2009')
    expect(latestBarChartData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '2011', distance_km: 0 }),
        expect.objectContaining({ label: '2012', distance_km: 12 }),
      ]),
    )
  })

  it('weekly mode renders default 7-day window pill and projects per year', async () => {
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    // Each year-query returns one bucket with year-derived totals.
    apolloMocks.query.mockImplementation(({ variables }) => {
      const year = Number(variables.date_to.slice(0, 4))
      return Promise.resolve({
        data: {
          garminActivityTotals: [
            {
              period_start: variables.date_from,
              activity_count: 1,
              total_distance_km: year - 2000,
              total_duration_seconds: 3600,
              total_ascent_m: 10,
              total_calories: 100,
            },
          ],
        },
      })
    })

    const user = userEvent.setup()
    render(<GarminActivityTotals />)

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))

    // Pill renders the current 7-day window.
    const today = new Date()
    const start = subDays(today, 6)
    const expectedLabel = `${format(start, 'MMM d')} – ${format(today, 'MMM d')}`
    await waitFor(() => {
      expect(screen.getByTestId('week-range-pill')).toHaveTextContent(
        expectedLabel,
      )
    })

    // One query per year from min_date (2010) to weekEnd year.
    const expectedYears = today.getFullYear() - 2010 + 1
    await waitFor(() => {
      expect(apolloMocks.query).toHaveBeenCalledTimes(expectedYears)
    })

    // Chart data has one bar per year, distance increasing with year.
    await waitFor(() => {
      expect(latestBarChartData).toHaveLength(expectedYears)
    })
    expect(latestBarChartData[0]).toEqual(
      expect.objectContaining({ label: '2010', distance_km: 10 }),
    )
    expect(latestBarChartData.at(-1)).toEqual(
      expect.objectContaining({ label: String(today.getFullYear()) }),
    )
  })

  it('weekly mode pages backward and forward by 7 days', async () => {
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    const user = userEvent.setup()
    render(<GarminActivityTotals />)

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))

    const today = new Date()
    const initialStart = subDays(today, 6)
    await waitFor(() => {
      expect(screen.getByTestId('week-range-pill')).toHaveTextContent(
        `${format(initialStart, 'MMM d')} – ${format(today, 'MMM d')}`,
      )
    })

    // Prev shifts window back 7 days.
    apolloMocks.query.mockClear()
    await user.click(screen.getByRole('button', { name: /previous week/i }))
    const prevEnd = subDays(today, 7)
    const prevStart = subDays(prevEnd, 6)
    await waitFor(() => {
      expect(screen.getByTestId('week-range-pill')).toHaveTextContent(
        `${format(prevStart, 'MMM d')} – ${format(prevEnd, 'MMM d')}`,
      )
    })

    // Next shifts back to original window.
    await user.click(screen.getByRole('button', { name: /next week/i }))
    await waitFor(() => {
      expect(screen.getByTestId('week-range-pill')).toHaveTextContent(
        `${format(initialStart, 'MMM d')} – ${format(today, 'MMM d')}`,
      )
    })
  })

  it('weekly mode hides month selector and shows pagination only in week mode', async () => {
    hooks.useGarminActivityTotalsQuery.mockReturnValue({
      data: { garminActivityTotals: [] },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    const user = userEvent.setup()
    render(<GarminActivityTotals />)

    // Default is monthly: month selector visible, pagination not rendered.
    expect(
      screen.getByRole('combobox', { name: /select month/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /previous week/i }),
    ).not.toBeInTheDocument()

    // Switch to weekly: pagination appears, month selector disappears.
    await user.click(screen.getByRole('radio', { name: 'Weekly' }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /previous week/i }),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('combobox', { name: /select month/i }),
    ).not.toBeInTheDocument()

    // Switch back to monthly: pagination disappears, month selector returns.
    await user.click(screen.getByRole('radio', { name: 'Monthly' }))
    expect(
      screen.queryByRole('button', { name: /previous week/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /select month/i }),
    ).toBeInTheDocument()
  })
})

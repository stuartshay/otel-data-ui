import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({
  useGarminActivityTotalsQuery: vi.fn(),
  useGarminDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => hooks)

// Recharts uses ResponsiveContainer which needs a sized parent in jsdom; stub it.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  }
})

import { GarminActivityTotals } from './GarminActivityTotals'

describe('GarminActivityTotals', () => {
  beforeEach(() => {
    hooks.useGarminActivityTotalsQuery.mockReset()
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
    expect(hooks.useGarminActivityTotalsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          period: 'month',
          date_from: '2010-01-01',
          date_to: '2026-12-31',
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
})

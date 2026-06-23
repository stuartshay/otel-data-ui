import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Freeze the clock so the default trailing 7-day window is deterministic.
// 2026-06-23 is a Tuesday => window is Jun 17 (Wed) .. Jun 23 (Tue).
const FROZEN_NOW = new Date('2026-06-23T12:00:00Z')

let latestBarChartData: Array<Record<string, unknown>> = []

const hooks = vi.hoisted(() => ({
  useGarminActivitiesQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => hooks)

// Keep Recharts lightweight and expose BarChart data for assertions.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 800, height: 200 }}>{children}</div>
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
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  XAxis: () => null,
  Tooltip: () => null,
}))

import { CyclingInFocus } from './CyclingInFocus'

const SAMPLE_ITEMS = [
  {
    activity_id: 'a1',
    sport: 'cycling',
    start_time: '2026-06-18T08:00:00',
    distance_km: 50,
    duration_seconds: 3600,
  },
  {
    activity_id: 'a2',
    sport: 'cycling',
    start_time: '2026-06-20T08:00:00',
    distance_km: 50,
    duration_seconds: 7200,
  },
]

function mockActivities(items: typeof SAMPLE_ITEMS) {
  hooks.useGarminActivitiesQuery.mockReturnValue({
    data: { garminActivities: { items, total: items.length } },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })
}

describe('CyclingInFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: FROZEN_NOW,
      shouldAdvanceTime: true,
      toFake: ['Date'],
    })
    latestBarChartData = []
    hooks.useGarminActivitiesQuery.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('queries cycling activities for the current trailing week', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    expect(hooks.useGarminActivitiesQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          sport: 'cycling',
          date_from: '2026-06-17',
          date_to: '2026-06-23',
        }),
      }),
    )
    expect(screen.getByTestId('in-focus-week-range')).toHaveTextContent(
      'Jun 17 – Jun 23',
    )
  })

  it('aggregates distance (mi) and total time across the week', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    // 100 km total => 62.14 mi
    expect(screen.getByTestId('in-focus-total-distance')).toHaveTextContent(
      '62.14',
    )
    // 3600 + 7200 = 10800s => 3:00:00
    expect(screen.getByText('3:00:00')).toBeInTheDocument()
    expect(screen.getByText('2 rides this week')).toBeInTheDocument()
  })

  it('builds seven daily buckets with weekday initials and per-day distance', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    expect(latestBarChartData).toHaveLength(7)
    expect(latestBarChartData.map((d) => d.label)).toEqual([
      'W',
      'T',
      'F',
      'S',
      'S',
      'M',
      'T',
    ])
    const jun18 = latestBarChartData.find((d) => d.key === '2026-06-18')
    expect(jun18?.distance_mi).toBeCloseTo(31.07, 1)
  })

  it('navigates to the previous week and re-queries', async () => {
    const user = userEvent.setup()
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    await user.click(screen.getByRole('button', { name: 'Previous week' }))

    await waitFor(() => {
      expect(screen.getByTestId('in-focus-week-range')).toHaveTextContent(
        'Jun 10 – Jun 16',
      )
    })
    expect(hooks.useGarminActivitiesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          date_from: '2026-06-10',
          date_to: '2026-06-16',
        }),
      }),
    )
  })

  it('renders an error state with a retry action', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    hooks.useGarminActivitiesQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('activities failed'),
      refetch,
    })

    render(<CyclingInFocus />)

    expect(screen.getByText('activities failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})

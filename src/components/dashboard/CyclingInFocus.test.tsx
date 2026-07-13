import { render, screen, waitFor } from '@testing-library/react'
import {
  cloneElement,
  createElement,
  type ElementType,
  type ReactElement,
} from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Freeze the clock so the default trailing 7-day window is deterministic.
// 2026-06-23 is a Tuesday => window is Jun 17 (Wed) .. Jun 23 (Tue).
const FROZEN_NOW = new Date('2026-06-23T12:00:00Z')

let latestBarChartData: Array<Record<string, unknown>> = []
let latestXAxisProps: Record<string, unknown> = {}
type TooltipContentProps = {
  active?: boolean
  payload?: Array<{ payload: unknown }>
}

let latestTooltipContent: ReactElement<TooltipContentProps> | null = null
let latestBarShape: ElementType | null = null

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
  Bar: ({
    children,
    shape,
  }: {
    children?: React.ReactNode
    shape?: ElementType
  }) => {
    latestBarShape = shape ?? null
    return <div>{children}</div>
  },
  Rectangle: (props: React.SVGProps<SVGRectElement>) => <rect {...props} />,
  XAxis: (props: Record<string, unknown>) => {
    latestXAxisProps = props
    return null
  },
  Tooltip: ({ content }: { content?: ReactElement<TooltipContentProps> }) => {
    latestTooltipContent = content ?? null
    return null
  },
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
    latestXAxisProps = {}
    latestTooltipContent = null
    latestBarShape = null
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
    expect(screen.getByText('Last 4w · 2 rides')).toBeInTheDocument()
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
    const jun18 = latestBarChartData.find((d) => d.date === '2026-06-18')
    expect(jun18?.distance_mi).toBeCloseTo(31.07, 1)
  })

  it('keeps same-day rides as separate tooltip activities while aggregating the bar', () => {
    mockActivities([
      {
        activity_id: 'a1',
        sport: 'cycling',
        start_time: '2026-06-20T08:00:00',
        distance_km: 25.77,
        duration_seconds: 6480,
      },
      {
        activity_id: 'a2',
        sport: 'cycling',
        start_time: '2026-06-20T14:00:00',
        distance_km: 18.56,
        duration_seconds: 5040,
      },
    ])

    render(<CyclingInFocus />)

    const jun20 = latestBarChartData.find((d) => d.date === '2026-06-20')
    expect(jun20?.count).toBe(2)
    expect(jun20?.distance_mi).toBeCloseTo(27.55, 1)
    expect(jun20?.activities).toEqual([
      expect.objectContaining({
        activity_id: 'a1',
        distance_km: 25.77,
        duration_seconds: 6480,
      }),
      expect.objectContaining({
        activity_id: 'a2',
        distance_km: 18.56,
        duration_seconds: 5040,
      }),
    ])
  })

  it('uses unique date keys for the chart axis while rendering one-letter ticks', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    expect(latestXAxisProps.dataKey).toBe('date')
    const tickFormatter = latestXAxisProps.tickFormatter as (
      value: unknown,
      index: number,
    ) => string
    expect(tickFormatter('2026-06-18', 0)).toBe('W')
    expect(tickFormatter('2026-06-18', 1)).toBe('T')
    expect(tickFormatter('2026-06-21', 4)).toBe('S')
    expect(tickFormatter('missing', 99)).toBe('')
    expect(new Set(latestBarChartData.map((d) => d.date)).size).toBe(7)
  })

  it('renders populated and empty tooltip states with correct pluralization', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    expect(latestTooltipContent).not.toBeNull()
    const populatedDay = latestBarChartData.find(
      (day) => day.date === '2026-06-18',
    )
    const emptyDay = latestBarChartData.find((day) => day.date === '2026-06-17')

    const populatedTooltip = render(
      cloneElement(latestTooltipContent!, {
        active: true,
        payload: [{ payload: populatedDay }],
      }),
    )
    expect(populatedTooltip.getByText('Thu, Jun 18, 2026')).toBeInTheDocument()
    expect(populatedTooltip.getByText('1 activity')).toBeInTheDocument()
    expect(populatedTooltip.getByText('31.07 mi')).toBeInTheDocument()
    populatedTooltip.unmount()

    const emptyTooltip = render(
      cloneElement(latestTooltipContent!, {
        active: true,
        payload: [{ payload: emptyDay }],
      }),
    )
    expect(emptyTooltip.getByText('0 activities')).toBeInTheDocument()
    expect(emptyTooltip.getByText('No activities.')).toBeInTheDocument()
  })

  it('does not render an inactive tooltip or one without a day', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    const inactive = render(
      cloneElement(latestTooltipContent!, { active: false }),
    )
    expect(inactive.container).toBeEmptyDOMElement()
    inactive.unmount()

    const missingDay = render(
      cloneElement(latestTooltipContent!, { active: true, payload: [] }),
    )
    expect(missingDay.container).toBeEmptyDOMElement()
  })

  it('uses full opacity for active bars and muted opacity for empty bars', () => {
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    expect(latestBarShape).not.toBeNull()
    const activeBar = render(
      createElement(latestBarShape!, {
        payload: { distance_mi: 10 },
      }),
    )
    expect(activeBar.container.querySelector('rect')).toHaveAttribute(
      'fill-opacity',
      '1',
    )
    activeBar.unmount()

    const emptyBar = render(createElement(latestBarShape!, {}))
    expect(emptyBar.container.querySelector('rect')).toHaveAttribute(
      'fill-opacity',
      '0.2',
    )
  })

  it('ignores undated and out-of-window activities and defaults missing totals', () => {
    hooks.useGarminActivitiesQuery.mockImplementation(
      ({ variables }: { variables: { date_from: string } }) => {
        const items =
          variables.date_from === '2026-06-17'
            ? [
                {
                  activity_id: 'undated',
                  sport: 'cycling',
                  start_time: null,
                  distance_km: 99,
                  duration_seconds: 99,
                },
                {
                  activity_id: 'outside',
                  sport: 'cycling',
                  start_time: '2026-06-16T08:00:00',
                  distance_km: 99,
                  duration_seconds: 99,
                },
                {
                  activity_id: 'missing-totals',
                  sport: 'cycling',
                  start_time: '2026-06-18T08:00:00',
                  distance_km: null,
                  duration_seconds: null,
                },
              ]
            : []
        return {
          data: { garminActivities: { items, total: items.length } },
          loading: false,
          error: undefined,
          refetch: vi.fn(),
        }
      },
    )

    render(<CyclingInFocus />)

    expect(screen.getByTestId('in-focus-total-distance')).toHaveTextContent(
      '0.00',
    )
    expect(screen.getByText('0:00')).toBeInTheDocument()
    const jun18 = latestBarChartData.find((day) => day.date === '2026-06-18')
    expect(jun18).toMatchObject({
      count: 1,
      distance_mi: 0,
      duration_seconds: 0,
    })
  })

  it('shows recent loading, zero rides, and a singular ride label', () => {
    let recentLoading = true
    let recentItems: typeof SAMPLE_ITEMS = []
    hooks.useGarminActivitiesQuery.mockImplementation(
      ({ variables }: { variables: { date_from: string } }) => {
        const isRecent = variables.date_from === '2026-05-27'
        const items = isRecent ? recentItems : []
        return {
          data: { garminActivities: { items, total: items.length } },
          loading: isRecent && recentLoading,
          error: undefined,
          refetch: vi.fn(),
        }
      },
    )

    const view = render(<CyclingInFocus />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()

    recentLoading = false
    view.rerender(<CyclingInFocus />)
    expect(screen.getByText('Last 4w · 0 rides')).toBeInTheDocument()

    recentItems = [SAMPLE_ITEMS[0]]
    view.rerender(<CyclingInFocus />)
    expect(screen.getByText('Last 4w · 1 ride')).toBeInTheDocument()
    expect(screen.getByTestId('in-focus-activity-strip')).toHaveAttribute(
      'aria-label',
      '1 ride in the last 4 weeks',
    )
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

  it('disables the Next week arrow on the current week and re-enables it after paging back', async () => {
    const user = userEvent.setup()
    mockActivities(SAMPLE_ITEMS)

    render(<CyclingInFocus />)

    const nextButton = screen.getByRole('button', { name: 'Next week' })
    expect(nextButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous week' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Next week' }),
      ).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Next week' }))

    await waitFor(() => {
      expect(screen.getByTestId('in-focus-week-range')).toHaveTextContent(
        'Jun 17 – Jun 23',
      )
    })
    expect(hooks.useGarminActivitiesQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          date_from: '2026-06-17',
          date_to: '2026-06-23',
        }),
      }),
    )
  })
})

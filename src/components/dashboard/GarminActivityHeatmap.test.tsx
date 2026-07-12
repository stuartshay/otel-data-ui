import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted mocks for the generated graphql hook so we can drive different
// query results per test.
const hooks = vi.hoisted(() => ({
  useDailySummaryQuery: vi.fn(),
  // GarminDayActivitiesPopover renders inside the heatmap and pulls
  // activities lazily; provide a stub so it doesn't blow up the mock.
  useGarminActivitiesQuery: vi.fn(() => ({
    data: undefined,
    loading: false,
    error: undefined,
  })),
}))

vi.mock('@/__generated__/graphql', () => hooks)

// react-calendar-heatmap renders an SVG that is heavy in JSDOM; replace it
// with a lightweight stub that exposes the values prop for assertions so the
// tests can verify what the component derived from the GraphQL response.
let latestHeatmapValues: Array<{ date: string; count: number }> = []
let latestHeatmapProps: Record<string, unknown> = {}
let latestPopoverProps: Record<string, unknown> = {}

vi.mock('react-calendar-heatmap', () => ({
  default: (props: {
    values: Array<{ date: string; count: number }>
    classForValue: (value?: { date: string; count?: number }) => string
    titleForValue: (value?: { date: string; count?: number }) => string
    onClick: (value?: { date: string; count?: number }) => void
  }) => {
    const { values } = props
    latestHeatmapValues = values
    latestHeatmapProps = props
    return (
      <svg data-testid="heatmap-stub">
        {values.map((v) => (
          <rect
            key={v.date}
            data-date={v.date}
            data-count={v.count}
            onClick={() => props.onClick(v)}
          />
        ))}
      </svg>
    )
  },
}))

vi.mock('./GarminDayActivitiesPopover', () => ({
  GarminDayActivitiesPopover: (props: Record<string, unknown>) => {
    latestPopoverProps = props
    return <div data-testid="activities-popover" />
  },
}))

import { GarminActivityHeatmap } from './GarminActivityHeatmap'

describe('GarminActivityHeatmap', () => {
  beforeEach(() => {
    latestHeatmapValues = []
    latestHeatmapProps = {}
    latestPopoverProps = {}
    hooks.useDailySummaryQuery.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the loading state while the query is in flight', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    })

    render(<GarminActivityHeatmap />)

    expect(screen.getByText(/Loading activity data/i)).toBeInTheDocument()
  })

  it('renders the error state when the query fails', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('boom'),
    })

    render(<GarminActivityHeatmap />)

    expect(
      screen.getByText(/Failed to load activity data/i),
    ).toBeInTheDocument()
  })

  // Regression test: the gateway returns a `DailySummaryConnection`
  // (`{ items, total, limit, offset }`) — not a bare array. If the component
  // forgets to read `.items`, this test fails because the for-of over the
  // connection object surfaces as zero values aggregated and the heatmap
  // never receives the activity-day rectangles.
  it('reads dailySummary.items from the Connection response shape', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: {
          __typename: 'DailySummaryConnection',
          items: [
            { activity_date: '2026-04-15', garmin_activities: 2 },
            { activity_date: '2026-04-16', garmin_activities: 1 },
            { activity_date: '2026-04-17', garmin_activities: null },
          ],
          total: 3,
          limit: 365,
          offset: 0,
        },
      },
      loading: false,
      error: undefined,
    })

    render(<GarminActivityHeatmap />)

    // Summary line aggregates only days with activity counts.
    expect(screen.getByText(/3 activities over 2 days/i)).toBeInTheDocument()

    // The component must forward the parsed values into the heatmap with
    // the correct shape. Days with null/0 activities are excluded.
    expect(latestHeatmapValues).toEqual(
      expect.arrayContaining([
        { date: '2026-04-15', count: 2 },
        { date: '2026-04-16', count: 1 },
      ]),
    )
    expect(
      latestHeatmapValues.find((v) => v.date === '2026-04-17'),
    ).toBeUndefined()
  })

  it('renders an empty summary when the Connection has no items', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: {
          __typename: 'DailySummaryConnection',
          items: [],
          total: 0,
          limit: 365,
          offset: 0,
        },
      },
      loading: false,
      error: undefined,
    })

    render(<GarminActivityHeatmap />)

    expect(screen.getByText(/0 activities over 0 days/i)).toBeInTheDocument()
    expect(latestHeatmapValues).toEqual([])
  })

  it('aggregates duplicate dates and ignores incomplete summaries', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: {
          items: [
            { activity_date: '2026-04-15', garmin_activities: 1 },
            { activity_date: '2026-04-15', garmin_activities: 3 },
            { activity_date: null, garmin_activities: 2 },
            { activity_date: '2026-04-16', garmin_activities: 0 },
          ],
        },
      },
      loading: false,
      error: undefined,
    })

    render(<GarminActivityHeatmap />)

    expect(latestHeatmapValues).toEqual([{ date: '2026-04-15', count: 4 }])
    expect(screen.getByText(/4 activities over 1 day/i)).toBeInTheDocument()
  })

  it('formats heatmap color classes and titles for every count band', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: { dailySummary: { items: [] } },
      loading: false,
      error: undefined,
    })
    render(<GarminActivityHeatmap />)

    const classForValue = latestHeatmapProps.classForValue as (value?: {
      date: string
      count?: number
    }) => string
    const titleForValue = latestHeatmapProps.titleForValue as (value?: {
      date: string
      count?: number
    }) => string

    expect(classForValue()).toBe('color-empty')
    expect(classForValue({ date: 'd', count: 1 })).toBe('color-scale-1')
    expect(classForValue({ date: 'd', count: 2 })).toBe('color-scale-2')
    expect(classForValue({ date: 'd', count: 3 })).toBe('color-scale-3')
    expect(classForValue({ date: 'd', count: 4 })).toBe('color-scale-4')
    expect(titleForValue()).toBe('No activities')
    expect(titleForValue({ date: '2026-01-01', count: 0 })).toBe(
      'No activities on 2026-01-01',
    )
    expect(titleForValue({ date: '2026-01-01', count: 1 })).toBe(
      '1 activity on 2026-01-01',
    )
    expect(titleForValue({ date: '2026-01-01', count: 2 })).toBe(
      '2 activities on 2026-01-01',
    )
  })

  it('opens the activities popover at the clicked heatmap cell', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: {
          items: [{ activity_date: '2026-04-15', garmin_activities: 2 }],
        },
      },
      loading: false,
      error: undefined,
    })
    render(<GarminActivityHeatmap />)

    const cell = document.querySelector('rect')!
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 8,
      height: 6,
    } as DOMRect)
    fireEvent.click(cell)

    expect(latestPopoverProps).toEqual(
      expect.objectContaining({
        date: '2026-04-15',
        open: true,
        anchorPos: { x: 14, y: 23 },
      }),
    )
  })

  it('ignores heatmap clicks without a date or activity count', () => {
    hooks.useDailySummaryQuery.mockReturnValue({
      data: { dailySummary: { items: [] } },
      loading: false,
      error: undefined,
    })
    render(<GarminActivityHeatmap />)

    const onClick = latestHeatmapProps.onClick as (value?: {
      date: string
      count?: number
    }) => void
    onClick()
    onClick({ date: '2026-01-01', count: 0 })
    expect(latestPopoverProps).toEqual(
      expect.objectContaining({ date: null, open: false }),
    )
  })
})

import { render, screen } from '@testing-library/react'
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
let latestHeatmapValues: Array<{ date: Date; dateStr: string; count: number }> =
  []

vi.mock('react-calendar-heatmap', () => ({
  default: ({
    values,
  }: {
    values: Array<{ date: Date; dateStr: string; count: number }>
  }) => {
    latestHeatmapValues = values
    return (
      <svg data-testid="heatmap-stub">
        {values.map((v) => (
          <rect key={v.dateStr} data-date={v.dateStr} data-count={v.count} />
        ))}
      </svg>
    )
  },
}))

import { GarminActivityHeatmap } from './GarminActivityHeatmap'

describe('GarminActivityHeatmap', () => {
  beforeEach(() => {
    latestHeatmapValues = []
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
    // the correct shape. `date` is a local-midnight Date (avoids the
    // `new Date('YYYY-MM-DD')` UTC-shift inside react-calendar-heatmap),
    // and `dateStr` preserves the ISO string for popover/title use.
    // Days with null/0 activities are excluded.
    expect(latestHeatmapValues).toEqual(
      expect.arrayContaining([
        {
          date: new Date(2026, 3, 15),
          dateStr: '2026-04-15',
          count: 2,
        },
        {
          date: new Date(2026, 3, 16),
          dateStr: '2026-04-16',
          count: 1,
        },
      ]),
    )
    expect(
      latestHeatmapValues.find((v) => v.dateStr === '2026-04-17'),
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
})

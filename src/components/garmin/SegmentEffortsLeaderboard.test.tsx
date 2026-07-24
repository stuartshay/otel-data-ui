import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SegmentEffortsLeaderboard } from './SegmentEffortsLeaderboard'
import type { SegmentEffort } from './segmentEfforts'

const seriesHooks = vi.hoisted(() => ({
  useGarminSegmentEffortSeriesBatchQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => seriesHooks)

function effort(overrides: Partial<SegmentEffort>): SegmentEffort {
  return {
    rank: 1,
    activity_id: 'activity',
    sport: 'cycling',
    activity_start_time: '2026-07-01T10:00:00Z',
    effort_start: '2026-07-01T10:00:00Z',
    effort_end: '2026-07-01T10:01:30Z',
    elapsed_seconds: 90,
    distance_km: 0.43,
    avg_speed_kmh: 16,
    avg_heart_rate: 150,
    max_heart_rate: 160,
    ...overrides,
  }
}

function batchResult(
  itemsBins: Array<
    Array<Partial<{ speed_kmh: number | null; heart_rate: number | null }>>
  >,
) {
  return {
    loading: false,
    data: {
      garminSegmentEffortSeriesBatch: {
        items: itemsBins.map((bins) => ({
          activity_id: 'activity',
          effort_start: '2026-07-01T10:00:00Z',
          effort_end: '2026-07-01T10:01:30Z',
          bin_count: bins.length,
          bins: bins.map((b, index) => ({
            index,
            fraction: (index + 0.5) / bins.length,
            speed_kmh: b.speed_kmh ?? null,
            heart_rate: b.heart_rate ?? null,
          })),
        })),
      },
    },
  }
}

function renderLeaderboard(
  efforts: SegmentEffort[],
  props: { segmentId?: number; activeFraction?: number | null } = {},
) {
  render(
    <MemoryRouter>
      <SegmentEffortsLeaderboard efforts={efforts} {...props} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mockReset()
  seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mockReturnValue({
    data: undefined,
    loading: false,
  })
})

describe('SegmentEffortsLeaderboard', () => {
  it('defaults to most recent sort', () => {
    renderLeaderboard([
      effort({
        activity_id: 'fastest',
        activity_start_time: '2026-07-01T10:00:00Z',
        elapsed_seconds: 80,
      }),
      effort({
        activity_id: 'newest',
        activity_start_time: '2026-07-08T10:00:00Z',
        elapsed_seconds: 95,
      }),
    ])

    expect(screen.getByRole('button', { name: 'Most recent' })).toHaveClass(
      'bg-primary',
    )
    expect(screen.getByRole('button', { name: 'Fastest' })).not.toHaveClass(
      'bg-primary',
    )

    const rows = screen.getAllByTestId('segment-effort-row')
    expect(within(rows[0]).getByText('Jul 8, 2026')).toBeVisible()
    expect(within(rows[1]).getByText('Jul 1, 2026')).toBeVisible()
  })

  it('reorders efforts with the sort controls', async () => {
    const user = userEvent.setup()
    renderLeaderboard([
      effort({
        activity_id: 'fastest',
        activity_start_time: '2026-07-01T10:00:00Z',
        elapsed_seconds: 70,
        avg_speed_kmh: 18,
      }),
      effort({
        activity_id: 'top-speed',
        activity_start_time: '2026-07-02T10:00:00Z',
        elapsed_seconds: 90,
        avg_speed_kmh: 24,
      }),
      effort({
        activity_id: 'newest',
        activity_start_time: '2026-07-08T10:00:00Z',
        elapsed_seconds: 95,
        avg_speed_kmh: 20,
      }),
    ])

    await user.click(screen.getByRole('button', { name: 'Fastest' }))
    expect(
      within(screen.getAllByTestId('segment-effort-row')[0]).getByRole('link', {
        name: 'View',
      }),
    ).toHaveAttribute('href', '/garmin/fastest')

    await user.click(screen.getByRole('button', { name: 'Top speed' }))
    expect(
      within(screen.getAllByTestId('segment-effort-row')[0]).getByRole('link', {
        name: 'View',
      }),
    ).toHaveAttribute('href', '/garmin/top-speed')
  })

  it('shows the effort date when the activity start time is missing', () => {
    renderLeaderboard([
      effort({
        activity_start_time: null,
        effort_start: '2026-07-04T10:00:00Z',
      }),
    ])

    expect(screen.getByText('Jul 4, 2026')).toBeVisible()
  })

  it('marks only the fastest lap as PR when one activity has multiple laps', () => {
    // A single ride that laps the segment twice shares an activity_id; only
    // its faster lap should get the PR badge, not every row for that ride.
    renderLeaderboard([
      effort({
        activity_id: 'multi-lap',
        activity_start_time: '2026-07-09T22:44:46Z',
        effort_start: '2026-07-09T22:44:46Z',
        elapsed_seconds: 1199,
      }),
      effort({
        activity_id: 'multi-lap',
        activity_start_time: '2026-07-09T22:03:21Z',
        effort_start: '2026-07-09T22:03:21Z',
        elapsed_seconds: 1098,
      }),
    ])

    const rows = screen.getAllByTestId('segment-effort-row')
    expect(rows).toHaveLength(2)
    expect(
      within(rows[0]).queryByTestId('segment-effort-pr'),
    ).not.toBeInTheDocument()
    expect(within(rows[1]).getByTestId('segment-effort-pr')).toBeVisible()
  })

  it('shows em dashes in the live columns when idle', () => {
    renderLeaderboard([effort({})], { segmentId: 5, activeFraction: null })

    const row = screen.getByTestId('segment-effort-row')
    expect(
      within(row).getByTestId('segment-effort-live-speed'),
    ).toHaveTextContent('—')
    expect(within(row).getByTestId('segment-effort-live-hr')).toHaveTextContent(
      '—',
    )
    // Idle: the batch query is mounted but skipped, no fetch fires.
    const call =
      seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mock.calls.at(-1)?.[0]
    expect(call.skip).toBe(true)
  })

  it('shows speed and HR at the active fraction during playback', () => {
    seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mockReturnValue(
      batchResult([
        [
          { speed_kmh: 16.09, heart_rate: 120 },
          { speed_kmh: 32.19, heart_rate: 140 },
        ],
      ]),
    )

    renderLeaderboard([effort({})], { segmentId: 5, activeFraction: 0.75 })

    const row = screen.getByTestId('segment-effort-row')
    // Fraction 0.75 of 2 bins → bin 1 (32.19 km/h ≈ 20.0 mph, 140 bpm).
    expect(
      within(row).getByTestId('segment-effort-live-speed'),
    ).toHaveTextContent('20.0 mph')
    expect(within(row).getByTestId('segment-effort-live-hr')).toHaveTextContent(
      '140',
    )

    const call =
      seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mock.calls.at(-1)?.[0]
    expect(call.skip).toBe(false)
    expect(call.variables).toEqual({
      id: 5,
      efforts: [
        {
          activity_id: 'activity',
          effort_start: '2026-07-01T10:00:00Z',
          effort_end: '2026-07-01T10:01:30Z',
        },
      ],
    })
  })

  it('only includes the top 20 rows of the current sort in the batch request', () => {
    const efforts = Array.from({ length: 25 }, (_, i) =>
      effort({
        activity_id: `activity-${i}`,
        activity_start_time: `2026-06-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        effort_start: `2026-06-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }),
    )

    renderLeaderboard(efforts, { segmentId: 5, activeFraction: 0.5 })

    // One batched call total (not one per row), covering only the top 20.
    expect(
      seriesHooks.useGarminSegmentEffortSeriesBatchQuery,
    ).toHaveBeenCalledTimes(1)
    const call =
      seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mock.calls[0][0]
    expect(call.skip).toBe(false)
    expect(call.variables.efforts).toHaveLength(20)
  })

  it('renders static em dashes without a segment id', () => {
    renderLeaderboard([effort({})], { activeFraction: 0.5 })

    const call =
      seriesHooks.useGarminSegmentEffortSeriesBatchQuery.mock.calls.at(-1)?.[0]
    expect(call.skip).toBe(true)
    const row = screen.getByTestId('segment-effort-row')
    expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })
})

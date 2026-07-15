import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SegmentEffortsLeaderboard } from './SegmentEffortsLeaderboard'
import type { SegmentEffort } from './segmentEfforts'

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

function renderLeaderboard(efforts: SegmentEffort[]) {
  render(
    <MemoryRouter>
      <SegmentEffortsLeaderboard efforts={efforts} />
    </MemoryRouter>,
  )
}

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
})

import { render, screen, within } from '@testing-library/react'
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
})

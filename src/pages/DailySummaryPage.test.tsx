import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dailySummaryHooks = vi.hoisted(() => ({
  useDailySummaryQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => dailySummaryHooks)

import { DailySummaryPage } from './DailySummaryPage'

describe('DailySummaryPage', () => {
  beforeEach(() => {
    dailySummaryHooks.useDailySummaryQuery.mockReset()
  })

  it('shows a loading state while summaries are loading', () => {
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<DailySummaryPage />)

    expect(screen.getByText('Loading daily summaries...')).toBeInTheDocument()
  })

  it('shows an error state and retries the query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('daily summary failed'),
      refetch,
    })

    render(<DailySummaryPage />)

    expect(screen.getByText('daily summary failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders summary rows with formatted values', () => {
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: [
          {
            activity_date: '2026-03-14',
            owntracks_device: 'phone',
            owntracks_points: 1234,
            min_battery: 80,
            max_battery: 95,
            garmin_sport: 'running',
            total_distance_km: 12.345,
            avg_heart_rate: 148,
            total_calories: 640,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<DailySummaryPage />)

    expect(screen.getByText('Daily Summary')).toBeInTheDocument()
    expect(screen.getByText('phone')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('80–95%')).toBeInTheDocument()
    expect(screen.getByText('12.35 km')).toBeInTheDocument()
    expect(screen.getByText('148 bpm')).toBeInTheDocument()
    expect(screen.getByText('640')).toBeInTheDocument()
  })
})

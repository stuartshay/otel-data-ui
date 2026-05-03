import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const dailySummaryHooks = vi.hoisted(() => ({
  useDailySummaryQuery: vi.fn(),
  useDailySummaryDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => dailySummaryHooks)

import { DailySummaryPage } from './DailySummaryPage'

function renderPage(route = '/daily-summary') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DailySummaryPage />
    </MemoryRouter>,
  )
}

describe('DailySummaryPage', () => {
  beforeEach(() => {
    dailySummaryHooks.useDailySummaryQuery.mockReset()
    dailySummaryHooks.useDailySummaryDateRangeQuery.mockReset()

    dailySummaryHooks.useDailySummaryDateRangeQuery.mockReturnValue({
      data: {
        dailySummaryDateRange: {
          min_date: '2025-01-01',
          max_date: '2026-06-01',
        },
      },
    })
  })

  it('shows a loading state while summaries are loading', () => {
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

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

    renderPage()

    expect(screen.getByText('daily summary failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders summary rows with formatted values and date detail links', () => {
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: buildDailySummaryConnection(),
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('Daily Summary')).toBeInTheDocument()
    expect(
      screen.getByText('50 days of combined OwnTracks + Garmin activity'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View points for 2026-03-14' }),
    ).toHaveAttribute('href', '/daily-summary/2026-03-14')
    expect(screen.getByText('phone')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('80–95%')).toBeInTheDocument()
    expect(screen.getByText('12.35 km')).toBeInTheDocument()
    expect(screen.getByText('148 bpm')).toBeInTheDocument()
    expect(screen.getByText('640')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument()
  })

  it('updates pagination offsets as the user moves between pages', async () => {
    const user = userEvent.setup()
    dailySummaryHooks.useDailySummaryQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: {
          limit: number
          offset: number
          date_from?: string
          date_to?: string
        }
      }) => ({
        data: {
          dailySummary: buildDailySummaryConnection({
            offset: variables.offset ?? 0,
          }),
        },
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      }),
    )

    renderPage()

    expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 26–50 of 50')).toBeInTheDocument(),
    )
    expect(dailySummaryHooks.useDailySummaryQuery).toHaveBeenLastCalledWith({
      variables: {
        date_from: undefined,
        date_to: undefined,
        limit: 25,
        offset: 25,
      },
    })

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument(),
    )
  })

  it('passes date_from and date_to from URL params to the query', () => {
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: buildDailySummaryConnection(),
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage('/daily-summary?date_from=2026-03-01&date_to=2026-03-14')

    expect(dailySummaryHooks.useDailySummaryQuery).toHaveBeenLastCalledWith({
      variables: {
        date_from: '2026-03-01',
        date_to: '2026-03-14',
        limit: 25,
        offset: 0,
      },
    })
  })

  it('shows an empty state with a reset action when filters yield no results', async () => {
    const user = userEvent.setup()
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: { total: 0, limit: 25, offset: 0, items: [] },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage('/daily-summary?date_from=2026-01-01&date_to=2026-01-02')

    expect(screen.getByText('No data available')).toBeInTheDocument()
    const reset = screen.getByRole('button', { name: /Clear filters/i })
    await user.click(reset)
  })
})

function buildDailySummaryConnection({ offset = 0 } = {}) {
  return {
    items: [
      {
        activity_date: offset === 0 ? '2026-03-14' : '2026-02-18',
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
    total: 50,
    limit: 25,
    offset,
  }
}

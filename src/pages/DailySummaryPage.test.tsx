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

function renderPage() {
  return render(
    <MemoryRouter>
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

  it('renders summary rows with formatted values', () => {
    dailySummaryHooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: {
          total: 1,
          limit: 25,
          offset: 0,
          items: [
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
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('Daily Summary')).toBeInTheDocument()
    expect(screen.getByText('phone')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('80–95%')).toBeInTheDocument()
    expect(screen.getByText('12.35 km')).toBeInTheDocument()
    expect(screen.getByText('148 bpm')).toBeInTheDocument()
    expect(screen.getByText('640')).toBeInTheDocument()
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
      }) => {
        const offset = variables.offset ?? 0
        return {
          data: {
            dailySummary: {
              total: 50,
              limit: variables.limit,
              offset,
              items: [
                {
                  activity_date: `2026-03-${String((offset % 28) + 1).padStart(2, '0')}`,
                  owntracks_device: 'phone',
                  owntracks_points: 100,
                  min_battery: 70,
                  max_battery: 90,
                  garmin_sport: 'running',
                  total_distance_km: 5,
                  avg_heart_rate: 140,
                  total_calories: 300,
                },
              ],
            },
          },
          loading: false,
          error: undefined,
          refetch: vi.fn(),
        }
      },
    )

    renderPage()

    expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 26–50 of 50')).toBeInTheDocument(),
    )
    expect(dailySummaryHooks.useDailySummaryQuery).toHaveBeenLastCalledWith({
      variables: {
        limit: 25,
        offset: 25,
        date_from: undefined,
        date_to: undefined,
      },
    })

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument(),
    )
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

    render(
      <MemoryRouter
        initialEntries={[
          '/daily-summary?date_from=2026-01-01&date_to=2026-01-02',
        ]}
      >
        <DailySummaryPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('No data available')).toBeInTheDocument()
    const reset = screen.getByRole('button', { name: /Clear filters/i })
    await user.click(reset)
  })
})

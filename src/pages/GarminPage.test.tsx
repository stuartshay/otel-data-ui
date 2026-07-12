import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { LocationDisplay } from '@/test/LocationDisplay'
import { renderWithRouter } from '@/test/renderWithRouter'

const garminHooks = vi.hoisted(() => ({
  useGarminActivitiesQuery: vi.fn(),
  useGarminSportsQuery: vi.fn(),
  useGarminDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => garminHooks)

vi.mock('@/components/shared/DateRangePicker', () => ({
  DateRangePicker: ({
    onRangeChange,
  }: {
    onRangeChange: (from?: Date, to?: Date) => void
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onRangeChange(new Date(2026, 0, 2), new Date(2026, 1, 3))
        }
      >
        Set date range
      </button>
      <button type="button" onClick={() => onRangeChange()}>
        Clear date range
      </button>
    </div>
  ),
}))

import { GarminPage } from './GarminPage'

describe('GarminPage', () => {
  beforeEach(() => {
    garminHooks.useGarminActivitiesQuery.mockReset()
    garminHooks.useGarminSportsQuery.mockReset()
    garminHooks.useGarminDateRangeQuery.mockReset()

    garminHooks.useGarminDateRangeQuery.mockReturnValue({
      data: {
        garminDateRange: {
          min_date: '2025-01-01T00:00:00Z',
          max_date: '2026-06-01T00:00:00Z',
        },
      },
    })

    garminHooks.useGarminSportsQuery.mockReturnValue({
      data: {
        garminSports: [
          { sport: 'running', activity_count: 32 },
          { sport: 'cycling', activity_count: 8 },
        ],
      },
    })

    garminHooks.useGarminActivitiesQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: {
          limit: number
          offset: number
          sport?: string
          date_from?: string
          date_to?: string
          order: string
          sort: string
        }
      }) => {
        const page = variables.offset / 25 + 1
        const sport = variables.sport ?? 'running'
        const total = variables.sport ? 30 : 60

        return {
          data: {
            garminActivities: {
              total,
              items: [
                {
                  activity_id: `${sport}-${page}`,
                  sport,
                  distance_km: 10.25,
                  duration_seconds: 3661,
                  avg_heart_rate: 151,
                  calories: 720,
                  track_point_count: 1234,
                  start_time: '2026-03-14T09:00:00Z',
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
  })

  function renderPage(route = '/garmin') {
    return renderWithRouter(
      <Routes>
        <Route
          path="/garmin"
          element={
            <>
              <GarminPage />
              <LocationDisplay />
            </>
          }
        />
      </Routes>,
      { route },
    )
  }

  it('derives query variables from search params', () => {
    renderPage('/garmin?page=2&sport=cycling')

    expect(garminHooks.useGarminActivitiesQuery).toHaveBeenLastCalledWith({
      variables: {
        limit: 25,
        offset: 25,
        sport: 'cycling',
        date_from: undefined,
        date_to: undefined,
        order: 'desc',
        sort: 'start_time',
      },
    })
    expect(screen.getByText('30 activities')).toBeInTheDocument()
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/garmin?page=2&sport=cycling',
    )
  })

  it('updates the URL and resets the page when the sport filter changes', async () => {
    const user = userEvent.setup()
    renderPage('/garmin?page=3')

    await user.click(screen.getByRole('button', { name: /running/i }))

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin?sport=running',
      ),
    )
    expect(garminHooks.useGarminActivitiesQuery).toHaveBeenLastCalledWith({
      variables: {
        limit: 25,
        offset: 0,
        sport: 'running',
        date_from: undefined,
        date_to: undefined,
        order: 'desc',
        sort: 'start_time',
      },
    })
  })

  it('supports next and previous pagination through the URL', async () => {
    const user = userEvent.setup()
    renderPage('/garmin')

    await user.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin?page=2',
      ),
    )

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin',
      ),
    )
  })

  it('shows the loading state and retries a query error', async () => {
    const user = userEvent.setup()
    garminHooks.useGarminActivitiesQuery.mockReturnValueOnce({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    const { unmount } = renderPage()
    expect(screen.getByText('Loading activities...')).toBeInTheDocument()
    unmount()

    const refetch = vi.fn()
    garminHooks.useGarminActivitiesQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('activities unavailable'),
      refetch,
    })
    renderPage()

    expect(screen.getByText('activities unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders and clears an active sport filter', async () => {
    const user = userEvent.setup()
    renderPage('/garmin?page=2&sport=cycling')

    await user.click(screen.getByRole('button', { name: 'All' }))

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin',
      ),
    )
  })

  it('updates and clears date range filters', async () => {
    const user = userEvent.setup()
    renderPage('/garmin?page=2&sport=running')

    await user.click(screen.getByRole('button', { name: 'Set date range' }))
    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin?sport=running&date_from=2026-01-02&date_to=2026-02-03',
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Clear date range' }))
    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin?sport=running',
      ),
    )
  })

  it('renders filtered empty state and clears every filter', async () => {
    const user = userEvent.setup()
    garminHooks.useGarminActivitiesQuery.mockReturnValue({
      data: { garminActivities: { total: 0, items: [] } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    renderPage(
      '/garmin?page=3&sport=cycling&date_from=2026-01-01&date_to=2026-01-31',
    )

    expect(
      screen.getByText(/No Garmin activities match the selected filters/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin',
      ),
    )
  })

  it('renders the unfiltered empty state without a reset action', () => {
    garminHooks.useGarminDateRangeQuery.mockReturnValue({ data: undefined })
    garminHooks.useGarminSportsQuery.mockReturnValue({ data: undefined })
    garminHooks.useGarminActivitiesQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByText('No Garmin activities have been recorded yet.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()
  })

  it('renders fallback values for incomplete activities', () => {
    garminHooks.useGarminActivitiesQuery.mockReturnValue({
      data: {
        garminActivities: {
          total: 1,
          items: [
            {
              activity_id: 'incomplete-1',
              sport: 'running',
              distance_km: null,
              duration_seconds: null,
              avg_heart_rate: null,
              calories: null,
              track_point_count: null,
              start_time: null,
            },
          ],
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    const activityRow = screen
      .getByRole('link', { name: 'running' })
      .closest('tr')
    expect(activityRow).not.toBeNull()
    expect(within(activityRow!).getAllByText('—')).toHaveLength(6)
  })

  it('keeps the previous page number when navigating back beyond page two', async () => {
    const user = userEvent.setup()
    renderPage('/garmin?page=4')

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/garmin?page=3',
      ),
    )
  })
})

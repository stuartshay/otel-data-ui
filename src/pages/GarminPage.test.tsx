import { screen, waitFor } from '@testing-library/react'
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
})

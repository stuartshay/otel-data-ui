import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/renderWithRouter'

const garminDetailHooks = vi.hoisted(() => ({
  useGarminActivityQuery: vi.fn(),
  useGarminTrackPointsQuery: vi.fn(),
  useGarminChartDataQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => garminDetailHooks)

vi.mock('@/components/garmin/ActivityHeader', () => ({
  ActivityHeader: ({ backTo, sport }: { backTo: string; sport: string }) => (
    <div data-testid="activity-header">
      {sport}:{backTo}
    </div>
  ),
}))

vi.mock('@/components/garmin/ActivityStatsBar', () => ({
  ActivityStatsBar: () => <div data-testid="activity-stats-bar">stats-bar</div>,
}))

vi.mock('@/components/garmin/ActivityRouteMap', () => ({
  ActivityRouteMap: () => <div data-testid="activity-route-map">route-map</div>,
}))

vi.mock('@/components/garmin/ActivityCharts', () => ({
  ActivityCharts: () => <div data-testid="activity-charts">charts</div>,
}))

vi.mock('@/components/garmin/ActivityStatsPanel', () => ({
  ActivityStatsPanel: () => (
    <div data-testid="activity-stats-panel">stats-panel</div>
  ),
}))

import { GarminDetailPage } from './GarminDetailPage'

describe('GarminDetailPage', () => {
  beforeEach(() => {
    garminDetailHooks.useGarminActivityQuery.mockReset()
    garminDetailHooks.useGarminTrackPointsQuery.mockReset()
    garminDetailHooks.useGarminChartDataQuery.mockReset()
  })

  function renderPage(
    entry:
      | string
      | {
          pathname: string
          search?: string
          state?: unknown
        } = '/garmin/42',
  ) {
    return renderWithRouter(
      <Routes>
        <Route path="/garmin/:activityId" element={<GarminDetailPage />} />
      </Routes>,
      { entries: [entry] },
    )
  }

  it('shows the loading state while the activity query is pending', () => {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: true,
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: undefined,
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: undefined,
    })

    renderPage()

    expect(screen.getByText('Loading activity...')).toBeInTheDocument()
  })

  it('shows an error state and retries the activity query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: new Error('activity failed'),
      refetch,
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: undefined,
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: undefined,
    })

    renderPage()

    expect(screen.getByText('activity failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the activity detail sections and preserves the back link state', () => {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          sport: 'running',
          sub_sport: 'trail',
          start_time: '2026-03-14T09:00:00Z',
          device_manufacturer: 'Garmin',
          distance_km: 21.1,
          duration_seconds: 7200,
          avg_speed_kmh: 10.5,
          total_ascent_m: 420,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: {
        garminTrackPoints: {
          items: [{ latitude: 40.7, longitude: -74.0 }],
        },
      },
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: new Error('chart fetch failed'),
      data: {
        garminChartData: [{ distance_meters: 1000 }],
      },
    })

    renderPage({
      pathname: '/garmin/42',
      state: { garminListSearch: 'page=2&sport=running' },
    })

    expect(screen.getByTestId('activity-header')).toHaveTextContent(
      'running:/garmin?page=2&sport=running',
    )
    expect(screen.getByTestId('activity-stats-bar')).toBeInTheDocument()
    expect(screen.getByTestId('activity-route-map')).toBeInTheDocument()
    expect(screen.getByTestId('activity-charts')).toBeInTheDocument()
    expect(screen.getByTestId('activity-stats-panel')).toBeInTheDocument()
    expect(
      screen.getByText('Chart data failed: chart fetch failed'),
    ).toBeInTheDocument()
  })

  it('shows not found when the activity query returns no activity', () => {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: null,
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: undefined,
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText('Activity not found')).toBeInTheDocument()
  })
})

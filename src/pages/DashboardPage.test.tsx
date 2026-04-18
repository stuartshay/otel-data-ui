import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dashboardHooks = vi.hoisted(() => ({
  useHealthQuery: vi.fn(),
  useLocationCountQuery: vi.fn(),
  useDevicesQuery: vi.fn(),
  useGarminSportsQuery: vi.fn(),
  useDailySummaryQuery: vi.fn(),
  useGarminActivitiesQuery: vi.fn(),
  useTriggerGarminSyncMutation: vi
    .fn()
    .mockReturnValue([vi.fn(), { loading: false }]),
}))

vi.mock('@/__generated__/graphql', () => dashboardHooks)

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    userProfile: null,
  }),
}))

import { DashboardPage } from './DashboardPage'

describe('DashboardPage', () => {
  beforeEach(() => {
    Object.values(dashboardHooks).forEach((mock) => mock.mockReset())
    dashboardHooks.useTriggerGarminSyncMutation.mockReturnValue([
      vi.fn(),
      { loading: false },
    ])
    dashboardHooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })
    dashboardHooks.useGarminActivitiesQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })
  })

  it('shows a loading state when all dashboard queries are loading', () => {
    dashboardHooks.useHealthQuery.mockReturnValue({ loading: true })
    dashboardHooks.useLocationCountQuery.mockReturnValue({ loading: true })
    dashboardHooks.useDevicesQuery.mockReturnValue({ loading: true })
    dashboardHooks.useGarminSportsQuery.mockReturnValue({ loading: true })

    render(<DashboardPage />)

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('shows an error state and retries the count query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    dashboardHooks.useHealthQuery.mockReturnValue({
      data: { health: { status: 'healthy', version: '1.0.0' } },
      loading: false,
    })
    dashboardHooks.useLocationCountQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('count failed'),
      refetch,
    })
    dashboardHooks.useDevicesQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })
    dashboardHooks.useGarminSportsQuery.mockReturnValue({
      data: undefined,
      loading: false,
    })

    render(<DashboardPage />)

    expect(screen.getByText('count failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders dashboard metrics, devices, and Garmin sport counts', () => {
    dashboardHooks.useHealthQuery.mockReturnValue({
      data: { health: { status: 'healthy', version: '1.2.3' } },
      loading: false,
    })
    dashboardHooks.useLocationCountQuery.mockReturnValue({
      data: { locationCount: { count: 4321 } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    dashboardHooks.useDevicesQuery.mockReturnValue({
      data: {
        devices: [{ device_id: 'watch' }, { device_id: 'phone' }],
      },
      loading: false,
    })
    dashboardHooks.useGarminSportsQuery.mockReturnValue({
      data: {
        garminSports: [
          { sport: 'running', activity_count: 12 },
          { sport: 'cycling', activity_count: 4 },
        ],
      },
      loading: false,
    })

    render(<DashboardPage />)

    expect(screen.getByText('4,321')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('healthy')).toBeInTheDocument()
    expect(screen.getByText('v1.2.3')).toBeInTheDocument()
    expect(screen.getByText('watch')).toBeInTheDocument()
    expect(screen.getByText('phone')).toBeInTheDocument()
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText('cycling')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const geocodingHooks = vi.hoisted(() => ({
  useGeocodingStatusQuery: vi.fn(),
  useTriggerGeocodingMutation: vi
    .fn()
    .mockReturnValue([vi.fn(), { loading: false }]),
}))

vi.mock('@/__generated__/graphql', () => geocodingHooks)

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    userProfile: null,
  }),
}))

import { GeocodingPage } from './GeocodingPage'

describe('GeocodingPage', () => {
  beforeEach(() => {
    geocodingHooks.useGeocodingStatusQuery.mockReset()
    geocodingHooks.useTriggerGeocodingMutation.mockReset()
    geocodingHooks.useTriggerGeocodingMutation.mockReturnValue([
      vi.fn(),
      { loading: false },
    ])
  })

  it('shows a loading state while geocoding status is loading', () => {
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GeocodingPage />)

    expect(screen.getByText('Loading geocoding status...')).toBeInTheDocument()
  })

  it('shows an error state and retries the query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('geocoding fetch failed'),
      refetch,
    })

    render(<GeocodingPage />)

    expect(screen.getByText('geocoding fetch failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders stats cards from geocoding status data', () => {
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: {
        geocodingStatus: {
          total_locations: 5000,
          geocoded: 4500,
          success: 4200,
          pending: 300,
          no_coverage: 150,
          errors: 50,
          coverage_percent: 90.0,
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GeocodingPage />)

    expect(screen.getByText('Geocoding')).toBeInTheDocument()
    expect(screen.getByText('5,000')).toBeInTheDocument()
    expect(screen.getByText('4,500')).toBeInTheDocument()
    expect(screen.getByText('4,200')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('90.0%')).toBeInTheDocument()
  })

  it('shows login prompt when not authenticated', () => {
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: {
        geocodingStatus: {
          total_locations: 100,
          geocoded: 50,
          success: 40,
          pending: 10,
          no_coverage: 5,
          errors: 5,
          coverage_percent: 50.0,
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<GeocodingPage />)

    expect(
      screen.getByText('Login required to trigger geocoding.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })
})

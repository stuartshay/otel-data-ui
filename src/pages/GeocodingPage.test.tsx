import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const geocodingHooks = vi.hoisted(() => ({
  useGeocodingStatusQuery: vi.fn(),
  useTriggerGeocodingMutation: vi
    .fn()
    .mockReturnValue([vi.fn(), { loading: false }]),
}))

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  useAuth: vi.fn(),
}))

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => geocodingHooks)

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}))

vi.mock('sonner', () => ({ toast: toastMocks }))

import { GeocodingPage } from './GeocodingPage'

describe('GeocodingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    geocodingHooks.useGeocodingStatusQuery.mockReset()
    geocodingHooks.useTriggerGeocodingMutation.mockReset()
    geocodingHooks.useTriggerGeocodingMutation.mockReturnValue([
      vi.fn(),
      { loading: false },
    ])
    authMocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: authMocks.login,
      logout: vi.fn(),
      userProfile: null,
    })
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

  it('shows the login prompt and starts authentication', async () => {
    const user = userEvent.setup()
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
    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(authMocks.login).toHaveBeenCalledTimes(1)
  })

  it('refreshes status manually and handles an empty status response', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: { geocodingStatus: null },
      loading: false,
      error: undefined,
      refetch,
    })

    render(<GeocodingPage />)

    expect(screen.queryByText('Total Locations')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /refresh/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('validates batch size before triggering geocoding', async () => {
    const user = userEvent.setup()
    const triggerGeocoding = vi.fn()
    authMocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      login: authMocks.login,
    })
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: { geocodingStatus: null },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    geocodingHooks.useTriggerGeocodingMutation.mockReturnValue([
      triggerGeocoding,
      { loading: false },
    ])

    render(<GeocodingPage />)

    const batchSize = screen.getByRole('spinbutton', { name: 'Batch size' })
    await user.clear(batchSize)
    await user.type(batchSize, '201')
    await user.click(screen.getByRole('button', { name: 'Run Geocoding' }))

    expect(toastMocks.error).toHaveBeenCalledWith('Invalid batch size', {
      description: 'Batch size must be between 1 and 200.',
    })
    expect(triggerGeocoding).not.toHaveBeenCalled()
  })

  it('triggers an authenticated retry batch with the selected size', async () => {
    const user = userEvent.setup()
    const triggerGeocoding = vi.fn()
    authMocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      login: authMocks.login,
    })
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: { geocodingStatus: null },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    geocodingHooks.useTriggerGeocodingMutation.mockReturnValue([
      triggerGeocoding,
      { loading: false },
    ])

    render(<GeocodingPage />)

    const batchSize = screen.getByRole('spinbutton', { name: 'Batch size' })
    await user.clear(batchSize)
    await user.type(batchSize, '25')
    await user.click(screen.getByRole('button', { name: 'Run Geocoding' }))
    expect(triggerGeocoding).toHaveBeenLastCalledWith({
      variables: { batch_size: 25 },
    })

    await user.click(screen.getByRole('checkbox', { name: 'Retry failed' }))
    await user.click(screen.getByRole('button', { name: 'Run Geocoding' }))

    expect(triggerGeocoding).toHaveBeenLastCalledWith({
      variables: { batch_size: 25, retry_failed: true },
    })
  })

  it('reports mutation success and failure callbacks', () => {
    const refetch = vi.fn()
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: { geocodingStatus: null },
      loading: false,
      error: undefined,
      refetch,
    })

    render(<GeocodingPage />)

    const mutationOptions =
      geocodingHooks.useTriggerGeocodingMutation.mock.calls[0]?.[0]
    mutationOptions.onCompleted({
      triggerGeocoding: {
        processed: 20,
        remaining: 5,
        skipped_dedup: 3,
      },
    })
    mutationOptions.onError(new Error('Pelias unavailable'))

    expect(toastMocks.success).toHaveBeenCalledWith(
      'Geocoding batch complete',
      { description: 'Processed: 20, Remaining: 5, Dedup skipped: 3' },
    )
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(toastMocks.error).toHaveBeenCalledWith('Geocoding failed', {
      description: 'Pelias unavailable',
    })
  })

  it('shows a disabled processing action while the mutation is running', () => {
    authMocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      login: authMocks.login,
    })
    geocodingHooks.useGeocodingStatusQuery.mockReturnValue({
      data: { geocodingStatus: null },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    geocodingHooks.useTriggerGeocodingMutation.mockReturnValue([
      vi.fn(),
      { loading: true },
    ])

    render(<GeocodingPage />)

    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
  })
})

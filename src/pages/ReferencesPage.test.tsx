import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const referenceHooks = vi.hoisted(() => ({
  useReferenceLocationsQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => referenceHooks)

import { ReferencesPage } from './ReferencesPage'

describe('ReferencesPage', () => {
  beforeEach(() => {
    referenceHooks.useReferenceLocationsQuery.mockReset()
  })

  it('shows a loading state while reference locations load', () => {
    referenceHooks.useReferenceLocationsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<ReferencesPage />)

    expect(
      screen.getByText('Loading reference locations...'),
    ).toBeInTheDocument()
  })

  it('shows an error state and retries the query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    referenceHooks.useReferenceLocationsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('reference load failed'),
      refetch,
    })

    render(<ReferencesPage />)

    expect(screen.getByText('reference load failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders saved reference location cards', () => {
    referenceHooks.useReferenceLocationsQuery.mockReturnValue({
      data: {
        referenceLocations: [
          {
            id: 1,
            name: 'Home',
            latitude: 40.736097,
            longitude: -74.039373,
            radius_meters: 150,
            description: 'Primary geofence',
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<ReferencesPage />)

    expect(screen.getByText('Reference Locations')).toBeInTheDocument()
    expect(screen.getByText('1 saved locations')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('40.736097, -74.039373')).toBeInTheDocument()
    expect(screen.getByText('150m radius')).toBeInTheDocument()
    expect(screen.getByText('Primary geofence')).toBeInTheDocument()
  })
})

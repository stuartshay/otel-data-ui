import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/renderWithRouter'

const locationDetailHooks = vi.hoisted(() => ({
  useLocationDetailQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => locationDetailHooks)

import { LocationDetailPage } from './LocationDetailPage'

describe('LocationDetailPage', () => {
  beforeEach(() => {
    locationDetailHooks.useLocationDetailQuery.mockReset()
  })

  function renderPage(route = '/locations/42') {
    return renderWithRouter(
      <Routes>
        <Route path="/locations/:id" element={<LocationDetailPage />} />
        <Route path="/locations" element={<div>Locations index</div>} />
      </Routes>,
      { route },
    )
  }

  it('shows a loading state while the location detail loads', () => {
    locationDetailHooks.useLocationDetailQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('Loading location...')).toBeInTheDocument()
  })

  it('shows an error state and retries the query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    locationDetailHooks.useLocationDetailQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('location failed'),
      refetch,
    })

    renderPage()

    expect(screen.getByText('location failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders location metadata and raw payload details', () => {
    locationDetailHooks.useLocationDetailQuery.mockReturnValue({
      data: {
        location: {
          id: 42,
          device_id: 'phone',
          tid: 'ph',
          latitude: 40.736097,
          longitude: -74.039373,
          accuracy: 5,
          altitude: 10,
          velocity: 2,
          battery: 91,
          connection_type: 'wifi',
          trigger: 'manual',
          timestamp: '2026-03-14T09:00:00Z',
          created_at: '2026-03-14T09:00:00Z',
          raw_payload: { topic: 'owntracks/phone' },
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Location #42' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('phone')).toHaveLength(2)
    expect(screen.getByText('wifi')).toBeInTheDocument()
    expect(screen.getByText('manual')).toBeInTheDocument()
    expect(screen.getByText(/owntracks\/phone/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/locations')
  })
})

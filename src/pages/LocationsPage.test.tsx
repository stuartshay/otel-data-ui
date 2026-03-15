import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const locationHooks = vi.hoisted(() => ({
  useDevicesQuery: vi.fn(),
  useLocationsQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => locationHooks)

import { LocationsPage } from './LocationsPage'

describe('LocationsPage', () => {
  beforeEach(() => {
    locationHooks.useDevicesQuery.mockReset()
    locationHooks.useLocationsQuery.mockReset()

    locationHooks.useDevicesQuery.mockReturnValue({
      data: {
        devices: [{ device_id: 'watch' }, { device_id: 'phone' }],
      },
    })

    locationHooks.useLocationsQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: {
          limit: number
          offset: number
          device_id?: string
          order: string
          sort: string
        }
      }) => {
        const offset = variables.offset ?? 0
        const deviceId = variables.device_id ?? 'watch'

        return {
          data: {
            locations: {
              total: 50,
              items: [
                {
                  id: offset + 1,
                  device_id: deviceId,
                  latitude: 40.736097,
                  longitude: -74.039373,
                  battery: 83,
                  accuracy: 5,
                  timestamp: '2026-03-14T09:00:00Z',
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

  function renderPage() {
    return render(
      <MemoryRouter>
        <LocationsPage />
      </MemoryRouter>,
    )
  }

  it('updates pagination offsets as the user moves between pages', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 26–50 of 50')).toBeInTheDocument(),
    )
    expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
      variables: {
        limit: 25,
        offset: 25,
        device_id: undefined,
        order: 'desc',
        sort: 'timestamp',
      },
    })

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument(),
    )
  })

  it('resets pagination when the device filter changes', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() =>
      expect(screen.getByText('Showing 26–50 of 50')).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'phone' }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–25 of 50')).toBeInTheDocument(),
    )
    expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
      variables: {
        limit: 25,
        offset: 0,
        device_id: 'phone',
        order: 'desc',
        sort: 'timestamp',
      },
    })
  })

  it('shows an error state when the locations query fails', () => {
    const refetch = vi.fn()
    locationHooks.useLocationsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('locations failed'),
      refetch,
    })

    renderPage()

    expect(screen.getByText('locations failed')).toBeInTheDocument()
  })
})

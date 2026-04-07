import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const locationHooks = vi.hoisted(() => ({
  useDevicesQuery: vi.fn(),
  useLocationsQuery: vi.fn(),
  useLocationDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => locationHooks)

import { LocationsPage } from './LocationsPage'

describe('LocationsPage', () => {
  beforeEach(() => {
    locationHooks.useDevicesQuery.mockReset()
    locationHooks.useLocationsQuery.mockReset()
    locationHooks.useLocationDateRangeQuery.mockReset()

    locationHooks.useLocationDateRangeQuery.mockReturnValue({
      data: {
        locationDateRange: {
          min_date: '2025-12-27T00:00:00Z',
          max_date: '2026-06-01T00:00:00Z',
        },
      },
    })

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
          date_from?: string
          date_to?: string
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
        date_from: undefined,
        date_to: undefined,
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
        date_from: undefined,
        date_to: undefined,
        order: 'desc',
        sort: 'timestamp',
      },
    })
  })

  it('passes date_from and date_to from URL params to the query', () => {
    render(
      <MemoryRouter
        initialEntries={['/locations?date_from=2026-03-01&date_to=2026-03-14']}
      >
        <LocationsPage />
      </MemoryRouter>,
    )

    expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
      variables: {
        limit: 25,
        offset: 0,
        device_id: undefined,
        date_from: '2026-03-01',
        date_to: '2026-03-14',
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

  it('renders display_address when present and falls back to dash when null', () => {
    locationHooks.useLocationsQuery.mockReturnValue({
      data: {
        locations: {
          total: 2,
          items: [
            {
              id: 1,
              device_id: 'phone',
              latitude: 40.736097,
              longitude: -74.039373,
              battery: 80,
              accuracy: 5,
              timestamp: '2026-03-14T09:00:00Z',
              display_address: '123 Main St, Hoboken, NJ',
            },
            {
              id: 2,
              device_id: 'phone',
              latitude: 40.736097,
              longitude: -74.039373,
              battery: 70,
              accuracy: 10,
              timestamp: '2026-03-14T10:00:00Z',
              display_address: null,
            },
          ],
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('123 Main St, Hoboken, NJ')).toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    // row 0 is header; row 2 is the null-address row
    const cells = rows[2].querySelectorAll('td')
    const addressCell = cells[5]
    expect(addressCell.textContent).toBe('—')
  })

  it('sets a title attribute on the address cell for truncation tooltip', () => {
    locationHooks.useLocationsQuery.mockReturnValue({
      data: {
        locations: {
          total: 1,
          items: [
            {
              id: 1,
              device_id: 'phone',
              latitude: 40.736097,
              longitude: -74.039373,
              battery: 80,
              accuracy: 5,
              timestamp: '2026-03-14T09:00:00Z',
              display_address: 'A very long address that would be truncated',
            },
          ],
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    const addressCell = screen.getByText(
      'A very long address that would be truncated',
    )
    expect(addressCell.closest('td')).toHaveAttribute(
      'title',
      'A very long address that would be truncated',
    )
  })
})

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const locationHooks = vi.hoisted(() => ({
  useDevicesQuery: vi.fn(),
  useLocationsQuery: vi.fn(),
  useLocationDateRangeQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => locationHooks)

vi.mock('@/components/shared/DateRangePicker', () => ({
  DateRangePicker: ({
    dateFrom,
    dateTo,
    onRangeChange,
  }: {
    dateFrom: Date | undefined
    dateTo: Date | undefined
    onRangeChange: (from: Date | undefined, to: Date | undefined) => void
  }) => (
    <div>
      <button
        type="button"
        data-testid="date-range-trigger"
        onClick={() =>
          onRangeChange(new Date(2026, 0, 2), new Date(2026, 1, 3))
        }
      >
        Set date range {dateFrom?.toDateString()} {dateTo?.toDateString()}
      </button>
      <button type="button" onClick={() => onRangeChange(undefined, undefined)}>
        Clear date range
      </button>
    </div>
  ),
}))

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

  function renderPage(entry = '/locations') {
    return render(
      <MemoryRouter initialEntries={[entry]}>
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

  it('shows an error state and retries when the locations query fails', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    locationHooks.useLocationsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('locations failed'),
      refetch,
    })

    renderPage()

    expect(screen.getByText('locations failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
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

  it('clamps a URL date_from before the API min_date to the min bound', () => {
    // min_date is 2025-12-27T00:00:00Z; date_from=2025-01-01 is before that
    render(
      <MemoryRouter initialEntries={['/locations?date_from=2025-01-01']}>
        <LocationsPage />
      </MemoryRouter>,
    )

    // The clamped dateFrom should appear in the DateRangePicker trigger,
    // not the original 2025-01-01
    const trigger = screen.getByTestId('date-range-trigger')
    expect(trigger.textContent).not.toContain('Jan 1, 2025')
    expect(trigger.textContent).toContain('Dec')
    expect(trigger.textContent).toContain('2025')
  })

  it('clamps a URL date_to after the API max_date to the max bound', () => {
    // max_date is 2026-06-01T00:00:00Z; date_to=2027-01-01 is after that
    render(
      <MemoryRouter
        initialEntries={['/locations?date_from=2026-03-01&date_to=2027-01-01']}
      >
        <LocationsPage />
      </MemoryRouter>,
    )

    // The clamped dateTo should appear in the DateRangePicker trigger,
    // not the original 2027-01-01
    const trigger = screen.getByTestId('date-range-trigger')
    expect(trigger.textContent).not.toContain('2027')
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

  it('shows a loading state before location data is available', () => {
    locationHooks.useLocationsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('Loading locations...')).toBeInTheDocument()
  })

  it('clears the active device filter and resets pagination', async () => {
    const user = userEvent.setup()
    renderPage('/locations?page=2&device=phone')

    await user.click(screen.getByRole('button', { name: 'All' }))

    await waitFor(() =>
      expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
        variables: expect.objectContaining({
          offset: 0,
          device_id: undefined,
        }),
      }),
    )
  })

  it('sets and clears date filters while resetting pagination', async () => {
    const user = userEvent.setup()
    renderPage('/locations?page=2&device=watch')

    await user.click(screen.getByRole('button', { name: 'Set date range' }))
    await waitFor(() =>
      expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
        variables: expect.objectContaining({
          offset: 0,
          date_from: '2026-01-02',
          date_to: '2026-02-03',
        }),
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Clear date range' }))
    await waitFor(() =>
      expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
        variables: expect.objectContaining({
          date_from: undefined,
          date_to: undefined,
        }),
      }),
    )
  })

  it('renders filtered empty state and clears every filter', async () => {
    const user = userEvent.setup()
    locationHooks.useLocationsQuery.mockReturnValue({
      data: { locations: { total: 0, items: [] } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    renderPage(
      '/locations?page=3&device=phone&date_from=2026-01-01&date_to=2026-01-31',
    )

    expect(
      screen.getByText(/No locations match the selected filters/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() =>
      expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
        variables: expect.objectContaining({
          offset: 0,
          device_id: undefined,
          date_from: undefined,
          date_to: undefined,
        }),
      }),
    )
  })

  it('renders unfiltered empty state without a reset action', () => {
    locationHooks.useLocationDateRangeQuery.mockReturnValue({ data: undefined })
    locationHooks.useDevicesQuery.mockReturnValue({ data: undefined })
    locationHooks.useLocationsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderPage('/locations?page=invalid')

    expect(
      screen.getByText('No OwnTracks GPS points have been recorded yet.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()
  })

  it('renders fallback values for incomplete location fields', () => {
    locationHooks.useLocationsQuery.mockReturnValue({
      data: {
        locations: {
          total: 1,
          items: [
            {
              id: 99,
              device_id: 'phone',
              latitude: 40.736097,
              longitude: -74.039373,
              battery: null,
              accuracy: null,
              timestamp: '2026-03-14T09:00:00Z',
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

    const row = screen.getByRole('link', { name: '99' }).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getAllByText('—')).toHaveLength(3)
  })

  it('navigates to the preceding page beyond page two', async () => {
    const user = userEvent.setup()
    renderPage('/locations?page=4')

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(locationHooks.useLocationsQuery).toHaveBeenLastCalledWith({
        variables: expect.objectContaining({ offset: 50 }),
      }),
    )
  })
})

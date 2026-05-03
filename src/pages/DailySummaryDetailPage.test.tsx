import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '@/test/renderWithRouter'

const graphqlHooks = vi.hoisted(() => ({
  useUnifiedGpsQuery: vi.fn(),
  useUnifiedGpsLazyQuery: vi.fn(),
  useDailySummaryQuery: vi.fn(),
  useDailySummaryDateRangeQuery: vi.fn(),
}))

const leafletMocks = vi.hoisted(() => {
  class CircleMarkerMock {
    bindPopup = vi.fn()
    addTo = vi.fn()
    on = vi.fn()
    openPopup = vi.fn()
    getLatLng = vi.fn(() => ({ lat: 40.736, lng: -74.039 }))
  }

  class PolylineMock {
    addTo = vi.fn()
  }

  const mapInstance = {
    setView: vi.fn(),
    eachLayer: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    getZoom: vi.fn(() => 12),
  }

  mapInstance.setView.mockReturnValue(mapInstance)

  return {
    CircleMarkerMock,
    PolylineMock,
    mapInstance,
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    circleMarker: vi.fn(() => new CircleMarkerMock()),
    polyline: vi.fn(() => new PolylineMock()),
    latLngBounds: vi.fn(() => ({
      extend: vi.fn(),
      isValid: vi.fn(() => true),
    })),
  }
})

vi.mock('@/__generated__/graphql', () => graphqlHooks)

vi.mock('leaflet', () => ({
  default: {
    map: leafletMocks.map,
    tileLayer: leafletMocks.tileLayer,
    circleMarker: leafletMocks.circleMarker,
    polyline: leafletMocks.polyline,
    latLngBounds: leafletMocks.latLngBounds,
    CircleMarker: leafletMocks.CircleMarkerMock,
    Polyline: leafletMocks.PolylineMock,
  },
}))

import { DailySummaryDetailPage } from './DailySummaryDetailPage'

function renderDetail(route = '/daily-summary/2026-03-14') {
  return renderWithRouter(
    <Routes>
      <Route path="/daily-summary/:date" element={<DailySummaryDetailPage />} />
    </Routes>,
    { route },
  )
}

function emptyUnifiedGpsResult() {
  return {
    data: { unifiedGps: { total: 0, items: [] } },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  }
}

function defaultLazyQueryMock() {
  return [
    vi.fn().mockResolvedValue({
      data: { unifiedGps: { total: 0, items: [] } },
    }),
    { loading: false, called: false },
  ] as const
}

describe('DailySummaryDetailPage', () => {
  beforeEach(() => {
    graphqlHooks.useUnifiedGpsQuery.mockReset()
    graphqlHooks.useUnifiedGpsLazyQuery.mockReset()
    graphqlHooks.useDailySummaryQuery.mockReset()
    graphqlHooks.useDailySummaryDateRangeQuery.mockReset()

    // Sensible defaults for the supporting queries so tests can override only
    // the main useUnifiedGpsQuery as needed.
    graphqlHooks.useDailySummaryQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    graphqlHooks.useDailySummaryDateRangeQuery.mockReturnValue({
      data: {
        dailySummaryDateRange: {
          min_date: '2025-01-01',
          max_date: '2026-12-31',
        },
      },
    })
    graphqlHooks.useUnifiedGpsLazyQuery.mockReturnValue(defaultLazyQueryMock())

    leafletMocks.map.mockClear()
    leafletMocks.tileLayer.mockClear()
    leafletMocks.circleMarker.mockClear()
    leafletMocks.polyline.mockClear()
    leafletMocks.latLngBounds.mockClear()
    leafletMocks.mapInstance.setView.mockClear()
    leafletMocks.mapInstance.eachLayer.mockClear()
    leafletMocks.mapInstance.removeLayer.mockClear()
    leafletMocks.mapInstance.fitBounds.mockClear()
    leafletMocks.mapInstance.remove.mockClear()
    leafletMocks.mapInstance.invalidateSize.mockClear()
    leafletMocks.mapInstance.eachLayer.mockImplementation(() => {})
  })

  it('shows a loading state while day points load', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('Loading day points...')).toBeInTheDocument()
  })

  it('shows an error state and retries the query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('day failed'),
      refetch,
    })

    renderDetail()

    expect(screen.getByText('day failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('queries the selected day and renders the map with point rows', () => {
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({ variables }: { variables: { source?: string; limit?: number } }) => {
        // Per-source count queries use limit:1; return 0/0 so they don't affect
        // the header text in this baseline test.
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 2,
              items: [
                {
                  source: 'owntracks',
                  identifier: 'phone',
                  latitude: 40.736097,
                  longitude: -74.039373,
                  timestamp: '2026-03-14T09:00:00Z',
                  battery: 88,
                  speed_kmh: null,
                  heart_rate: null,
                },
                {
                  source: 'garmin',
                  identifier: 'run-1',
                  latitude: 40.7365,
                  longitude: -74.0388,
                  timestamp: '2026-03-14T10:00:00Z',
                  battery: null,
                  speed_kmh: 11.24,
                  heart_rate: 148,
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

    renderDetail()

    expect(
      screen.getByRole('heading', { name: 'March 14, 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/2 of 2 GPS points/)).toBeInTheDocument()
    expect(
      screen.getByTestId('daily-summary-map-container'),
    ).toBeInTheDocument()
    expect(screen.getByText('phone')).toBeInTheDocument()
    expect(screen.getByText('40.736097, -74.039373')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('11.2 km/h')).toBeInTheDocument()
    expect(screen.getByText('148 bpm')).toBeInTheDocument()
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenCalledWith({
      variables: {
        source: undefined,
        date_from: '2026-03-14',
        date_to: '2026-03-14',
        limit: 100,
        offset: 0,
        order: 'desc',
      },
      skip: false,
    })
    expect(leafletMocks.map).toHaveBeenCalledTimes(1)
    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(2)
    expect(leafletMocks.mapInstance.fitBounds).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('renders per-source counts in the header when both sources have points', () => {
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({ variables }: { variables: { source?: string; limit?: number } }) => {
        if (variables.source === 'owntracks' && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 12, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        if (variables.source === 'garmin' && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 5, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 17,
              items: [
                {
                  source: 'owntracks',
                  identifier: 'phone',
                  latitude: 40.736,
                  longitude: -74.039,
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

    renderDetail()

    expect(screen.getByText(/OwnTracks: 12/)).toBeInTheDocument()
    expect(screen.getByText(/Garmin: 5/)).toBeInTheDocument()
  })

  it('renders a per-day stats card when daily summary data is available', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue(emptyUnifiedGpsResult())
    graphqlHooks.useDailySummaryQuery.mockReturnValue({
      data: {
        dailySummary: {
          total: 1,
          items: [
            {
              activity_date: '2026-03-14',
              owntracks_device: 'phone',
              owntracks_points: 200,
              min_battery: 60,
              max_battery: 95,
              garmin_sport: 'running',
              total_distance_km: 8.7,
              avg_heart_rate: 152,
              total_calories: 640,
            },
          ],
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('Distance')).toBeInTheDocument()
    expect(screen.getByText('8.70 km')).toBeInTheDocument()
    expect(screen.getByText('Sport: running')).toBeInTheDocument()
    expect(screen.getByText('152 bpm')).toBeInTheDocument()
    expect(screen.getByText('640')).toBeInTheDocument()
    expect(screen.getByText('60–95%')).toBeInTheDocument()
    expect(screen.getByText('Device: phone')).toBeInTheDocument()
  })

  it('renders Previous Day and Next Day links bounded by the available date range', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue(emptyUnifiedGpsResult())
    renderDetail('/daily-summary/2026-03-14')

    expect(screen.getByRole('link', { name: 'Previous day' })).toHaveAttribute(
      'href',
      '/daily-summary/2026-03-13',
    )
    expect(screen.getByRole('link', { name: 'Next day' })).toHaveAttribute(
      'href',
      '/daily-summary/2026-03-15',
    )
  })

  it('disables the Next Day button on the latest available date', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue(emptyUnifiedGpsResult())
    graphqlHooks.useDailySummaryDateRangeQuery.mockReturnValue({
      data: {
        dailySummaryDateRange: {
          min_date: '2026-03-01',
          max_date: '2026-03-14',
        },
      },
    })

    renderDetail('/daily-summary/2026-03-14')

    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Previous day' })).toHaveAttribute(
      'href',
      '/daily-summary/2026-03-13',
    )
  })

  it('updates pagination offsets as the user moves between point pages', async () => {
    const user = userEvent.setup()
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: {
          source?: string
          offset: number
          limit?: number
        }
      }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 225,
              items: [
                {
                  source: variables.source ?? 'owntracks',
                  identifier: `point-${variables.offset}`,
                  latitude: 40.736097,
                  longitude: -74.039373,
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

    renderDetail()

    expect(screen.getByText('Showing 1–100 of 225')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await waitFor(() =>
      expect(screen.getByText('Showing 101–200 of 225')).toBeInTheDocument(),
    )
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenCalledWith({
      variables: {
        source: undefined,
        date_from: '2026-03-14',
        date_to: '2026-03-14',
        limit: 100,
        offset: 100,
        order: 'desc',
      },
      skip: false,
    })

    await user.click(screen.getByRole('button', { name: 'Previous page' }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–100 of 225')).toBeInTheDocument(),
    )
  })

  it('clamps out-of-range page params to the last available page', async () => {
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: { source?: string; offset: number; limit?: number }
      }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        // Empty items when the offset is beyond the data (page=9 with 250
        // items means offset=800 > 250).
        if (variables.offset >= 250) {
          return {
            data: { unifiedGps: { total: 250, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 250,
              items: [
                {
                  source: 'owntracks',
                  identifier: `point-${variables.offset}`,
                  latitude: 40.736097,
                  longitude: -74.039373,
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

    renderDetail('/daily-summary/2026-03-14?page=9')

    await waitFor(() =>
      expect(screen.getByText('Showing 201–250 of 250')).toBeInTheDocument(),
    )
  })

  it('filters points by source and resets pagination', async () => {
    const user = userEvent.setup()
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: {
          source?: string
          offset: number
          limit?: number
        }
      }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: {
              unifiedGps: {
                total: variables.source === 'owntracks' ? 80 : 145,
                items: [],
              },
            },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: variables.source === 'owntracks' ? 80 : 225,
              items: [
                {
                  source: variables.source ?? 'owntracks',
                  identifier: `point-${variables.offset}`,
                  latitude: 40.736097,
                  longitude: -74.039373,
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

    renderDetail('/daily-summary/2026-03-14?page=2')

    await waitFor(() =>
      expect(screen.getByText('Showing 101–200 of 225')).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'OwnTracks' }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–80 of 80')).toBeInTheDocument(),
    )
    expect(screen.getByText(/from owntracks/)).toBeInTheDocument()
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenCalledWith({
      variables: {
        source: 'owntracks',
        date_from: '2026-03-14',
        date_to: '2026-03-14',
        limit: 100,
        offset: 0,
        order: 'desc',
      },
      skip: false,
    })
  })

  it('toggles the sort order and resets to page 1', async () => {
    const user = userEvent.setup()
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({
        variables,
      }: {
        variables: {
          source?: string
          offset: number
          limit?: number
          order: string
        }
      }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 5,
              items: [
                {
                  source: 'owntracks',
                  identifier: `point-${variables.offset}`,
                  latitude: 40.736,
                  longitude: -74.039,
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

    renderDetail()

    const orderButton = screen.getByRole('button', {
      name: /Sort by time descending/i,
    })
    await user.click(orderButton)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Sort by time ascending/i }),
      ).toBeInTheDocument(),
    )
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenCalledWith({
      variables: {
        source: undefined,
        date_from: '2026-03-14',
        date_to: '2026-03-14',
        limit: 100,
        offset: 0,
        order: 'asc',
      },
      skip: false,
    })
  })

  it('draws a track polyline when the show-track toggle is enabled', async () => {
    const user = userEvent.setup()
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({ variables }: { variables: { source?: string; limit?: number } }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 2,
              items: [
                {
                  source: 'owntracks',
                  identifier: 'phone',
                  latitude: 40.736,
                  longitude: -74.039,
                  timestamp: '2026-03-14T09:00:00Z',
                },
                {
                  source: 'owntracks',
                  identifier: 'phone',
                  latitude: 40.738,
                  longitude: -74.041,
                  timestamp: '2026-03-14T10:00:00Z',
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

    renderDetail()

    expect(leafletMocks.polyline).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Show track/i }))

    await waitFor(() => expect(leafletMocks.polyline).toHaveBeenCalled())
  })

  it('exposes accessible aria-current on the active source filter button', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue(emptyUnifiedGpsResult())
    renderDetail('/daily-summary/2026-03-14?source=garmin')

    const garmin = screen.getByRole('button', { name: 'Garmin' })
    expect(garmin).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('button', { name: 'OwnTracks' }),
    ).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows an empty state when the selected day has no points', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue(emptyUnifiedGpsResult())

    renderDetail()

    expect(screen.getByText('No points available')).toBeInTheDocument()
  })

  it('downloads a CSV via the lazy query when Export CSV is clicked', async () => {
    const user = userEvent.setup()
    const lazyFetch = vi.fn().mockResolvedValue({
      data: {
        unifiedGps: {
          total: 1,
          items: [
            {
              source: 'owntracks',
              identifier: 'phone',
              latitude: 40.736,
              longitude: -74.039,
              timestamp: '2026-03-14T09:00:00Z',
              battery: 88,
              speed_kmh: null,
              heart_rate: null,
              accuracy: 5,
            },
          ],
        },
      },
    })
    graphqlHooks.useUnifiedGpsLazyQuery.mockReturnValue([
      lazyFetch,
      { loading: false, called: false },
    ])
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({ variables }: { variables: { source?: string; limit?: number } }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 1,
              items: [
                {
                  source: 'owntracks',
                  identifier: 'phone',
                  latitude: 40.736,
                  longitude: -74.039,
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

    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    const originalClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = vi.fn()

    renderDetail()

    await user.click(
      screen.getByRole('button', { name: 'Download points as CSV' }),
    )

    await waitFor(() => expect(lazyFetch).toHaveBeenCalledTimes(1))
    expect(lazyFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          date_from: '2026-03-14',
          date_to: '2026-03-14',
          limit: 10000,
        }),
      }),
    )
    expect(createObjectURL).toHaveBeenCalled()

    HTMLAnchorElement.prototype.click = originalClick
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  })

  it('handles invalid route dates by skipping the query', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail('/daily-summary/not-a-date')

    expect(
      screen.getByText('Select a valid daily summary date.'),
    ).toBeInTheDocument()
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenCalledWith({
      variables: {
        source: undefined,
        date_from: '',
        date_to: '',
        limit: 100,
        offset: 0,
        order: 'desc',
      },
      skip: true,
    })
  })

  it('renders a safe DOM popup (no HTML injection) for identifiers with angle brackets', () => {
    graphqlHooks.useUnifiedGpsQuery.mockImplementation(
      ({ variables }: { variables: { source?: string; limit?: number } }) => {
        if (variables.source && variables.limit === 1) {
          return {
            data: { unifiedGps: { total: 0, items: [] } },
            loading: false,
            error: undefined,
            refetch: vi.fn(),
          }
        }
        return {
          data: {
            unifiedGps: {
              total: 1,
              items: [
                {
                  source: 'owntracks',
                  identifier: '<img src=x onerror=alert(1)>',
                  latitude: 40.736,
                  longitude: -74.039,
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

    renderDetail()

    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(1)
    const marker = leafletMocks.circleMarker.mock.results[0]!
      .value as InstanceType<typeof leafletMocks.CircleMarkerMock>
    expect(marker.bindPopup).toHaveBeenCalledTimes(1)
    const [popupArg] = marker.bindPopup.mock.calls[0] as [unknown]
    // The popup content must be a DOM element (not an HTML string) so Leaflet
    // treats the interpolated values as text and any angle brackets are
    // escaped automatically.
    expect(popupArg).toBeInstanceOf(HTMLElement)
    const popupElement = popupArg as HTMLElement
    expect(popupElement.querySelector('img')).toBeNull()
    expect(popupElement.textContent).toContain('<img src=x onerror=alert(1)>')
  })
})

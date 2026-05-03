import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '@/test/renderWithRouter'

const graphqlHooks = vi.hoisted(() => ({
  useUnifiedGpsQuery: vi.fn(),
}))

const leafletMocks = vi.hoisted(() => {
  class CircleMarkerMock {
    bindPopup = vi.fn()
    addTo = vi.fn()
  }

  const mapInstance = {
    setView: vi.fn(),
    eachLayer: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
  }

  mapInstance.setView.mockReturnValue(mapInstance)

  return {
    CircleMarkerMock,
    mapInstance,
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    circleMarker: vi.fn(() => new CircleMarkerMock()),
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
    latLngBounds: leafletMocks.latLngBounds,
    CircleMarker: leafletMocks.CircleMarkerMock,
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

describe('DailySummaryDetailPage', () => {
  beforeEach(() => {
    graphqlHooks.useUnifiedGpsQuery.mockReset()
    leafletMocks.map.mockClear()
    leafletMocks.tileLayer.mockClear()
    leafletMocks.circleMarker.mockClear()
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
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
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
    })

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
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
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
        }
      }) => ({
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
      }),
    )

    renderDetail()

    expect(screen.getByText('Showing 1–100 of 225')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 101–200 of 225')).toBeInTheDocument(),
    )
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenLastCalledWith({
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

    await user.click(screen.getByRole('button', { name: /Prev/i }))

    await waitFor(() =>
      expect(screen.getByText('Showing 1–100 of 225')).toBeInTheDocument(),
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
        }
      }) => ({
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
      }),
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
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenLastCalledWith({
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

  it('shows an empty state when the selected day has no points', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: { unifiedGps: { total: 0, items: [] } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('No points available')).toBeInTheDocument()
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
})

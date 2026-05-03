import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const FIXED_DATE = new Date('2026-04-03T12:00:00Z')

const graphqlHooks = vi.hoisted(() => ({
  useUnifiedGpsQuery: vi.fn(),
  useLocationDateRangeQuery: vi.fn(),
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

import { MapPage } from './MapPage'

describe('MapPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FIXED_DATE)
    graphqlHooks.useUnifiedGpsQuery.mockReset()
    graphqlHooks.useLocationDateRangeQuery.mockReturnValue({
      data: {
        locationDateRange: {
          min_date: '2025-12-27T00:00:00Z',
          max_date: '2026-06-01T00:00:00Z',
        },
      },
    })
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading state while map data loads', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<MapPage />)

    expect(screen.getByText('Loading map data...')).toBeInTheDocument()
  })

  it('shows an error state and retries the query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('map failed'),
      refetch,
    })

    render(<MapPage />)

    expect(screen.getByText('map failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the point summary and creates Leaflet markers', () => {
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
            },
            {
              source: 'garmin',
              identifier: 'run-1',
              latitude: 40.7365,
              longitude: -74.0388,
              timestamp: '2026-03-14T10:00:00Z',
            },
          ],
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<MapPage />)

    expect(screen.getByText('Unified Map')).toBeInTheDocument()
    expect(screen.getByText(/April 3, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/\(Today\)/)).toBeInTheDocument()
    expect(screen.getByText(/2 of 2 points/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Apr 3, 2026/ }),
    ).toBeInTheDocument()
    expect(graphqlHooks.useUnifiedGpsQuery).toHaveBeenCalledWith({
      variables: {
        date_from: '2026-04-03',
        date_to: '2026-04-03',
        limit: 5000,
        order: 'desc',
        exclude_stationary: true,
        deduplicate: true,
      },
    })
    expect(leafletMocks.map).toHaveBeenCalledTimes(1)
    expect(leafletMocks.tileLayer).toHaveBeenCalledTimes(1)
    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(2)
    expect(leafletMocks.mapInstance.fitBounds).toHaveBeenCalledTimes(1)
  })

  it('calls useLocationDateRangeQuery and provides bounds to Calendar', () => {
    graphqlHooks.useUnifiedGpsQuery.mockReturnValue({
      data: { unifiedGps: { total: 0, items: [] } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    render(<MapPage />)

    expect(graphqlHooks.useLocationDateRangeQuery).toHaveBeenCalled()
    expect(screen.getByText('Unified Map')).toBeInTheDocument()
  })
})

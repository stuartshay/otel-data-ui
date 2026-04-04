import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const FIXED_DATE = new Date('2026-04-03T12:00:00Z')

const unifiedGpsHook = vi.hoisted(() => ({
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

vi.mock('@/__generated__/graphql', () => unifiedGpsHook)

vi.mock('leaflet', () => ({
  default: {
    map: leafletMocks.map,
    tileLayer: leafletMocks.tileLayer,
    circleMarker: leafletMocks.circleMarker,
    latLngBounds: leafletMocks.latLngBounds,
    CircleMarker: leafletMocks.CircleMarkerMock,
  },
}))

import { MapPage } from './MapPage'

describe('MapPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FIXED_DATE)
    unifiedGpsHook.useUnifiedGpsQuery.mockReset()
    leafletMocks.map.mockClear()
    leafletMocks.tileLayer.mockClear()
    leafletMocks.circleMarker.mockClear()
    leafletMocks.latLngBounds.mockClear()
    leafletMocks.mapInstance.setView.mockClear()
    leafletMocks.mapInstance.eachLayer.mockClear()
    leafletMocks.mapInstance.removeLayer.mockClear()
    leafletMocks.mapInstance.fitBounds.mockClear()
    leafletMocks.mapInstance.remove.mockClear()
    leafletMocks.mapInstance.eachLayer.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading state while map data loads', () => {
    unifiedGpsHook.useUnifiedGpsQuery.mockReturnValue({
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
    unifiedGpsHook.useUnifiedGpsQuery.mockReturnValue({
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
    unifiedGpsHook.useUnifiedGpsQuery.mockReturnValue({
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
    expect(unifiedGpsHook.useUnifiedGpsQuery).toHaveBeenCalledWith({
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
})

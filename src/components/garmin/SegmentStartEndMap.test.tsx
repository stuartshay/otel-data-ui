import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SegmentStartEndMap } from './SegmentStartEndMap'

const leafletMocks = vi.hoisted(() => {
  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
  }
  const layer = {
    addTo: vi.fn().mockReturnThis(),
  }
  const marker = {
    bindPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  }
  const bounds = {
    isValid: vi.fn(() => true),
  }

  return {
    mapInstance,
    layer,
    marker,
    bounds,
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => layer),
    polyline: vi.fn<(...args: unknown[]) => typeof layer>(() => layer),
    circleMarker: vi.fn(() => marker),
    latLngBounds: vi.fn(() => bounds),
  }
})

vi.mock('leaflet', () => ({
  default: {
    map: leafletMocks.map,
    tileLayer: leafletMocks.tileLayer,
    polyline: leafletMocks.polyline,
    circleMarker: leafletMocks.circleMarker,
    latLngBounds: leafletMocks.latLngBounds,
  },
}))

describe('SegmentStartEndMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    leafletMocks.bounds.isValid.mockReturnValue(true)
  })

  it('draws elevation-colored route segments and endpoint markers', async () => {
    const routePoints = [
      { latitude: 40.79, longitude: -73.96, altitude: 0 },
      { latitude: 40.795, longitude: -73.955, altitude: 25 },
      { latitude: 40.8, longitude: -73.95, altitude: 50 },
      { latitude: 40.805, longitude: -73.945, altitude: 75 },
      { latitude: 40.81, longitude: -73.94, altitude: 100 },
    ]

    render(
      <SegmentStartEndMap
        startLat={40.79}
        startLon={-73.96}
        endLat={40.81}
        endLon={-73.94}
        routePoints={routePoints}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))

    expect(leafletMocks.tileLayer).toHaveBeenCalledWith(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      expect.objectContaining({
        attribution: '&copy; OpenStreetMap contributors',
      }),
    )
    expect(
      leafletMocks.polyline.mock.calls.map(
        ([, options]) => (options as { color: string }).color,
      ),
    ).toEqual(['#2563eb', '#16a34a', '#f59e0b', '#dc2626'])
    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(2)
    expect(leafletMocks.marker.bindPopup).toHaveBeenNthCalledWith(1, 'Start')
    expect(leafletMocks.marker.bindPopup).toHaveBeenNthCalledWith(2, 'Finish')
    expect(leafletMocks.latLngBounds).toHaveBeenCalledWith(
      routePoints.map(({ latitude, longitude }) => [latitude, longitude]),
    )
    expect(leafletMocks.mapInstance.fitBounds).toHaveBeenCalledWith(
      leafletMocks.bounds,
      { padding: [40, 40], maxZoom: 16 },
    )
  })

  it('uses the fallback color for missing and unusable elevations', async () => {
    render(
      <SegmentStartEndMap
        startLat={40.79}
        startLon={-73.96}
        endLat={40.81}
        endLon={-73.94}
        routePoints={[
          { latitude: 40.79, longitude: -73.96 },
          { latitude: 40.8, longitude: -73.95, altitude: Number.NaN },
          { latitude: 40.81, longitude: -73.94, altitude: null },
        ]}
      />,
    )

    await waitFor(() => expect(leafletMocks.polyline).toHaveBeenCalledTimes(2))

    expect(
      leafletMocks.polyline.mock.calls.map(
        ([, options]) => (options as { color: string }).color,
      ),
    ).toEqual(['#2563eb', '#2563eb'])
  })

  it('falls back to a straight dashed line and skips invalid bounds', async () => {
    leafletMocks.bounds.isValid.mockReturnValue(false)

    render(
      <SegmentStartEndMap
        startLat={40.79}
        startLon={-73.96}
        endLat={40.81}
        endLon={-73.94}
      />,
    )

    await waitFor(() => expect(leafletMocks.polyline).toHaveBeenCalledTimes(1))

    expect(leafletMocks.polyline).toHaveBeenCalledWith(
      [
        [40.79, -73.96],
        [40.81, -73.94],
      ],
      expect.objectContaining({ color: '#6366f1', dashArray: '6 6' }),
    )
    expect(leafletMocks.latLngBounds).toHaveBeenCalledWith([
      [40.79, -73.96],
      [40.81, -73.94],
    ])
    expect(leafletMocks.mapInstance.fitBounds).not.toHaveBeenCalled()
  })

  it('removes the previous map on rerender and the current map on unmount', async () => {
    const firstMap = {
      setView: vi.fn().mockReturnThis(),
      fitBounds: vi.fn(),
      remove: vi.fn(),
    }
    const secondMap = {
      setView: vi.fn().mockReturnThis(),
      fitBounds: vi.fn(),
      remove: vi.fn(),
    }
    leafletMocks.map
      .mockReturnValueOnce(firstMap)
      .mockReturnValueOnce(secondMap)

    const { rerender, unmount } = render(
      <SegmentStartEndMap
        startLat={40.79}
        startLon={-73.96}
        endLat={40.81}
        endLon={-73.94}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))

    rerender(
      <SegmentStartEndMap
        startLat={41}
        startLon={-74}
        endLat={41.01}
        endLon={-73.99}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(2))
    expect(firstMap.remove).toHaveBeenCalledTimes(1)
    expect(secondMap.remove).not.toHaveBeenCalled()

    unmount()
    expect(firstMap.remove).toHaveBeenCalledTimes(1)
    expect(secondMap.remove).toHaveBeenCalledTimes(1)
  })
})

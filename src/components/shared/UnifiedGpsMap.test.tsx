import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const leafletMocks = vi.hoisted(() => {
  class CircleMarkerMock {
    bindPopup = vi.fn().mockReturnThis()
    addTo = vi.fn().mockReturnThis()
    on = vi.fn().mockReturnThis()
    openPopup = vi.fn().mockReturnThis()
    getLatLng = vi.fn(() => ({ lat: 40.736, lng: -74.039 }))
  }

  class PolylineMock {
    addTo = vi.fn().mockReturnThis()
  }

  class OtherLayerMock {}

  const layers: unknown[] = []
  const mapInstance = {
    setView: vi.fn(),
    eachLayer: vi.fn((callback: (layer: unknown) => void) => {
      layers.forEach(callback)
    }),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    getZoom: vi.fn(() => 12),
  }
  mapInstance.setView.mockReturnValue(mapInstance)

  const bounds = {
    extend: vi.fn(),
    isValid: vi.fn(() => true),
  }

  const markers: CircleMarkerMock[] = []
  const polylines: PolylineMock[] = []

  return {
    CircleMarkerMock,
    PolylineMock,
    OtherLayerMock,
    layers,
    mapInstance,
    bounds,
    markers,
    polylines,
    map: vi.fn(() => mapInstance),
    tileLayerAddTo: vi.fn(),
    tileLayer: vi.fn(() => ({ addTo: leafletMocks.tileLayerAddTo })),
    circleMarker: vi.fn(() => {
      const marker = new CircleMarkerMock()
      markers.push(marker)
      return marker
    }),
    polyline: vi.fn(() => {
      const polyline = new PolylineMock()
      polylines.push(polyline)
      return polyline
    }),
    latLngBounds: vi.fn(() => bounds),
  }
})

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

import {
  UnifiedGpsMap,
  type ColorBy,
  type UnifiedGpsMapPoint,
} from './UnifiedGpsMap'

function point(
  identifier: string,
  overrides: Partial<UnifiedGpsMapPoint> = {},
): UnifiedGpsMapPoint {
  return {
    source: 'owntracks',
    identifier,
    latitude: 40.736,
    longitude: -74.039,
    timestamp: '2026-07-13T12:00:00Z',
    ...overrides,
  }
}

function markerOptions(index: number):
  | {
      fillColor: string
      color: string
    }
  | undefined {
  const calls = leafletMocks.circleMarker.mock.calls as unknown as Array<
    [unknown, { fillColor: string; color: string }]
  >
  return calls[index]?.[1]
}

describe('UnifiedGpsMap', () => {
  const rafCallbacks = new Map<number, FrameRequestCallback>()
  let nextRafId = 1
  const resizeObservers: Array<{
    callback: ResizeObserverCallback
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }> = []

  beforeEach(() => {
    vi.clearAllMocks()
    leafletMocks.layers.length = 0
    leafletMocks.markers.length = 0
    leafletMocks.polylines.length = 0
    leafletMocks.bounds.isValid.mockReturnValue(true)
    leafletMocks.mapInstance.getZoom.mockReturnValue(12)
    rafCallbacks.clear()
    nextRafId = 1
    resizeObservers.length = 0

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextRafId
      nextRafId += 1
      rafCallbacks.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks.delete(id)
    })
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: ResizeObserverCallback
        observe = vi.fn()
        disconnect = vi.fn()

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback
          resizeObservers.push(this)
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initializes, resizes, replaces map layers, and cleans up', () => {
    const oldMarker = new leafletMocks.CircleMarkerMock()
    const oldPolyline = new leafletMocks.PolylineMock()
    const tileLayer = new leafletMocks.OtherLayerMock()
    leafletMocks.layers.push(oldMarker, oldPolyline, tileLayer)

    const { unmount } = render(<UnifiedGpsMap points={[]} />)

    expect(leafletMocks.map).toHaveBeenCalledWith(
      screen.getByTestId('unified-map-container'),
    )
    expect(leafletMocks.mapInstance.setView).toHaveBeenCalledWith(
      [40.736, -74.039],
      12,
    )
    expect(leafletMocks.tileLayer).toHaveBeenCalledWith(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors' },
    )
    expect(leafletMocks.mapInstance.removeLayer).toHaveBeenCalledWith(oldMarker)
    expect(leafletMocks.mapInstance.removeLayer).toHaveBeenCalledWith(
      oldPolyline,
    )
    expect(leafletMocks.mapInstance.removeLayer).not.toHaveBeenCalledWith(
      tileLayer,
    )

    expect(rafCallbacks.size).toBe(1)
    const [outerEntry] = rafCallbacks.entries()
    const [outerRafId, outerCallback] = outerEntry ?? []
    expect(outerCallback).toBeDefined()
    act(() => outerCallback?.(0))
    const innerCallback = [...rafCallbacks.entries()].find(
      ([rafId]) => rafId !== outerRafId,
    )?.[1]
    expect(innerCallback).toBeDefined()
    act(() => innerCallback?.(0))
    expect(leafletMocks.mapInstance.invalidateSize).toHaveBeenCalledTimes(1)

    act(() => resizeObservers[0]?.callback([], resizeObservers[0] as never))
    expect(leafletMocks.mapInstance.invalidateSize).toHaveBeenCalledTimes(2)

    const resizeCallback = resizeObservers[0]?.callback

    unmount()

    expect(resizeObservers[0]?.disconnect).toHaveBeenCalledTimes(1)
    expect(leafletMocks.mapInstance.remove).toHaveBeenCalledTimes(1)
    expect(rafCallbacks.size).toBe(0)

    act(() => resizeCallback?.([], resizeObservers[0] as never))
    expect(leafletMocks.mapInstance.invalidateSize).toHaveBeenCalledTimes(2)
  })

  it('renders source colors and safe popup details', () => {
    const unsafeIdentifier = '<script>alert("x")</script>&device'
    const points = [
      point(unsafeIdentifier, {
        speed_kmh: 12.34,
        heart_rate: 145,
        battery: 87,
      }),
      point('garmin-device', { source: 'garmin' }),
    ]

    render(<UnifiedGpsMap points={points} />)

    expect(markerOptions(0)).toMatchObject({
      fillColor: '#3b82f6',
      color: '#3b82f6',
    })
    expect(markerOptions(1)).toMatchObject({
      fillColor: '#ef4444',
      color: '#ef4444',
    })

    const popup = leafletMocks.markers[0]?.bindPopup.mock.calls[0]?.[0]
    expect(popup).toBeInstanceOf(HTMLDivElement)
    expect(popup.textContent).toContain('owntracks')
    expect(popup.textContent).toContain(unsafeIdentifier)
    expect(popup.textContent).toContain('12.3 km/h · 145 bpm · 87% battery')
    expect(popup.querySelector('script')).toBeNull()

    const popupWithoutDetails =
      leafletMocks.markers[1]?.bindPopup.mock.calls[0]?.[0]
    expect(popupWithoutDetails.textContent).not.toContain('km/h')
    expect(leafletMocks.bounds.extend).toHaveBeenNthCalledWith(
      1,
      [40.736, -74.039],
    )
    expect(leafletMocks.mapInstance.fitBounds).toHaveBeenCalledWith(
      leafletMocks.bounds,
      { padding: [20, 20] },
    )
  })

  it.each([
    ['speed', 'speed_kmh'],
    ['heart_rate', 'heart_rate'],
    ['battery', 'battery'],
  ] as const)(
    'scales %s values across the complete color gradient',
    (colorBy, metric) => {
      const values = [0, 20, 40, 60, 80]
      const points = values.map((value, index) =>
        point(`${colorBy}-${index}`, { [metric]: value }),
      )
      points.push(point(`${colorBy}-missing`))

      render(<UnifiedGpsMap points={points} colorBy={colorBy as ColorBy} />)

      expect(
        leafletMocks.circleMarker.mock.calls.map(
          (_, index) => markerOptions(index)?.fillColor,
        ),
      ).toEqual([
        '#3b82f6',
        '#22c55e',
        '#eab308',
        '#ef4444',
        '#ef4444',
        '#9ca3af',
      ])
    },
  )

  it('uses the low color when all metric values are equal', () => {
    render(
      <UnifiedGpsMap
        points={[
          point('one', { speed_kmh: 10 }),
          point('two', { speed_kmh: 10 }),
        ]}
        colorBy="speed"
      />,
    )

    expect(markerOptions(0)?.fillColor).toBe('#3b82f6')
    expect(markerOptions(1)?.fillColor).toBe('#3b82f6')
  })

  it('renders missing metric values without ResizeObserver support', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    render(<UnifiedGpsMap points={[point('missing')]} colorBy="speed" />)

    expect(markerOptions(0)?.fillColor).toBe('#9ca3af')
    expect(resizeObservers).toHaveLength(0)
  })

  it('groups tracks by source and sorts their points by timestamp', () => {
    const points = [
      point('owntracks-late', {
        timestamp: '2026-07-13T12:10:00Z',
        latitude: 2,
        longitude: 2,
      }),
      point('garmin', {
        source: 'garmin',
        timestamp: '2026-07-13T12:05:00Z',
        latitude: 3,
        longitude: 3,
      }),
      point('owntracks-early', {
        timestamp: '2026-07-13T12:00:00Z',
        latitude: 1,
        longitude: 1,
      }),
    ]

    render(<UnifiedGpsMap points={points} showTrack />)

    expect(leafletMocks.polyline).toHaveBeenNthCalledWith(
      1,
      [
        [1, 1],
        [2, 2],
      ],
      { color: '#3b82f6', weight: 2, opacity: 0.5 },
    )
    expect(leafletMocks.polyline).toHaveBeenNthCalledWith(2, [[3, 3]], {
      color: '#ef4444',
      weight: 2,
      opacity: 0.5,
    })
    expect(leafletMocks.polylines[0]?.addTo).toHaveBeenCalledWith(
      leafletMocks.mapInstance,
    )
  })

  it('uses the latest click handler and includes the point index in its key', () => {
    const firstHandler = vi.fn()
    const latestHandler = vi.fn()
    const selectedPoint = point('phone')
    const { rerender } = render(
      <UnifiedGpsMap points={[selectedPoint]} onMarkerClick={firstHandler} />,
    )
    const clickHandler = leafletMocks.markers[0]?.on.mock.calls[0]?.[1]

    rerender(
      <UnifiedGpsMap points={[selectedPoint]} onMarkerClick={latestHandler} />,
    )
    act(() => clickHandler())

    expect(firstHandler).not.toHaveBeenCalled()
    expect(latestHandler).toHaveBeenCalledWith(
      selectedPoint,
      'owntracks-phone-2026-07-13T12:00:00Z-0',
    )
  })

  it('focuses a known marker without zooming out', () => {
    leafletMocks.mapInstance.getZoom.mockReturnValue(18)
    const selectedPoint = point('phone')
    const focusKey = 'owntracks-phone-2026-07-13T12:00:00Z-0'

    render(<UnifiedGpsMap points={[selectedPoint]} focusKey={focusKey} />)

    expect(leafletMocks.mapInstance.setView).toHaveBeenLastCalledWith(
      { lat: 40.736, lng: -74.039 },
      18,
      { animate: true },
    )
    expect(leafletMocks.markers[0]?.openPopup).toHaveBeenCalledTimes(1)
  })

  it('ignores missing focus keys and invalid bounds', () => {
    leafletMocks.bounds.isValid.mockReturnValue(false)

    render(<UnifiedGpsMap points={[point('phone')]} focusKey="missing-key" />)

    expect(leafletMocks.mapInstance.fitBounds).not.toHaveBeenCalled()
    expect(leafletMocks.mapInstance.setView).toHaveBeenCalledTimes(1)
    expect(leafletMocks.markers[0]?.openPopup).not.toHaveBeenCalled()
  })
})

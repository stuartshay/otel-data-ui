import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SegmentMiniMap } from './SegmentMiniMap'

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
    polyline: vi.fn(() => layer),
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

const graphqlMocks = vi.hoisted(() => ({
  useGarminChartDataQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => graphqlMocks)

describe('SegmentMiniMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    leafletMocks.bounds.isValid.mockReturnValue(true)
  })

  it('renders an OpenStreetMap tile layer and the real recovered route path', async () => {
    graphqlMocks.useGarminChartDataQuery.mockReturnValue({
      data: {
        garminChartData: [
          { latitude: 40.79, longitude: -73.96, altitude: 10 },
          { latitude: 40.795, longitude: -73.955, altitude: 12 },
          { latitude: 40.798, longitude: -73.948, altitude: 15 },
          { latitude: 40.8, longitude: -73.94, altitude: 18 },
        ],
      },
    })

    render(
      <SegmentMiniMap
        startLat={40.79}
        startLon={-73.96}
        endLat={40.8}
        endLon={-73.94}
        label="Harlem Hill"
        sourceActivityId="23493313338"
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))

    expect(graphqlMocks.useGarminChartDataQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { activity_id: '23493313338' } }),
    )
    expect(leafletMocks.tileLayer).toHaveBeenCalledWith(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      expect.objectContaining({
        attribution: '&copy; OpenStreetMap contributors',
      }),
    )
    expect(leafletMocks.polyline).toHaveBeenCalledWith(
      [
        [40.79, -73.96],
        [40.795, -73.955],
        [40.798, -73.948],
        [40.8, -73.94],
      ],
      expect.objectContaining({ color: '#2563eb' }),
    )
    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(2)
  })

  it('falls back to a straight line when no source track is available', async () => {
    graphqlMocks.useGarminChartDataQuery.mockReturnValue({ data: undefined })

    render(
      <SegmentMiniMap
        startLat={40.79}
        startLon={-73.96}
        endLat={40.8}
        endLon={-73.94}
        label="Harlem Hill"
        sourceActivityId={null}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))

    expect(graphqlMocks.useGarminChartDataQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    )
    expect(leafletMocks.polyline).toHaveBeenCalledWith(
      [
        [40.79, -73.96],
        [40.8, -73.94],
      ],
      expect.objectContaining({ dashArray: '6 6' }),
    )
  })
})

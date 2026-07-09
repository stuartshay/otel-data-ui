import { describe, expect, it } from 'vitest'
import { getSegmentRoutePoints } from './segmentRoute'

describe('getSegmentRoutePoints', () => {
  it('returns the inclusive source-track slice between segment endpoints', () => {
    const points = [
      { latitude: 40.0, longitude: -73.0, id: 'before' },
      { latitude: 40.1, longitude: -73.1, id: 'start' },
      { latitude: 40.2, longitude: -73.2, id: 'middle' },
      { latitude: 40.3, longitude: -73.3, id: 'end' },
      { latitude: 40.4, longitude: -73.4, id: 'after' },
    ]

    const route = getSegmentRoutePoints(
      points,
      { lat: 40.101, lon: -73.101 },
      { lat: 40.299, lon: -73.299 },
    )

    expect(route.map((point) => point.id)).toEqual(['start', 'middle', 'end'])
  })

  it('keeps the route ordered by source activity even when endpoints are reversed', () => {
    const points = [
      { latitude: 40.0, longitude: -73.0, id: 'start' },
      { latitude: 40.1, longitude: -73.1, id: 'middle' },
      { latitude: 40.2, longitude: -73.2, id: 'end' },
    ]

    const route = getSegmentRoutePoints(
      points,
      { lat: 40.2, lon: -73.2 },
      { lat: 40.0, lon: -73.0 },
    )

    expect(route.map((point) => point.id)).toEqual(['start', 'middle', 'end'])
  })

  it('drops points without usable coordinates', () => {
    const route = getSegmentRoutePoints(
      [
        { latitude: null, longitude: -73.0, id: 'bad-start' },
        { latitude: 40.1, longitude: -73.1, id: 'start' },
        { latitude: Number.NaN, longitude: -73.2, id: 'bad-middle' },
        { latitude: 40.3, longitude: -73.3, id: 'end' },
      ],
      { lat: 40.1, lon: -73.1 },
      { lat: 40.3, lon: -73.3 },
    )

    expect(route.map((point) => point.id)).toEqual(['start', 'end'])
  })
})

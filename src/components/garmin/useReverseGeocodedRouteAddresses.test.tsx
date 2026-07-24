import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const graphqlMocks = vi.hoisted(() => ({
  useReverseGeocodePointsBatchQuery: vi.fn(),
  reverseGeocodePoint: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => ({
  useReverseGeocodePointsBatchQuery:
    graphqlMocks.useReverseGeocodePointsBatchQuery,
  useReverseGeocodePointLazyQuery: () => [graphqlMocks.reverseGeocodePoint],
}))

import { useReverseGeocodedRouteAddresses } from './useReverseGeocodedRouteAddresses'
import { SegmentPointAddress } from './SegmentPointAddress'

function TestHarness({
  routePoints,
  latitude,
  longitude,
}: Readonly<{
  routePoints: { latitude: number | null; longitude: number | null }[]
  latitude: number
  longitude: number
}>) {
  useReverseGeocodedRouteAddresses(routePoints)
  return (
    <SegmentPointAddress
      latitude={latitude}
      longitude={longitude}
      selected={false}
    />
  )
}

describe('useReverseGeocodedRouteAddresses', () => {
  beforeEach(() => {
    graphqlMocks.useReverseGeocodePointsBatchQuery.mockReset()
    graphqlMocks.useReverseGeocodePointsBatchQuery.mockReturnValue({
      data: undefined,
    })
    graphqlMocks.reverseGeocodePoint.mockReset()
  })

  it('dedupes route points to their rounded cell before requesting a batch', () => {
    render(
      <TestHarness
        routePoints={[
          { latitude: 41.10011, longitude: -74.20011 },
          { latitude: 41.100114, longitude: -74.200114 }, // same ~11m cell
          { latitude: null, longitude: -74.20011 }, // invalid, skipped
          { latitude: 41.10021, longitude: -74.20021 },
        ]}
        latitude={41.10011}
        longitude={-74.20011}
      />,
    )

    expect(graphqlMocks.useReverseGeocodePointsBatchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          points: [
            { latitude: 41.10011, longitude: -74.20011 },
            { latitude: 41.10021, longitude: -74.20021 },
          ],
        },
        skip: false,
      }),
    )
  })

  it('skips the query when there are no valid route points', () => {
    render(
      <TestHarness
        routePoints={[{ latitude: null, longitude: null }]}
        latitude={41.20011}
        longitude={-74.30011}
      />,
    )

    expect(graphqlMocks.useReverseGeocodePointsBatchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    )
  })

  it('caps the batch at 300 deduped points', () => {
    const routePoints = Array.from({ length: 350 }, (_, i) => ({
      // Each index moves by ~110m, comfortably past the ~11m dedup cell so
      // every point is distinct.
      latitude: 40 + i * 0.001,
      longitude: -74,
    }))

    render(
      <TestHarness routePoints={routePoints} latitude={40} longitude={-74} />,
    )

    const call = graphqlMocks.useReverseGeocodePointsBatchQuery.mock
      .calls[0]?.[0] as {
      variables: { points: unknown[] }
    }
    expect(call.variables.points).toHaveLength(300)
  })

  it('seeds the shared address cache from a successful batch result, letting SegmentPointAddress render it without its own request', async () => {
    graphqlMocks.useReverseGeocodePointsBatchQuery.mockReturnValue({
      data: {
        reverseGeocodePointsBatch: {
          items: [
            {
              latitude: 42.50011,
              longitude: -75.60011,
              display_address: 'Prefetched Ave, Prefetch, NY, USA',
              status: 'success',
            },
          ],
        },
      },
    })

    render(
      <TestHarness
        routePoints={[{ latitude: 42.50011, longitude: -75.60011 }]}
        latitude={42.50011}
        longitude={-75.60011}
      />,
    )

    expect(
      await screen.findByText('Prefetched Ave, Prefetch, NY, USA'),
    ).toBeInTheDocument()
    expect(graphqlMocks.reverseGeocodePoint).not.toHaveBeenCalled()
  })

  it('does not cache a pending batch result, leaving the single-point fallback to resolve it', async () => {
    graphqlMocks.useReverseGeocodePointsBatchQuery.mockReturnValue({
      data: {
        reverseGeocodePointsBatch: {
          items: [
            {
              latitude: 43.50011,
              longitude: -76.60011,
              display_address: null,
              status: 'pending',
            },
          ],
        },
      },
    })
    graphqlMocks.reverseGeocodePoint.mockResolvedValueOnce({
      data: {
        reverseGeocodePoint: {
          latitude: 43.5001,
          longitude: -76.6001,
          display_address: 'Resolved later, NY, USA',
          status: 'success',
          resolution_source: 'database',
        },
      },
    })

    render(
      <TestHarness
        routePoints={[{ latitude: 43.50011, longitude: -76.60011 }]}
        latitude={43.50011}
        longitude={-76.60011}
      />,
    )

    expect(
      await screen.findByText('Resolved later, NY, USA'),
    ).toBeInTheDocument()
    expect(graphqlMocks.reverseGeocodePoint).toHaveBeenCalledOnce()
  })
})

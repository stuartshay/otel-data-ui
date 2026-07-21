import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const graphqlMocks = vi.hoisted(() => ({
  reverseGeocodePoint: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => ({
  useReverseGeocodePointLazyQuery: () => [graphqlMocks.reverseGeocodePoint],
}))

import { SegmentPointAddress } from './SegmentPointAddress'

function geocoderResponse(
  label?: string,
  status = label ? 'success' : 'no_coverage',
) {
  return {
    data: {
      reverseGeocodePoint: {
        latitude: 40.7306,
        longitude: -73.9352,
        display_address: label ?? null,
        status,
        resolution_source: label ? 'database' : 'pelias',
      },
    },
  }
}

describe('SegmentPointAddress', () => {
  beforeEach(() => {
    vi.useRealTimers()
    graphqlMocks.reverseGeocodePoint.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves the start address, follows selection, and restores the cache', async () => {
    graphqlMocks.reverseGeocodePoint
      .mockResolvedValueOnce(geocoderResponse('5th Ave, New York, NY, USA'))
      .mockResolvedValueOnce(
        geocoderResponse('Central Park, New York, NY, USA'),
      )

    const { rerender } = render(
      <SegmentPointAddress
        latitude={40.73061}
        longitude={-73.935242}
        selected={false}
      />,
    )

    expect(screen.getByText('Start point address')).toBeInTheDocument()
    expect(screen.getByText('Resolving…')).toBeInTheDocument()
    expect(
      await screen.findByText('5th Ave, New York, NY, USA'),
    ).toBeInTheDocument()
    expect(graphqlMocks.reverseGeocodePoint).toHaveBeenNthCalledWith(1, {
      variables: { latitude: 40.7306, longitude: -73.9352 },
    })

    rerender(
      <SegmentPointAddress
        latitude={40.771133}
        longitude={-73.974187}
        selected
      />,
    )

    expect(screen.getByText('Selected point address')).toBeInTheDocument()
    expect(
      await screen.findByText('Central Park, New York, NY, USA'),
    ).toBeInTheDocument()
    expect(graphqlMocks.reverseGeocodePoint).toHaveBeenNthCalledWith(2, {
      variables: { latitude: 40.7711, longitude: -73.9742 },
    })

    rerender(
      <SegmentPointAddress
        latitude={40.73061}
        longitude={-73.935242}
        selected={false}
      />,
    )

    expect(screen.getByText('Start point address')).toBeInTheDocument()
    expect(screen.getByText('5th Ave, New York, NY, USA')).toBeInTheDocument()
    expect(graphqlMocks.reverseGeocodePoint).toHaveBeenCalledTimes(2)
  })

  it('handles invalid coordinates, empty results, and geocoder errors', async () => {
    const { rerender } = render(
      <SegmentPointAddress
        latitude={Number.NaN}
        longitude={-73.935242}
        selected={false}
      />,
    )

    expect(screen.getByTestId('segment-point-address-value')).toHaveTextContent(
      '—',
    )
    expect(graphqlMocks.reverseGeocodePoint).not.toHaveBeenCalled()

    graphqlMocks.reverseGeocodePoint.mockResolvedValueOnce(geocoderResponse())
    rerender(
      <SegmentPointAddress
        latitude={40.70011}
        longitude={-73.90011}
        selected={false}
      />,
    )
    expect(await screen.findByText('No address found')).toBeInTheDocument()

    graphqlMocks.reverseGeocodePoint.mockResolvedValueOnce({
      data: undefined,
      error: new Error('offline'),
    })
    rerender(
      <SegmentPointAddress
        latitude={40.70021}
        longitude={-73.90021}
        selected
      />,
    )
    expect(await screen.findByText('Unavailable')).toBeInTheDocument()
  })

  it.each([
    { status: 'error', latitude: 40.6801 },
    { status: 'pending', latitude: 40.6802 },
  ])(
    'shows $status as unavailable without caching it',
    async ({ status, latitude }) => {
      graphqlMocks.reverseGeocodePoint
        .mockResolvedValueOnce(geocoderResponse(undefined, status))
        .mockResolvedValueOnce(
          geocoderResponse('Recovered point, New York, NY, USA'),
        )

      const { rerender } = render(
        <SegmentPointAddress
          latitude={latitude}
          longitude={-73.9501}
          selected
        />,
      )

      expect(await screen.findByText('Unavailable')).toBeInTheDocument()

      rerender(
        <SegmentPointAddress
          latitude={Number.NaN}
          longitude={-73.9501}
          selected={false}
        />,
      )
      rerender(
        <SegmentPointAddress
          latitude={latitude}
          longitude={-73.9501}
          selected
        />,
      )

      expect(
        await screen.findByText('Recovered point, New York, NY, USA'),
      ).toBeInTheDocument()
      expect(graphqlMocks.reverseGeocodePoint).toHaveBeenCalledTimes(2)
    },
  )

  it('debounces rapid coordinate changes and resolves only the latest point', async () => {
    vi.useFakeTimers()
    graphqlMocks.reverseGeocodePoint.mockResolvedValue(
      geocoderResponse('Latest selected point, New York, NY, USA'),
    )

    const { rerender } = render(
      <SegmentPointAddress
        latitude={40.72011}
        longitude={-73.91011}
        selected={false}
      />,
    )
    rerender(
      <SegmentPointAddress
        latitude={40.72021}
        longitude={-73.91021}
        selected
      />,
    )

    await act(async () => vi.advanceTimersByTimeAsync(250))

    expect(graphqlMocks.reverseGeocodePoint).toHaveBeenCalledOnce()
    expect(graphqlMocks.reverseGeocodePoint).toHaveBeenCalledWith({
      variables: { latitude: 40.7202, longitude: -73.9102 },
    })
    expect(
      screen.getByText('Latest selected point, New York, NY, USA'),
    ).toBeInTheDocument()
  })
})

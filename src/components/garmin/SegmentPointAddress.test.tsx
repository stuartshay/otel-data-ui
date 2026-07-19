import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const geocoderMocks = vi.hoisted(() => ({
  reverseGeocode: vi.fn(),
}))

vi.mock('@/services/geocoder', () => geocoderMocks)

import { SegmentPointAddress } from './SegmentPointAddress'

function geocoderResponse(label?: string) {
  return {
    type: 'FeatureCollection',
    features: label ? [{ properties: { label } }] : [],
  }
}

describe('SegmentPointAddress', () => {
  beforeEach(() => {
    vi.useRealTimers()
    geocoderMocks.reverseGeocode.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves the start address, follows selection, and restores the cache', async () => {
    geocoderMocks.reverseGeocode
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
    expect(geocoderMocks.reverseGeocode).toHaveBeenNthCalledWith(
      1,
      40.7306,
      -73.9352,
      1,
    )

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
    expect(geocoderMocks.reverseGeocode).toHaveBeenNthCalledWith(
      2,
      40.7711,
      -73.9742,
      1,
    )

    rerender(
      <SegmentPointAddress
        latitude={40.73061}
        longitude={-73.935242}
        selected={false}
      />,
    )

    expect(screen.getByText('Start point address')).toBeInTheDocument()
    expect(screen.getByText('5th Ave, New York, NY, USA')).toBeInTheDocument()
    expect(geocoderMocks.reverseGeocode).toHaveBeenCalledTimes(2)
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
    expect(geocoderMocks.reverseGeocode).not.toHaveBeenCalled()

    geocoderMocks.reverseGeocode.mockResolvedValueOnce(geocoderResponse())
    rerender(
      <SegmentPointAddress
        latitude={40.70011}
        longitude={-73.90011}
        selected={false}
      />,
    )
    expect(await screen.findByText('No address found')).toBeInTheDocument()

    geocoderMocks.reverseGeocode.mockRejectedValueOnce(new Error('offline'))
    rerender(
      <SegmentPointAddress
        latitude={40.70021}
        longitude={-73.90021}
        selected
      />,
    )
    expect(await screen.findByText('Unavailable')).toBeInTheDocument()
  })

  it('debounces rapid coordinate changes and resolves only the latest point', async () => {
    vi.useFakeTimers()
    geocoderMocks.reverseGeocode.mockResolvedValue(
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

    expect(geocoderMocks.reverseGeocode).toHaveBeenCalledOnce()
    expect(geocoderMocks.reverseGeocode).toHaveBeenCalledWith(
      40.7202,
      -73.9102,
      1,
    )
    expect(
      screen.getByText('Latest selected point, New York, NY, USA'),
    ).toBeInTheDocument()
  })
})

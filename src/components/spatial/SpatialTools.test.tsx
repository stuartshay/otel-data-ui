import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PeliasFeature } from '@/services/geocoder'

const geocoderMocks = vi.hoisted(() => ({
  autocomplete: vi.fn(),
  forwardGeocode: vi.fn(),
  reverseGeocode: vi.fn(),
}))

vi.mock('@/services/geocoder', () => geocoderMocks)

import { Autocomplete } from './Autocomplete'
import { ForwardGeocode } from './ForwardGeocode'
import { ReverseGeocode } from './ReverseGeocode'

function feature(
  overrides: Partial<PeliasFeature['properties']> = {},
): PeliasFeature {
  const gid = overrides.gid ?? 'pelias:venue:1'
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484],
    },
    properties: {
      id: '1',
      gid,
      layer: 'venue',
      source: 'pelias',
      source_id: '1',
      name: 'Empire State Building',
      label: 'Empire State Building, Manhattan, NY, USA',
      confidence: 0.91,
      locality: 'New York',
      neighbourhood: 'Midtown South',
      borough: 'Manhattan',
      region: 'New York',
      postalcode: '10001',
      ...overrides,
    },
  }
}

describe('spatial geocoding tools', () => {
  beforeEach(() => {
    geocoderMocks.autocomplete.mockReset()
    geocoderMocks.forwardGeocode.mockReset()
    geocoderMocks.reverseGeocode.mockReset()
  })

  it('debounces autocomplete, shows results, and displays selected feature details', async () => {
    const user = userEvent.setup()
    geocoderMocks.autocomplete.mockResolvedValue({
      type: 'FeatureCollection',
      features: [feature()],
    })

    render(<Autocomplete />)

    const input = screen.getByPlaceholderText('Start typing a place name...')
    await user.type(input, 'em')

    await waitFor(() =>
      expect(geocoderMocks.autocomplete).toHaveBeenCalledWith('em'),
    )
    expect(await screen.findByText('Empire State Building')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /empire state/i }))

    expect(screen.getByText('Coordinates')).toBeInTheDocument()
    expect(screen.getByText('40.74840, -73.98570')).toBeInTheDocument()
    expect(screen.getByText('Midtown South')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to results/i }))
    expect(
      screen.getByRole('button', { name: /empire state/i }),
    ).toBeInTheDocument()
  })

  it('shows autocomplete errors and clears stale results', async () => {
    const user = userEvent.setup()
    geocoderMocks.autocomplete.mockRejectedValue(
      new Error('pelias unavailable'),
    )

    render(<Autocomplete />)

    await user.type(
      screen.getByPlaceholderText('Start typing a place name...'),
      'bad',
    )

    expect(await screen.findByText('pelias unavailable')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /bad/i }),
    ).not.toBeInTheDocument()
  })

  it('searches forward geocoding from button and enter key, then renders rows', async () => {
    const user = userEvent.setup()
    geocoderMocks.forwardGeocode.mockResolvedValue({
      type: 'FeatureCollection',
      features: [feature({ confidence: 0.87 })],
    })

    render(<ForwardGeocode />)

    const input = screen.getByPlaceholderText(
      'Search for an address or place...',
    )
    await user.type(input, 'Empire State')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(geocoderMocks.forwardGeocode).toHaveBeenCalledWith('Empire State')
    expect(await screen.findByText('87%')).toBeInTheDocument()
    expect(screen.getByText('40.74840, -73.98570')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'Manhattan{Enter}')
    await waitFor(() =>
      expect(geocoderMocks.forwardGeocode).toHaveBeenLastCalledWith(
        'Manhattan',
      ),
    )
  })

  it('shows forward geocode errors', async () => {
    const user = userEvent.setup()
    geocoderMocks.forwardGeocode.mockRejectedValue(new Error('search failed'))

    render(<ForwardGeocode />)

    await user.type(
      screen.getByPlaceholderText('Search for an address or place...'),
      'bad',
    )
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByText('search failed')).toBeInTheDocument()
  })

  it('validates reverse geocode coordinates before calling the service', async () => {
    const user = userEvent.setup()

    render(<ReverseGeocode />)

    const [latInput] = screen.getAllByRole('textbox')
    await user.clear(latInput)
    await user.type(latInput, '91')
    await user.click(screen.getByRole('button', { name: 'Lookup' }))

    expect(
      screen.getByText(
        'Please enter a valid latitude (-90 to 90) and longitude (-180 to 180).',
      ),
    ).toBeInTheDocument()
    expect(geocoderMocks.reverseGeocode).not.toHaveBeenCalled()
  })

  it('runs reverse geocoding and renders confidence details', async () => {
    const user = userEvent.setup()
    geocoderMocks.reverseGeocode.mockResolvedValue({
      type: 'FeatureCollection',
      features: [feature({ confidence: 0.72 })],
    })

    render(<ReverseGeocode />)

    await user.click(screen.getByRole('button', { name: 'Lookup' }))

    expect(geocoderMocks.reverseGeocode).toHaveBeenCalledWith(40.7484, -73.9857)
    expect(
      await screen.findByText('Empire State Building, Manhattan, NY, USA'),
    ).toBeInTheDocument()
    expect(screen.getByText('Confidence: 72%')).toBeInTheDocument()
  })

  it('shows reverse geocode errors', async () => {
    const user = userEvent.setup()
    geocoderMocks.reverseGeocode.mockRejectedValue(new Error('lookup failed'))

    render(<ReverseGeocode />)

    await user.click(screen.getByRole('button', { name: 'Lookup' }))

    expect(await screen.findByText('lookup failed')).toBeInTheDocument()
  })
})

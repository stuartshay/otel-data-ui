import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const spatialHooks = vi.hoisted(() => ({
  useNearbyPointsQuery: vi.fn(),
  useCalculateDistanceQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => spatialHooks)

import { SpatialPage } from './SpatialPage'

describe('SpatialPage', () => {
  beforeEach(() => {
    spatialHooks.useNearbyPointsQuery.mockReset()
    spatialHooks.useCalculateDistanceQuery.mockReset()

    spatialHooks.useNearbyPointsQuery.mockImplementation(
      ({
        variables,
        skip,
      }: {
        variables: {
          lat: number
          lon: number
          radius_meters: number
          limit: number
        }
        skip: boolean
      }) => ({
        data: skip
          ? undefined
          : {
              nearbyPoints: [
                {
                  source: 'owntracks',
                  id: 1,
                  distance_meters: variables.radius_meters - 10,
                  timestamp: '2026-03-14T09:00:00Z',
                },
              ],
            },
        loading: false,
      }),
    )

    spatialHooks.useCalculateDistanceQuery.mockImplementation(
      ({
        variables,
        skip,
      }: {
        variables: {
          from_lat: number
          from_lon: number
          to_lat: number
          to_lon: number
        }
        skip: boolean
      }) => ({
        data: skip
          ? undefined
          : {
              calculateDistance: {
                distance_meters:
                  Math.abs(variables.to_lat - variables.from_lat) * 100000,
              },
            },
        loading: false,
      }),
    )
  })

  it('starts with both GraphQL tools skipped', () => {
    render(<SpatialPage />)

    expect(spatialHooks.useNearbyPointsQuery).toHaveBeenLastCalledWith({
      variables: {
        lat: 40.736097,
        lon: -74.039373,
        radius_meters: 500,
        limit: 20,
      },
      skip: true,
    })
    expect(spatialHooks.useCalculateDistanceQuery).toHaveBeenLastCalledWith({
      variables: {
        from_lat: 40.736097,
        from_lon: -74.039373,
        to_lat: 40.7484,
        to_lon: -73.9856,
      },
      skip: true,
    })
  })

  it('runs nearby search with updated inputs and renders results', async () => {
    const user = userEvent.setup()
    render(<SpatialPage />)

    const inputs = screen.getAllByRole('textbox')
    await user.clear(inputs[2])
    await user.type(inputs[2], '750')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => expect(screen.getByText('740.0m')).toBeInTheDocument())
    expect(spatialHooks.useNearbyPointsQuery).toHaveBeenLastCalledWith({
      variables: {
        lat: 40.736097,
        lon: -74.039373,
        radius_meters: 750,
        limit: 20,
      },
      skip: false,
    })
  })

  it('runs distance calculations and renders the formatted result', async () => {
    const user = userEvent.setup()
    render(<SpatialPage />)

    const inputs = screen.getAllByRole('textbox')
    await user.clear(inputs[3])
    await user.type(inputs[3], '40.7000')
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    await waitFor(() =>
      expect(screen.getByText('4.840 km')).toBeInTheDocument(),
    )
    expect(spatialHooks.useCalculateDistanceQuery).toHaveBeenLastCalledWith({
      variables: {
        from_lat: 40.7,
        from_lon: -74.039373,
        to_lat: 40.7484,
        to_lon: -73.9856,
      },
      skip: false,
    })
  })

  it('uses updated coordinates for both spatial queries', async () => {
    const user = userEvent.setup()
    render(<SpatialPage />)

    const inputs = screen.getAllByRole('textbox')
    const updates = [
      [0, '41.1'],
      [1, '-72.2'],
      [4, '-71.4'],
      [5, '42.5'],
      [6, '-70.6'],
    ] as const
    for (const [index, value] of updates) {
      await user.clear(inputs[index])
      await user.type(inputs[index], value)
    }

    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.click(screen.getByRole('button', { name: 'Calculate' }))

    await waitFor(() => {
      expect(spatialHooks.useNearbyPointsQuery).toHaveBeenLastCalledWith({
        variables: {
          lat: 41.1,
          lon: -72.2,
          radius_meters: 500,
          limit: 20,
        },
        skip: false,
      })
      expect(spatialHooks.useCalculateDistanceQuery).toHaveBeenLastCalledWith({
        variables: {
          from_lat: 40.736097,
          from_lon: -71.4,
          to_lat: 42.5,
          to_lon: -70.6,
        },
        skip: false,
      })
    })
  })

  it('disables both actions while their queries are loading', () => {
    spatialHooks.useNearbyPointsQuery.mockReturnValue({
      data: undefined,
      loading: true,
    })
    spatialHooks.useCalculateDistanceQuery.mockReturnValue({
      data: undefined,
      loading: true,
    })

    render(<SpatialPage />)

    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Calculating...' }),
    ).toBeDisabled()
  })
})

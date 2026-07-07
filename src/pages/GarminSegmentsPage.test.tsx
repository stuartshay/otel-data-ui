import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '@/test/renderWithRouter'
import { GarminSegmentsPage } from './GarminSegmentsPage'

const segmentHooks = vi.hoisted(() => ({
  useGarminSegmentsQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => segmentHooks)
vi.mock('@/lib/newrelic-browser', () => ({ setNRCustomAttribute: vi.fn() }))

describe('GarminSegmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a card per saved segment', () => {
    segmentHooks.useGarminSegmentsQuery.mockReturnValue({
      data: {
        garminSegments: [
          {
            id: 1,
            name: 'Harlem Hill',
            sport: 'cycling',
            start_latitude: 40.79,
            start_longitude: -73.96,
            end_latitude: 40.79,
            end_longitude: -73.96,
            distance_meters: 508.1,
            match_tolerance_meters: 35,
            source_activity_id: '23493313338',
            source_lap_index: null,
            source_climb_index: 0,
            created_at: '2026-07-07T05:00:11Z',
            updated_at: '2026-07-07T05:00:11Z',
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderWithRouter(<GarminSegmentsPage />)

    expect(screen.getByText('Saved Segments')).toBeVisible()
    expect(screen.getByText('Harlem Hill')).toBeVisible()
    expect(screen.getByText('35 m')).toBeVisible()
    expect(screen.getByTestId('segment-card')).toHaveAttribute(
      'href',
      '/garmin/segments/1',
    )
  })

  it('renders the empty state when there are no segments', () => {
    segmentHooks.useGarminSegmentsQuery.mockReturnValue({
      data: { garminSegments: [] },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderWithRouter(<GarminSegmentsPage />)

    expect(screen.getByText('No saved segments')).toBeVisible()
  })

  it('renders the loading state', () => {
    segmentHooks.useGarminSegmentsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderWithRouter(<GarminSegmentsPage />)

    expect(screen.getByText('Loading segments...')).toBeVisible()
  })
})

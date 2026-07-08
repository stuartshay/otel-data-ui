import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/renderWithRouter'
import { GarminSegmentDetailPage } from './GarminSegmentDetailPage'

const segmentHooks = vi.hoisted(() => ({
  useGarminSegmentQuery: vi.fn(),
  useGarminSegmentEffortsQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => segmentHooks)
vi.mock('@/lib/newrelic-browser', () => ({ setNRCustomAttribute: vi.fn() }))
vi.mock('@/components/garmin/SegmentStartEndMap', () => ({
  SegmentStartEndMap: () => <div data-testid="segment-map">map</div>,
}))
vi.mock('@/components/garmin/DeleteSegmentButton', () => ({
  DeleteSegmentButton: () => (
    <div data-testid="delete-segment-trigger">delete</div>
  ),
}))

const segment = {
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
}

function renderDetail() {
  return renderWithRouter(
    <Routes>
      <Route
        path="garmin/segments/:segmentId"
        element={<GarminSegmentDetailPage />}
      />
    </Routes>,
    { entries: ['/garmin/segments/1'] },
  )
}

describe('GarminSegmentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders segment metadata, map, and leaderboard with a PR badge', () => {
    segmentHooks.useGarminSegmentQuery.mockReturnValue({
      data: { garminSegment: segment },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    segmentHooks.useGarminSegmentEffortsQuery.mockReturnValue({
      data: {
        garminSegmentEfforts: {
          segment: {
            start_lat: 40.79,
            start_lon: -73.96,
            end_lat: 40.79,
            end_lon: -73.96,
            tolerance_meters: 35,
          },
          items: [
            {
              rank: 1,
              activity_id: 'fast',
              sport: 'cycling',
              activity_start_time: '2025-07-04T12:00:00Z',
              effort_start: '2025-07-04T12:00:00Z',
              effort_end: '2025-07-04T12:01:19Z',
              elapsed_seconds: 79,
              distance_km: 0.51,
              avg_speed_kmh: 20,
              avg_heart_rate: 150,
              max_heart_rate: 165,
            },
            {
              rank: 2,
              activity_id: 'slow',
              sport: 'cycling',
              activity_start_time: '2010-06-29T10:00:00Z',
              effort_start: '2010-06-29T10:00:00Z',
              effort_end: '2010-06-29T10:01:22Z',
              elapsed_seconds: 82,
              distance_km: 0.51,
              avg_speed_kmh: 19,
              avg_heart_rate: 140,
              max_heart_rate: 158,
            },
          ],
          total: 2,
        },
      },
      loading: false,
      error: undefined,
    })

    renderDetail()

    expect(screen.getByRole('heading', { name: 'Harlem Hill' })).toBeVisible()
    expect(screen.getByText('2 matching efforts')).toBeVisible()
    expect(screen.getByTestId('segment-map')).toBeVisible()
    expect(screen.getAllByTestId('segment-effort-row')).toHaveLength(2)
    // Exactly one PR badge, on the fastest effort.
    expect(screen.getAllByTestId('segment-effort-pr')).toHaveLength(1)
    expect(screen.getByText('1:19')).toBeVisible()
  })

  it('renders a not-found state when the segment is missing', () => {
    segmentHooks.useGarminSegmentQuery.mockReturnValue({
      data: { garminSegment: null },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    segmentHooks.useGarminSegmentEffortsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })

    renderDetail()

    expect(screen.getByText('Segment not found')).toBeVisible()
  })
})

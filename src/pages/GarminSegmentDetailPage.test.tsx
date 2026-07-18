import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/renderWithRouter'
import { GarminSegmentDetailPage } from './GarminSegmentDetailPage'

const segmentHooks = vi.hoisted(() => ({
  useGarminSegmentQuery: vi.fn(),
  useGarminSegmentEffortsQuery: vi.fn(),
  useGarminChartDataQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => segmentHooks)
vi.mock('@/lib/newrelic-browser', () => ({ setNRCustomAttribute: vi.fn() }))
vi.mock('@/components/garmin/SegmentStartEndMap', () => ({
  SegmentStartEndMap: ({
    routePoints = [],
    activeLatLng,
  }: {
    routePoints?: unknown[]
    activeLatLng?: { lat: number; lng: number } | null
  }) => (
    <div data-testid="segment-map">
      map points: {routePoints.length}; marker:{' '}
      {activeLatLng ? `${activeLatLng.lat}, ${activeLatLng.lng}` : 'none'}
    </div>
  ),
}))
vi.mock('@/components/garmin/SegmentElevationProfile', () => ({
  SegmentElevationProfile: ({
    routePoints = [],
    onActivePointChange,
  }: {
    routePoints?: unknown[]
    onActivePointChange?: (
      point: { latitude: number | null; longitude: number | null } | null,
    ) => void
  }) => (
    <div data-testid="segment-elevation-profile">
      elevation points: {routePoints.length}
      <button
        onClick={() =>
          onActivePointChange?.({ latitude: 40.795, longitude: -73.965 })
        }
      >
        Hover valid elevation point
      </button>
      <button
        onClick={() =>
          onActivePointChange?.({ latitude: null, longitude: -73.965 })
        }
      >
        Hover invalid elevation point
      </button>
      <button onClick={() => onActivePointChange?.(null)}>
        Leave elevation profile
      </button>
    </div>
  ),
}))
vi.mock('@/components/garmin/DeleteSegmentButton', () => ({
  DeleteSegmentButton: ({ onDeleted }: { onDeleted: () => void }) => (
    <button data-testid="delete-segment-trigger" onClick={onDeleted}>
      delete
    </button>
  ),
}))

const segment = {
  id: 1,
  name: 'Harlem Hill',
  sport: 'cycling',
  start_latitude: 40.79,
  start_longitude: -73.96,
  end_latitude: 40.8,
  end_longitude: -73.97,
  distance_meters: 508.1,
  match_tolerance_meters: 35,
  source_activity_id: '23493313338',
  source_lap_index: null,
  source_climb_index: 0,
  created_at: '2026-07-07T05:00:11Z',
  updated_at: '2026-07-07T05:00:11Z',
}

function renderDetail(entry = '/garmin/segments/1') {
  return renderWithRouter(
    <>
      <Link to="/garmin/segments/2">Switch test segment</Link>
      <Routes>
        <Route
          path="garmin/segments/:segmentId"
          element={<GarminSegmentDetailPage />}
        />
        <Route path="garmin/segments" element={<div>segment list</div>} />
      </Routes>
    </>,
    { entries: [entry] },
  )
}

describe('GarminSegmentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    segmentHooks.useGarminChartDataQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })
    segmentHooks.useGarminSegmentQuery.mockReturnValue({
      data: { garminSegment: segment },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    segmentHooks.useGarminSegmentEffortsQuery.mockReturnValue({
      data: { garminSegmentEfforts: { items: [], total: 0 } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
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
            end_lat: 40.8,
            end_lon: -73.97,
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
    segmentHooks.useGarminChartDataQuery.mockReturnValue({
      data: {
        garminChartData: [
          {
            latitude: 40.78,
            longitude: -73.95,
            timestamp: '2025-07-04T11:59:00Z',
            distance_from_start_km: 0,
            altitude: 4,
          },
          {
            latitude: 40.79,
            longitude: -73.96,
            timestamp: '2025-07-04T12:00:00Z',
            distance_from_start_km: 0.1,
            altitude: 5,
          },
          {
            latitude: 40.795,
            longitude: -73.965,
            timestamp: '2025-07-04T12:00:30Z',
            distance_from_start_km: 0.35,
            altitude: 10,
          },
          {
            latitude: 40.8,
            longitude: -73.97,
            timestamp: '2025-07-04T12:01:00Z',
            distance_from_start_km: 0.6,
            altitude: 8,
          },
        ],
      },
      loading: false,
      error: undefined,
    })

    renderDetail()

    expect(screen.getByRole('heading', { name: 'Harlem Hill' })).toBeVisible()
    expect(screen.getByText('2 matching efforts')).toBeVisible()
    expect(screen.getByTestId('segment-map')).toHaveTextContent('map points: 3')
    expect(screen.getByTestId('segment-elevation-profile')).toHaveTextContent(
      'elevation points: 3',
    )
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

  it('synchronizes valid elevation hover coordinates with the map', async () => {
    const user = userEvent.setup()
    renderDetail()

    expect(screen.getByTestId('segment-map')).toHaveTextContent('marker: none')

    await user.click(
      screen.getByRole('button', { name: 'Hover valid elevation point' }),
    )
    expect(screen.getByTestId('segment-map')).toHaveTextContent(
      'marker: 40.795, -73.965',
    )

    await user.click(
      screen.getByRole('button', { name: 'Hover invalid elevation point' }),
    )
    expect(screen.getByTestId('segment-map')).toHaveTextContent('marker: none')

    await user.click(
      screen.getByRole('button', { name: 'Hover valid elevation point' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Leave elevation profile' }),
    )
    expect(screen.getByTestId('segment-map')).toHaveTextContent('marker: none')

    await user.click(
      screen.getByRole('button', { name: 'Hover valid elevation point' }),
    )
    await user.click(screen.getByRole('link', { name: 'Switch test segment' }))
    expect(screen.getByTestId('segment-map')).toHaveTextContent('marker: none')
  })

  it('rejects an invalid segment id without running the queries', () => {
    renderDetail('/garmin/segments/invalid')

    expect(screen.getByText('Invalid segment id.')).toBeVisible()
    expect(segmentHooks.useGarminSegmentQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ id: Number.NaN }),
        skip: true,
      }),
    )
    expect(segmentHooks.useGarminSegmentEffortsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ id: Number.NaN, limit: 500 }),
        skip: true,
      }),
    )
  })

  it('renders the segment loading state', () => {
    segmentHooks.useGarminSegmentQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('Loading segment...')).toBeVisible()
  })

  it('retries after a segment query error', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    segmentHooks.useGarminSegmentQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'segment failed' },
      refetch,
    })

    renderDetail()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('segment failed')).toBeVisible()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders the efforts loading state', () => {
    segmentHooks.useGarminSegmentEffortsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('Loading efforts...')).toBeVisible()
  })

  it('retries after an efforts query error', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    segmentHooks.useGarminSegmentEffortsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'efforts failed' },
      refetch,
    })

    renderDetail()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('efforts failed')).toBeVisible()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders optional metadata fallbacks and navigates after deletion', async () => {
    const user = userEvent.setup()
    segmentHooks.useGarminSegmentQuery.mockReturnValue({
      data: {
        garminSegment: {
          ...segment,
          sport: null,
          distance_meters: null,
          source_activity_id: null,
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    segmentHooks.useGarminSegmentEffortsQuery.mockReturnValue({
      data: { garminSegmentEfforts: { items: [], total: 1 } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('1 matching effort')).toBeVisible()
    expect(screen.getByText('No efforts yet')).toBeVisible()
    expect(screen.queryByText('cycling')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
    expect(screen.getByText('Distance').nextElementSibling).toHaveTextContent(
      '—',
    )
    expect(segmentHooks.useGarminChartDataQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    )

    await user.click(screen.getByTestId('delete-segment-trigger'))
    expect(screen.getByText('segment list')).toBeVisible()
  })
})

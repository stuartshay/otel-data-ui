import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/renderWithRouter'

const garminDetailHooks = vi.hoisted(() => ({
  useGarminActivityQuery: vi.fn(),
  useGarminTrackPointsQuery: vi.fn(),
  useGarminChartDataQuery: vi.fn(),
  useGarminExportPointsLazyQuery: vi.fn(),
}))
const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => garminDetailHooks)
vi.mock('sonner', () => ({ toast: toastMocks }))
vi.mock('@/services/geocoder', () => ({
  reverseGeocode: vi.fn().mockResolvedValue({ features: [] }),
}))

vi.mock('@/components/garmin/ActivityHeader', () => ({
  ActivityHeader: ({ backTo, sport }: { backTo: string; sport: string }) => (
    <div data-testid="activity-header">
      {sport}:{backTo}
    </div>
  ),
}))

vi.mock('@/components/garmin/ActivityStatsBar', () => ({
  ActivityStatsBar: () => <div data-testid="activity-stats-bar">stats-bar</div>,
}))

vi.mock('@/components/garmin/ActivityRouteMap', () => ({
  ActivityRouteMap: ({
    activeLatLng,
    savedPoints,
    onSavedPointRemove,
    onMapPointSelect,
  }: {
    activeLatLng?: { lat: number; lng: number } | null
    savedPoints?: Array<{ id: string; lat: number; lng: number; color: string }>
    onSavedPointRemove?: (id: string) => void
    onMapPointSelect?: (latLng: { lat: number; lng: number }) => void
  }) => (
    <div>
      <button
        data-testid="activity-route-map"
        type="button"
        onClick={() => onMapPointSelect?.({ lat: 40.702, lng: -74.002 })}
      >
        route-map
        {activeLatLng ? ` active:${activeLatLng.lat},${activeLatLng.lng}` : ''}
        {savedPoints && savedPoints.length > 0
          ? ` saved:${savedPoints.map((p) => `${p.lat},${p.lng}`).join('|')}`
          : ''}
      </button>
      {(savedPoints ?? []).map((p) => (
        <button
          key={p.id}
          type="button"
          data-testid={`map-saved-marker-${p.id}`}
          onClick={() => onSavedPointRemove?.(p.id)}
        >
          marker:{p.color}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/components/garmin/ActivityCharts', () => ({
  ActivityCharts: ({
    activePoint,
    savedPoints,
    onPointToggle,
  }: {
    activePoint?: { timestamp: string; latitude?: number; longitude?: number }
    savedPoints?: Array<{ id: string; color: string }>
    onPointToggle?: (point: {
      timestamp: string
      time: number
      distance?: number | null
      latitude?: number
      longitude?: number
    }) => void
  }) => (
    <button
      data-testid="activity-charts"
      type="button"
      onDoubleClick={() =>
        onPointToggle?.({
          timestamp: '2026-03-14T09:10:00Z',
          time: 10,
          distance: 1,
          latitude: 40.704,
          longitude: -74.004,
        })
      }
    >
      {activePoint ? activePoint.timestamp : 'charts'}
      {savedPoints && savedPoints.length > 0
        ? ` charts-saved:${savedPoints.length}`
        : ''}
    </button>
  ),
}))

vi.mock('@/components/garmin/ActivityStatsPanel', () => ({
  ActivityStatsPanel: () => (
    <div data-testid="activity-stats-panel">stats-panel</div>
  ),
}))

import { GarminDetailPage } from './GarminDetailPage'

describe('GarminDetailPage', () => {
  beforeEach(() => {
    garminDetailHooks.useGarminActivityQuery.mockReset()
    garminDetailHooks.useGarminTrackPointsQuery.mockReset()
    garminDetailHooks.useGarminChartDataQuery.mockReset()
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReset()
    toastMocks.error.mockReset()
    toastMocks.warning.mockReset()

    // Default no-op export hook so tests that don't exercise export don't crash.
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      vi.fn(),
      { loading: false },
    ])
  })

  function renderPage(
    entry:
      | string
      | {
          pathname: string
          search?: string
          state?: unknown
        } = '/garmin/42',
  ) {
    return renderWithRouter(
      <Routes>
        <Route path="/garmin/:activityId" element={<GarminDetailPage />} />
      </Routes>,
      { entries: [entry] },
    )
  }

  it('shows the loading state while the activity query is pending', () => {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: true,
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: undefined,
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: undefined,
    })

    renderPage()

    expect(screen.getByText('Loading activity...')).toBeInTheDocument()
  })

  it('shows an error state and retries the activity query', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: new Error('activity failed'),
      refetch,
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: undefined,
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: undefined,
    })

    renderPage()

    expect(screen.getByText('activity failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the activity detail sections and preserves the back link state', async () => {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          sport: 'running',
          sub_sport: 'trail',
          start_time: '2026-03-14T09:00:00Z',
          device_manufacturer: 'Garmin',
          distance_km: 21.1,
          duration_seconds: 7200,
          avg_speed_kmh: 10.5,
          total_ascent_m: 420,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: {
        garminTrackPoints: {
          items: [{ latitude: 40.7, longitude: -74.0 }],
        },
      },
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: new Error('chart fetch failed'),
      data: {
        garminChartData: [{ distance_meters: 1000 }],
      },
    })

    renderPage({
      pathname: '/garmin/42',
      state: { garminListSearch: 'page=2&sport=running' },
    })

    expect(screen.getByTestId('activity-header')).toHaveTextContent(
      'running:/garmin?page=2&sport=running',
    )
    expect(screen.getByTestId('activity-stats-bar')).toBeInTheDocument()
    expect(screen.getByTestId('garmin-detail-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('activity-route-map')).toBeInTheDocument()
    expect(screen.getByTestId('activity-charts')).toBeInTheDocument()
    expect(
      screen.getByText('Chart data failed: chart fetch failed'),
    ).toBeInTheDocument()
  })

  it('selects the nearest chart point when the route map is clicked', async () => {
    const user = userEvent.setup()
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          sport: 'running',
          sub_sport: 'road',
          start_time: '2026-03-14T09:00:00Z',
          device_manufacturer: 'Garmin',
          distance_km: 5,
          duration_seconds: 1800,
          avg_speed_kmh: 10,
          total_ascent_m: 40,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: {
        garminTrackPoints: {
          items: [
            { latitude: 40.7, longitude: -74.0 },
            { latitude: 40.702, longitude: -74.002 },
          ],
        },
      },
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: {
        garminChartData: [
          {
            timestamp: '2026-03-14T09:00:00Z',
            latitude: 40.7,
            longitude: -74.0,
            altitude: 10,
            speed_kmh: 8,
            distance_from_start_km: 0,
          },
          {
            timestamp: '2026-03-14T09:05:00Z',
            latitude: 40.702,
            longitude: -74.002,
            altitude: 20,
            speed_kmh: 10,
            distance_from_start_km: 1,
          },
        ],
      },
    })

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.click(screen.getByTestId('activity-route-map'))

    expect(screen.getByTestId('activity-charts')).toHaveTextContent(
      '2026-03-14T09:05:00Z',
    )
    expect(screen.getByTestId('activity-hover-details')).toHaveTextContent(
      '40.70200, -74.00200',
    )
    expect(screen.getByTestId('activity-route-map')).toHaveTextContent(
      'active:40.702,-74.002',
    )
    // The clicked point is saved and gets a persistent map marker + list row.
    expect(screen.getByTestId('activity-route-map')).toHaveTextContent(
      'saved:40.702,-74.002',
    )
    expect(screen.getByTestId('saved-points-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('saved-point-row')).toHaveLength(1)
  })

  it('saves a chart point on the route map when the chart is double-clicked', async () => {
    const user = userEvent.setup()
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          sport: 'running',
          sub_sport: 'road',
          start_time: '2026-03-14T09:00:00Z',
          device_manufacturer: 'Garmin',
          distance_km: 5,
          duration_seconds: 1800,
          avg_speed_kmh: 10,
          total_ascent_m: 40,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: {
        garminTrackPoints: {
          items: [{ latitude: 40.704, longitude: -74.004 }],
        },
      },
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: {
        garminChartData: [
          {
            timestamp: '2026-03-14T09:10:00Z',
            latitude: 40.704,
            longitude: -74.004,
            altitude: 20,
            speed_kmh: 10,
            distance_from_start_km: 1,
          },
        ],
      },
    })

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.dblClick(screen.getByTestId('activity-charts'))

    // Double-click saves the point: it appears as a map marker and a list row.
    expect(screen.getByTestId('activity-route-map')).toHaveTextContent(
      'saved:40.704,-74.004',
    )
    expect(screen.getByTestId('saved-points-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('saved-point-row')).toHaveLength(1)

    // Double-clicking the same point again toggles it off.
    await user.dblClick(screen.getByTestId('activity-charts'))
    expect(screen.queryByTestId('saved-points-list')).not.toBeInTheDocument()
  })

  it('removes a saved point via the list remove control and clear all', async () => {
    const user = userEvent.setup()
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          sport: 'running',
          sub_sport: 'road',
          start_time: '2026-03-14T09:00:00Z',
          device_manufacturer: 'Garmin',
          distance_km: 5,
          duration_seconds: 1800,
          avg_speed_kmh: 10,
          total_ascent_m: 40,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: {
        garminTrackPoints: {
          items: [{ latitude: 40.704, longitude: -74.004 }],
        },
      },
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: {
        garminChartData: [
          {
            timestamp: '2026-03-14T09:10:00Z',
            latitude: 40.704,
            longitude: -74.004,
            altitude: 20,
            speed_kmh: 10,
            distance_from_start_km: 1,
          },
        ],
      },
    })

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.dblClick(screen.getByTestId('activity-charts'))
    expect(screen.getAllByTestId('saved-point-row')).toHaveLength(1)

    await user.click(screen.getByTestId('saved-point-remove'))
    expect(screen.queryByTestId('saved-points-list')).not.toBeInTheDocument()

    // Save again, then clear all.
    await user.dblClick(screen.getByTestId('activity-charts'))
    await user.click(screen.getByTestId('saved-points-clear'))
    expect(screen.queryByTestId('saved-points-list')).not.toBeInTheDocument()
  })

  it('resolves map clicks against full-resolution points, not the downsampled chart series', async () => {
    const user = userEvent.setup()
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          sport: 'running',
          sub_sport: 'road',
          start_time: '2026-03-14T09:00:00Z',
          device_manufacturer: 'Garmin',
          distance_km: 5,
          duration_seconds: 1800,
          avg_speed_kmh: 10,
          total_ascent_m: 40,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: {
        garminTrackPoints: {
          items: [{ latitude: 40.702, longitude: -74.002 }],
        },
      },
    })

    // 1000 points exceeds the 800-point downsample target. Index 4 is dropped
    // by downsampling (no integer i satisfies floor(i * 1.25) === 4), so it
    // only exists in the full-resolution series. Placing the click target there
    // proves the lookup searches raw data rather than the downsampled charts.
    const TARGET_INDEX = 4
    const garminChartData = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: new Date(Date.UTC(2026, 2, 14, 9, 0, i)).toISOString(),
      latitude: i === TARGET_INDEX ? 40.702 : 10,
      longitude: i === TARGET_INDEX ? -74.002 : 10,
      altitude: 10 + i,
      speed_kmh: 8,
      distance_from_start_km: i * 0.01,
    }))
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { garminChartData },
    })

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.click(screen.getByTestId('activity-route-map'))

    expect(screen.getByTestId('activity-charts')).toHaveTextContent(
      garminChartData[TARGET_INDEX].timestamp,
    )
    expect(screen.getByTestId('activity-hover-details')).toHaveTextContent(
      '40.70200, -74.00200',
    )
  })

  it('shows not found when the activity query returns no activity', () => {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: null,
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: undefined,
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: undefined,
    })

    renderPage()

    expect(screen.getByText('Activity not found')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Export helpers
  // ---------------------------------------------------------------------------

  function mockLoadedActivity() {
    garminDetailHooks.useGarminActivityQuery.mockReturnValue({
      loading: false,
      error: undefined,
      refetch: vi.fn(),
      data: {
        garminActivity: {
          activity_id: '42',
          sport: 'cycling',
          sub_sport: 'road',
          start_time: '2026-03-14T09:00:00Z',
          end_time: '2026-03-14T10:55:32Z',
          device_manufacturer: 'Garmin',
          distance_km: 50.6,
          duration_seconds: 6932,
          avg_heart_rate: 145,
          max_heart_rate: 176,
          hr_available: true,
          min_heart_rate: 101,
          avg_respiration_rate: 24,
          min_respiration_rate: 18,
          max_respiration_rate: 31,
          avg_speed_kmh: 26.3,
          max_speed_kmh: 44.2,
          total_ascent_m: 385,
          total_descent_m: 380,
          avg_cadence: 81,
          max_cadence: 108,
          calories: 1689,
          avg_temperature_c: 18,
          min_temperature_c: 14,
          max_temperature_c: 22,
          total_elapsed_time: 7200.5,
          total_timer_time: 6932.1,
          paved_distance_km: 47.1,
          unpaved_distance_km: 3.5,
          track_point_count: 1,
        },
      },
    })
    garminDetailHooks.useGarminTrackPointsQuery.mockReturnValue({
      loading: false,
      data: { garminTrackPoints: { items: [] } },
    })
    garminDetailHooks.useGarminChartDataQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { garminChartData: [] },
    })
  }

  function mockExportPoints() {
    return [
      {
        id: 1,
        activity_id: '42',
        timestamp: '2026-03-14T09:00:00Z',
        latitude: 40.715,
        longitude: -74.017,
        altitude: 12.4,
        distance_from_start_km: 0.0,
        speed_kmh: 24.5,
        heart_rate: 135,
        cadence: 80,
        temperature_c: 18,
        address: {
          display_address: 'Pier 13, Hoboken, NJ',
          street: 'Sinatra Drive',
          housenumber: '1301',
          neighbourhood: 'Waterfront',
          locality: 'Hoboken',
          region: 'New Jersey',
          country: 'United States',
          postalcode: '07030',
          confidence: 0.92,
          waypoint_kind: 'start',
          status: 'success',
          geocoded_at: '2026-02-12T08:10:55Z',
        },
      },
    ]
  }

  it('clicking Export CSV calls the lazy query and triggers a CSV download', async () => {
    const user = userEvent.setup()
    mockLoadedActivity()

    const fetchExport = vi.fn().mockResolvedValue({
      data: {
        garminTrackPoints: { total: 1, items: mockExportPoints() },
      },
    })
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      fetchExport,
      { loading: false },
    ])

    let exportedBlob: Blob | undefined
    const createObjectURL = vi.fn((blob: Blob) => {
      exportedBlob = blob
      return 'blob:test'
    })
    const revokeObjectURL = vi.fn()
    const clickSpy = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy)

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.click(screen.getByRole('button', { name: /Export CSV/i }))

    expect(fetchExport).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ activity_id: '42' }),
      }),
    )
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    const csvText = exportedBlob ? await exportedBlob.text() : ''
    expect(csvText).toContain('heart_rate,cadence,temperature_c')
    expect(csvText).toContain('135,80,18')

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('clicking Export GeoJSON calls the lazy query and triggers a GeoJSON download', async () => {
    const user = userEvent.setup()
    mockLoadedActivity()

    const fetchExport = vi.fn().mockResolvedValue({
      data: {
        garminTrackPoints: { total: 1, items: mockExportPoints() },
      },
    })
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      fetchExport,
      { loading: false },
    ])

    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    const clickSpy = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy)

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.click(screen.getByRole('button', { name: /Export GeoJSON/i }))

    expect(fetchExport).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ activity_id: '42' }),
      }),
    )
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('clicking Export GeoJSON downloads an empty FeatureCollection when no points are returned', async () => {
    const user = userEvent.setup()
    mockLoadedActivity()

    const fetchExport = vi.fn().mockResolvedValue({
      data: {
        garminTrackPoints: { total: 0, items: [] },
      },
    })
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      fetchExport,
      { loading: false },
    ])

    let exportedBlob: Blob | undefined
    const createObjectURL = vi.fn((blob: Blob) => {
      exportedBlob = blob
      return 'blob:test'
    })
    const revokeObjectURL = vi.fn()
    const clickSpy = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy)

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.click(screen.getByRole('button', { name: /Export GeoJSON/i }))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    if (!exportedBlob) throw new Error('Expected export blob to be created')
    expect(exportedBlob).toBeInstanceOf(Blob)
    await expect(exportedBlob.text()).resolves.toBe(
      JSON.stringify({ type: 'FeatureCollection', features: [] }, null, 2),
    )
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(toastMocks.warning).toHaveBeenCalledWith(
      'No track points found for this activity',
      expect.any(Object),
    )

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows an error toast when the export query fails', async () => {
    const user = userEvent.setup()
    mockLoadedActivity()

    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      vi.fn().mockRejectedValue(new Error('gateway unavailable')),
      { loading: false },
    ])

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    await user.click(screen.getByRole('button', { name: /Export GeoJSON/i }))

    await vi.waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Export GEOJSON failed', {
        description: 'gateway unavailable',
      })
    })
  })

  it('ignores a second export click before React applies disabled state', async () => {
    const user = userEvent.setup()
    mockLoadedActivity()

    const fetchExport = vi.fn().mockReturnValue(new Promise(() => {}))
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      fetchExport,
      { loading: false },
    ])

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    fireEvent.click(screen.getByTestId('export-csv-button'))
    fireEvent.click(screen.getByTestId('export-geojson-button'))

    expect(fetchExport).toHaveBeenCalledTimes(1)
    expect(fetchExport).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ activity_id: '42' }),
      }),
    )
  })

  it('only activates the clicked export button — the other stays idle but disabled', async () => {
    const user = userEvent.setup()
    mockLoadedActivity()

    // Build a manually-resolved promise so we can observe the in-flight
    // loading window between click and resolution.
    let resolveFetch: (value: unknown) => void = () => {}
    const pending = new Promise((resolve) => {
      resolveFetch = resolve
    })
    const fetchExport = vi.fn().mockReturnValue(pending)
    garminDetailHooks.useGarminExportPointsLazyQuery.mockReturnValue([
      fetchExport,
      { loading: false },
    ])

    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderPage()
    await user.click(screen.getByTestId('garmin-tab-charts'))

    const csvButton = screen.getByTestId('export-csv-button')
    const geojsonButton = screen.getByTestId('export-geojson-button')

    // Before click — both buttons enabled, no spinners.
    expect(csvButton).not.toBeDisabled()
    expect(geojsonButton).not.toBeDisabled()
    expect(screen.queryByTestId('export-csv-spinner')).toBeNull()
    expect(screen.queryByTestId('export-geojson-spinner')).toBeNull()

    await user.click(csvButton)

    // Mid-flight — CSV button shows a spinner, both are disabled,
    // and the GeoJSON button must NOT show a spinner.
    expect(screen.getByTestId('export-csv-spinner')).toBeInTheDocument()
    expect(screen.queryByTestId('export-geojson-spinner')).toBeNull()
    expect(csvButton).toBeDisabled()
    expect(geojsonButton).toBeDisabled()

    // Resolve the in-flight export and wait for state to settle.
    resolveFetch({
      data: { garminTrackPoints: { total: 1, items: mockExportPoints() } },
    })

    await vi.waitFor(() => {
      expect(screen.queryByTestId('export-csv-spinner')).toBeNull()
    })
    expect(screen.queryByTestId('export-geojson-spinner')).toBeNull()
    expect(csvButton).not.toBeDisabled()
    expect(geojsonButton).not.toBeDisabled()

    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
})

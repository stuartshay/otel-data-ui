import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { GarminActivityClimbsQuery } from '@/__generated__/graphql'
import { ClimbDetailsPanel } from './ClimbDetailsPanel'
import {
  getClimbSegmentPoints,
  getGradeBucket,
} from './ClimbDetailsPanel.helpers'
import type { ActivityChartTrackPoint } from './ActivityChartData'

type ActivityClimb = GarminActivityClimbsQuery['garminActivityClimbs'][number]

const pointerCaptureMethodNames = [
  'hasPointerCapture',
  'releasePointerCapture',
  'setPointerCapture',
] as const
const pointerCaptureDescriptors = Object.fromEntries(
  pointerCaptureMethodNames.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, name),
  ]),
)

beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    releasePointerCapture: { configurable: true, value: vi.fn() },
    setPointerCapture: { configurable: true, value: vi.fn() },
  })
})

afterAll(() => {
  for (const name of pointerCaptureMethodNames) {
    const descriptor = pointerCaptureDescriptors[name]
    if (descriptor) {
      Object.defineProperty(HTMLElement.prototype, name, descriptor)
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, name)
    }
  }
})

const leafletMocks = vi.hoisted(() => {
  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
  }
  const layer = {
    bindTooltip: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  }
  const routeLayer = {
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
  }
  const marker = {
    bindPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  }
  const bounds = {
    extend: vi.fn(),
    isValid: vi.fn(() => true),
  }

  return {
    mapInstance,
    layer,
    routeLayer,
    marker,
    bounds,
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => layer),
    layerGroup: vi.fn(() => routeLayer),
    polyline: vi.fn((points: unknown, options?: { color?: string }) => {
      void points
      void options
      return layer
    }),
    circleMarker: vi.fn(() => marker),
    latLngBounds: vi.fn(() => bounds),
  }
})

vi.mock('leaflet', () => ({
  default: {
    map: leafletMocks.map,
    tileLayer: leafletMocks.tileLayer,
    layerGroup: leafletMocks.layerGroup,
    polyline: leafletMocks.polyline,
    circleMarker: leafletMocks.circleMarker,
    latLngBounds: leafletMocks.latLngBounds,
  },
}))

vi.mock('./SaveSegmentPopover', () => ({
  SaveSegmentPopover: () => (
    <div data-testid="save-segment-trigger">save-segment</div>
  ),
}))

describe('ClimbDetailsPanel', () => {
  beforeEach(() => {
    leafletMocks.map.mockClear()
    leafletMocks.tileLayer.mockClear()
    leafletMocks.layerGroup.mockClear()
    leafletMocks.routeLayer.addTo.mockClear()
    leafletMocks.routeLayer.clearLayers.mockClear()
    leafletMocks.polyline.mockClear()
    leafletMocks.layer.bindTooltip.mockClear()
    leafletMocks.layer.addTo.mockClear()
    leafletMocks.circleMarker.mockClear()
    leafletMocks.latLngBounds.mockClear()
    leafletMocks.mapInstance.setView.mockClear()
    leafletMocks.mapInstance.fitBounds.mockClear()
    leafletMocks.mapInstance.remove.mockClear()
    leafletMocks.bounds.extend.mockClear()
    leafletMocks.bounds.isValid.mockClear()
    leafletMocks.bounds.isValid.mockReturnValue(true)
  })

  it('formats stats and renders the climb chart and map', async () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={2}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext
      />,
    )

    expect(screen.getByText('Climb 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('1.57%')).toBeInTheDocument()
    expect(screen.getByText('5.76%')).toBeInTheDocument()
    expect(screen.getByText('26 ft')).toBeInTheDocument()
    expect(screen.getByText('0.32 mi')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(
      screen.getByTestId('climb-elevation-grade-chart'),
    ).toBeInTheDocument()

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))
    expect(leafletMocks.polyline).toHaveBeenCalledWith(
      [
        [40.1, -73.1],
        [40.2, -73.2],
      ],
      expect.objectContaining({ color: '#22c55e' }),
    )
    expect(leafletMocks.polyline).toHaveBeenCalledWith(
      [
        [40.2, -73.2],
        [40.3, -73.3],
      ],
      expect.objectContaining({ color: '#22c55e' }),
    )
    expect(leafletMocks.layer.bindTooltip).toHaveBeenCalledWith(
      expect.stringContaining('Grade'),
    )
    expect(leafletMocks.routeLayer.clearLayers).toHaveBeenCalledTimes(1)
    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(2)
    expect(
      screen.getByRole('combobox', { name: 'Color climb map route by metric' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('climb-map-metric-control')).toHaveAttribute(
      'data-available-metrics',
      expect.stringContaining('heart-rate'),
    )
  })

  it('renders the save-as-segment control when the climb has coordinates', () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(screen.getByTestId('save-segment-trigger')).toBeInTheDocument()
  })

  it('hides the save-as-segment control when the climb lacks coordinates', () => {
    render(
      <ClimbDetailsPanel
        climb={{
          ...mockClimb(),
          start_latitude: null,
          start_longitude: null,
          end_latitude: null,
          end_longitude: null,
        }}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(screen.queryByTestId('save-segment-trigger')).not.toBeInTheDocument()
  })

  it('hides sensor overlay options when older climb points lack sensor data', async () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPointsWithoutSensorMetrics()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('climb-map-metric-control')).toHaveAttribute(
      'data-available-metrics',
      'route grade',
    )
    expect(
      screen.queryByRole('option', { name: 'Heart rate' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'Respiration' }),
    ).not.toBeInTheDocument()
  })

  it('filters chart points to the selected climb time window', () => {
    const points = getClimbSegmentPoints(mockClimb(), mockChartPoints())

    expect(points.map((point) => point.timestamp)).toEqual([
      '2026-03-14T09:05:00Z',
      '2026-03-14T09:07:00Z',
      '2026-03-14T09:10:00Z',
    ])
  })

  it('uses the expected grade buckets', () => {
    expect(getGradeBucket(2.9).label).toBe('<3%')
    expect(getGradeBucket(3).label).toBe('3-6%')
    expect(getGradeBucket(6).label).toBe('6-9%')
    expect(getGradeBucket(9).label).toBe('9-12%')
    expect(getGradeBucket(12).label).toBe('>12%')
  })

  it('calls previous and next handlers and disables at boundaries', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    const onNext = vi.fn()

    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={1}
        totalClimbs={2}
        chartPoints={mockChartPoints()}
        onPrevious={onPrevious}
        onNext={onNext}
        canPrevious
        canNext={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Previous climb' }))
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Next climb' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next climb' }))
    expect(onNext).not.toHaveBeenCalled()
  })

  it('calls the next handler when another climb is available', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()

    render(
      <ClimbDetailsPanel
        climb={mockClimb({ climb_pro_difficulty: 'Category 3' })}
        climbIndex={0}
        totalClimbs={2}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={onNext}
        canPrevious={false}
        canNext
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Next climb' }))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Category 3')).toBeInTheDocument()
  })

  it('formats missing climb stats and rejects non-finite segment coordinates', () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb({
          average_grade_percent: null,
          max_grade_percent: null,
          elevation_gain_meters: null,
          distance_meters: null,
          duration_seconds: null,
          climb_pro_difficulty: '   ',
          start_latitude: Number.NaN,
        })}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(screen.getAllByText('-')).toHaveLength(4)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.queryByTestId('save-segment-trigger')).not.toBeInTheDocument()
  })

  it('switches among every available map metric with boundary and fallback values', async () => {
    const user = userEvent.setup()
    render(
      <ClimbDetailsPanel
        climb={mockClimb({ end_time: '2026-03-14T09:11:00Z' })}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPointsWithMetricBuckets()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))

    const cases = [
      {
        name: 'Route',
        colors: Array(6).fill('#2563eb'),
        firstTooltip: 'Climb segment',
        lastTooltip: 'Climb segment',
      },
      {
        name: 'HR zone',
        colors: [
          '#9ca3af',
          '#3b82f6',
          '#22c55e',
          '#facc15',
          '#f97316',
          '#ef4444',
        ],
        firstTooltip: 'HR zone -',
        lastTooltip: 'HR zone 5',
      },
      {
        name: 'Heart rate',
        colors: [
          '#6b7280',
          '#3b82f6',
          '#22c55e',
          '#facc15',
          '#f97316',
          '#ef4444',
        ],
        firstTooltip: 'Heart rate -',
        lastTooltip: 'Heart rate 175 bpm',
      },
      {
        name: 'Respiration',
        colors: [
          '#6b7280',
          '#3b82f6',
          '#22c55e',
          '#facc15',
          '#f97316',
          '#ef4444',
        ],
        firstTooltip: 'Respiration -',
        lastTooltip: 'Respiration 32 br/min',
      },
      {
        name: 'Speed',
        colors: [
          '#6b7280',
          '#3b82f6',
          '#22c55e',
          '#facc15',
          '#f97316',
          '#ef4444',
        ],
        firstTooltip: 'Speed -',
        lastTooltip: 'Speed 34 km/h',
      },
      {
        name: 'Temperature',
        colors: [
          '#6b7280',
          '#2563eb',
          '#06b6d4',
          '#22c55e',
          '#f97316',
          '#ef4444',
        ],
        firstTooltip: 'Temperature -',
        lastTooltip: 'Temperature 30 C',
      },
    ]

    for (const metric of cases) {
      leafletMocks.polyline.mockClear()
      leafletMocks.layer.bindTooltip.mockClear()

      await user.click(
        screen.getByRole('combobox', {
          name: 'Color climb map route by metric',
        }),
      )
      await user.click(screen.getByRole('option', { name: metric.name }))

      await waitFor(() =>
        expect(leafletMocks.polyline).toHaveBeenCalledTimes(6),
      )
      expect(
        leafletMocks.polyline.mock.calls.map((call) => call[1]?.color),
      ).toEqual(metric.colors)
      expect(leafletMocks.layer.bindTooltip).toHaveBeenNthCalledWith(
        1,
        metric.firstTooltip,
      )
      expect(leafletMocks.layer.bindTooltip).toHaveBeenLastCalledWith(
        metric.lastTooltip,
      )
    }
  })

  it('uses grade fallbacks when only some map segments have grade data', async () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPointsWithPartialGradeData()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    await waitFor(() => expect(leafletMocks.polyline).toHaveBeenCalledTimes(2))
    expect(leafletMocks.polyline.mock.calls[0]?.[1]?.color).toBe('#6b7280')
    expect(leafletMocks.layer.bindTooltip).toHaveBeenNthCalledWith(1, 'Grade -')
    expect(leafletMocks.layer.bindTooltip).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^Grade -?\d+\.\d%$/),
    )
  })

  it('shows route-only and chart fallbacks for coordinate-only points', async () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockCoordinateOnlyPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(
      screen.getByText(
        'No elevation and distance chart data available for this climb.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Route')).toHaveLength(2)
    expect(
      screen.queryByRole('combobox', {
        name: 'Color climb map route by metric',
      }),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(leafletMocks.polyline).toHaveBeenCalledTimes(1))
    expect(leafletMocks.polyline.mock.calls[0]?.[1]?.color).toBe('#2563eb')
  })

  it('renders equal-distance chart points without invalid SVG coordinates', () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockEqualDistancePoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    const chart = screen.getByRole('img', {
      name: 'Elevation and grade over climb distance',
    })
    expect(chart.innerHTML).not.toContain('NaN')
    expect(chart.querySelectorAll('polygon')).toHaveLength(1)
  })

  it('skips map fitting for invalid bounds and removes the map on unmount', async () => {
    leafletMocks.bounds.isValid.mockReturnValue(false)
    const { unmount } = render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))
    expect(leafletMocks.mapInstance.fitBounds).not.toHaveBeenCalled()

    unmount()
    expect(leafletMocks.mapInstance.remove).toHaveBeenCalledTimes(1)
  })

  it('shows a chart-point empty state when the selected climb has no points', () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb({
          start_time: '2026-03-14T10:00:00Z',
          end_time: '2026-03-14T10:05:00Z',
        })}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(
      screen.getByText('No chart points available for this climb.'),
    ).toBeInTheDocument()
  })

  it('shows a map empty state when selected chart points have no lat/lng', () => {
    render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPointsWithoutCoordinates()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(
      screen.getByTestId('climb-elevation-grade-chart'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No map points available for this climb.'),
    ).toBeInTheDocument()
  })

  it('removes an existing climb map when the selected climb has no map points', async () => {
    const { rerender } = render(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPoints()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )
    await waitFor(() => expect(leafletMocks.map).toHaveBeenCalledTimes(1))

    rerender(
      <ClimbDetailsPanel
        climb={mockClimb()}
        climbIndex={0}
        totalClimbs={1}
        chartPoints={mockChartPointsWithoutCoordinates()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        canPrevious={false}
        canNext={false}
      />,
    )

    expect(leafletMocks.mapInstance.remove).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText('No map points available for this climb.'),
    ).toBeInTheDocument()
  })
})

function mockClimb(overrides: Partial<ActivityClimb> = {}): ActivityClimb {
  return {
    id: 1,
    activity_id: '42',
    source_split_index: 0,
    message_index: null,
    climb_type: 'CLIMB_PRO_CYCLING_CLIMB',
    start_time: '2026-03-14T09:05:00Z',
    end_time: '2026-03-14T09:10:00Z',
    duration_seconds: 122,
    elapsed_duration_seconds: 122,
    moving_duration_seconds: 122,
    distance_meters: 509.6,
    elevation_gain_meters: 8,
    elevation_loss_meters: 0,
    start_elevation_meters: 27,
    average_grade_percent: 1.57,
    max_grade_percent: 5.76,
    average_speed_mps: 4.1,
    max_speed_mps: 6.2,
    start_latitude: 40.1,
    start_longitude: -73.1,
    end_latitude: 40.3,
    end_longitude: -73.3,
    climb_pro_difficulty: null,
    ...overrides,
  }
}

function mockChartPoints(): ActivityChartTrackPoint[] {
  return [
    {
      timestamp: '2026-03-14T09:04:00Z',
      altitude: 24,
      distance_from_start_km: 19,
      latitude: 40,
      longitude: -73,
    },
    {
      timestamp: '2026-03-14T09:05:00Z',
      altitude: 27,
      distance_from_start_km: 19.5,
      latitude: 40.1,
      longitude: -73.1,
      speed_kmh: 14,
      heart_rate: 128,
      hr_zone: 2,
      respiration_rate: 22,
      temperature_c: 18,
    },
    {
      timestamp: '2026-03-14T09:07:00Z',
      altitude: 31,
      distance_from_start_km: 19.75,
      latitude: 40.2,
      longitude: -73.2,
      speed_kmh: 16,
      heart_rate: 142,
      hr_zone: 3,
      respiration_rate: 24,
      temperature_c: 19,
    },
    {
      timestamp: '2026-03-14T09:10:00Z',
      altitude: 35,
      distance_from_start_km: 20,
      latitude: 40.3,
      longitude: -73.3,
      speed_kmh: 17,
      heart_rate: 151,
      hr_zone: 3,
      respiration_rate: 26,
      temperature_c: 20,
    },
    {
      timestamp: '2026-03-14T09:11:00Z',
      altitude: 33,
      distance_from_start_km: 20.1,
      latitude: 40.4,
      longitude: -73.4,
    },
  ]
}

function mockChartPointsWithoutCoordinates(): ActivityChartTrackPoint[] {
  return mockChartPoints().map((point) => ({
    ...point,
    latitude: null,
    longitude: null,
  }))
}

function mockChartPointsWithoutSensorMetrics(): ActivityChartTrackPoint[] {
  return mockChartPoints().map((point) => ({
    timestamp: point.timestamp,
    altitude: point.altitude,
    distance_from_start_km: point.distance_from_start_km,
    latitude: point.latitude,
    longitude: point.longitude,
  }))
}

function mockChartPointsWithMetricBuckets(): ActivityChartTrackPoint[] {
  const heartRateZones = [null, 1, 2, 3, 4, 5, 6]
  const heartRates = [null, 119, 120, 140, 160, 175, 180]
  const respirationRates = [null, 19, 20, 24, 28, 32, 35]
  const speeds = [null, 9, 10, 18, 26, 34, 40]
  const temperatures = [null, 4, 5, 15, 24, 30, 35]

  return heartRateZones.map((hrZone, index) => ({
    timestamp: `2026-03-14T09:${String(index + 5).padStart(2, '0')}:00Z`,
    altitude: 20 + index,
    distance_from_start_km: 10 + index * 0.1,
    latitude: 40 + index * 0.01,
    longitude: -73 - index * 0.01,
    hr_zone: hrZone,
    heart_rate: heartRates[index],
    respiration_rate: respirationRates[index],
    speed_kmh: speeds[index],
    temperature_c: temperatures[index],
  }))
}

function mockChartPointsWithPartialGradeData(): ActivityChartTrackPoint[] {
  return [
    {
      timestamp: '2026-03-14T09:05:00Z',
      altitude: null,
      distance_from_start_km: null,
      latitude: 40.1,
      longitude: -73.1,
    },
    {
      timestamp: '2026-03-14T09:07:00Z',
      altitude: 30,
      distance_from_start_km: 10,
      latitude: 40.2,
      longitude: -73.2,
    },
    {
      timestamp: '2026-03-14T09:10:00Z',
      altitude: 35,
      distance_from_start_km: 10.1,
      latitude: 40.3,
      longitude: -73.3,
    },
  ]
}

function mockCoordinateOnlyPoints(): ActivityChartTrackPoint[] {
  return [
    {
      timestamp: '2026-03-14T09:05:00Z',
      latitude: 40.1,
      longitude: -73.1,
    },
    {
      timestamp: '2026-03-14T09:10:00Z',
      latitude: 40.2,
      longitude: -73.2,
    },
  ]
}

function mockEqualDistancePoints(): ActivityChartTrackPoint[] {
  return [
    {
      timestamp: '2026-03-14T09:05:00Z',
      altitude: 30,
      distance_from_start_km: 10,
      latitude: 40.1,
      longitude: -73.1,
    },
    {
      timestamp: '2026-03-14T09:10:00Z',
      altitude: 30,
      distance_from_start_km: 10,
      latitude: 40.2,
      longitude: -73.2,
    },
  ]
}

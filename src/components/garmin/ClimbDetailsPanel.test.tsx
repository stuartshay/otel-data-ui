import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClimbDetailsPanel } from './ClimbDetailsPanel'
import {
  getClimbSegmentPoints,
  getGradeBucket,
} from './ClimbDetailsPanel.helpers'
import type { ActivityChartTrackPoint } from './ActivityChartData'

const leafletMocks = vi.hoisted(() => {
  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn(),
    remove: vi.fn(),
  }
  const layer = {
    addTo: vi.fn().mockReturnThis(),
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
    marker,
    bounds,
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => layer),
    polyline: vi.fn(() => layer),
    circleMarker: vi.fn(() => marker),
    latLngBounds: vi.fn(() => bounds),
  }
})

vi.mock('leaflet', () => ({
  default: {
    map: leafletMocks.map,
    tileLayer: leafletMocks.tileLayer,
    polyline: leafletMocks.polyline,
    circleMarker: leafletMocks.circleMarker,
    latLngBounds: leafletMocks.latLngBounds,
  },
}))

describe('ClimbDetailsPanel', () => {
  beforeEach(() => {
    leafletMocks.map.mockClear()
    leafletMocks.tileLayer.mockClear()
    leafletMocks.polyline.mockClear()
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
        [40.3, -73.3],
      ],
      expect.objectContaining({ color: '#2563eb' }),
    )
    expect(leafletMocks.circleMarker).toHaveBeenCalledTimes(2)
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
})

function mockClimb(
  overrides: Partial<{
    start_time: string
    end_time: string
  }> = {},
) {
  return {
    id: 1,
    activity_id: '42',
    source_split_index: 0,
    message_index: null,
    climb_type: 'CLIMB_PRO_CYCLING_CLIMB',
    start_time: overrides.start_time ?? '2026-03-14T09:05:00Z',
    end_time: overrides.end_time ?? '2026-03-14T09:10:00Z',
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
    },
    {
      timestamp: '2026-03-14T09:07:00Z',
      altitude: 31,
      distance_from_start_km: 19.75,
      latitude: 40.2,
      longitude: -73.2,
    },
    {
      timestamp: '2026-03-14T09:10:00Z',
      altitude: 35,
      distance_from_start_km: 20,
      latitude: 40.3,
      longitude: -73.3,
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

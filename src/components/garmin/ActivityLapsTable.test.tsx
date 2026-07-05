import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityLapsTable } from './ActivityLapsTable'
import {
  buildLapSummary,
  getLapSegmentPoints,
  type ActivityLap,
} from './ActivityLapsTable.helpers'

let latestRouteMapPoints: Array<{
  latitude: number
  longitude: number
  speed_kmh?: number | null
}> = []

vi.mock('./ActivityRouteMap', () => ({
  ActivityRouteMap: ({
    trackPoints,
  }: {
    trackPoints: Array<{
      latitude: number
      longitude: number
      speed_kmh?: number | null
    }>
  }) => {
    latestRouteMapPoints = trackPoints
    return (
      <div data-testid="activity-route-map">route:{trackPoints.length}</div>
    )
  },
}))

function lap(overrides: Partial<ActivityLap> = {}): ActivityLap {
  return {
    id: overrides.lap_index ?? 1,
    lap_index: 1,
    duration_seconds: 60,
    distance_meters: 1609.344,
    paved_distance_meters: 1609.344,
    unpaved_distance_meters: 0,
    avg_speed_mps: 4,
    avg_heart_rate: 120,
    max_heart_rate: 140,
    total_ascent_meters: 10,
    total_descent_meters: 8,
    calories: 50,
    ...overrides,
  }
}

describe('ActivityLapsTable', () => {
  beforeEach(() => {
    latestRouteMapPoints = []
  })

  it('filters lap segment points inclusively by lap timestamps and valid coordinates', () => {
    const selectedLap = lap({
      start_time: '2026-03-14T09:05:00Z',
      end_time: '2026-03-14T09:10:00Z',
    })

    const points = getLapSegmentPoints(selectedLap, [
      {
        timestamp: '2026-03-14T09:04:59Z',
        latitude: 40.69,
        longitude: -74,
      },
      {
        timestamp: '2026-03-14T09:05:00Z',
        latitude: 40.7,
        longitude: -74.01,
      },
      {
        timestamp: '2026-03-14T09:07:30Z',
        latitude: null,
        longitude: -74.02,
      },
      {
        timestamp: '2026-03-14T09:10:00Z',
        latitude: 40.71,
        longitude: -74.03,
      },
      {
        timestamp: '2026-03-14T09:10:01Z',
        latitude: 40.72,
        longitude: -74.04,
      },
    ])

    expect(points.map((point) => point.timestamp)).toEqual([
      '2026-03-14T09:05:00Z',
      '2026-03-14T09:10:00Z',
    ])
  })

  it('returns no lap segment points when timestamps and distance fallback data are unavailable', () => {
    expect(getLapSegmentPoints(lap(), [])).toEqual([])
    expect(
      getLapSegmentPoints(
        lap({
          start_time: 'bad',
          end_time: '2026-03-14T09:10:00Z',
        }),
        [
          {
            timestamp: '2026-03-14T09:05:00Z',
            latitude: 40.7,
            longitude: -74,
          },
        ],
      ),
    ).toEqual([])
  })

  it('falls back to lap duration when the lap end timestamp is not after the start', () => {
    const points = getLapSegmentPoints(
      lap({
        start_time: '2026-07-04T19:50:33Z',
        end_time: '2026-07-04T19:50:33Z',
        duration_seconds: 120,
      }),
      [
        {
          timestamp: '2026-07-04T19:50:33Z',
          latitude: 40.7,
          longitude: -74,
        },
        {
          timestamp: '2026-07-04T19:51:30Z',
          latitude: 40.71,
          longitude: -74.01,
        },
        {
          timestamp: '2026-07-04T19:53:00Z',
          latitude: 40.72,
          longitude: -74.02,
        },
      ],
    )

    expect(points.map((point) => point.timestamp)).toEqual([
      '2026-07-04T19:50:33Z',
      '2026-07-04T19:51:30Z',
    ])
  })

  it('falls back to cumulative lap distance when timestamps do not produce a route segment', () => {
    const firstLap = lap({
      lap_index: 1,
      distance_meters: 1000,
      start_time: null,
      end_time: null,
    })
    const secondLap = lap({
      lap_index: 2,
      distance_meters: 2000,
      start_time: null,
      end_time: null,
    })

    const points = getLapSegmentPoints(
      secondLap,
      [
        {
          timestamp: '2026-07-04T19:50:00Z',
          latitude: 40.7,
          longitude: -74,
          distance_from_start_km: 0.9,
        },
        {
          timestamp: '2026-07-04T19:51:00Z',
          latitude: 40.71,
          longitude: -74.01,
          distance_from_start_km: 1,
        },
        {
          timestamp: '2026-07-04T19:52:00Z',
          latitude: 40.72,
          longitude: -74.02,
          distance_from_start_km: 2,
        },
        {
          timestamp: '2026-07-04T19:53:00Z',
          latitude: 40.73,
          longitude: -74.03,
          distance_from_start_km: 3,
        },
        {
          timestamp: '2026-07-04T19:54:00Z',
          latitude: 40.74,
          longitude: -74.04,
          distance_from_start_km: 3.1,
        },
      ],
      [firstLap, secondLap],
    )

    expect(points.map((point) => point.distance_from_start_km)).toEqual([
      1, 2, 3,
    ])
  })

  it('does not use distance fallback when a prior lap distance is invalid', () => {
    const firstLap = lap({
      lap_index: 1,
      distance_meters: null,
      start_time: null,
      end_time: null,
    })
    const secondLap = lap({
      lap_index: 2,
      distance_meters: 2000,
      start_time: null,
      end_time: null,
    })

    expect(
      getLapSegmentPoints(
        secondLap,
        [
          {
            timestamp: '2026-07-04T19:51:00Z',
            latitude: 40.71,
            longitude: -74.01,
            distance_from_start_km: 1,
          },
        ],
        [firstLap, secondLap],
      ),
    ).toEqual([])
  })

  it('builds weighted summary values', () => {
    const summary = buildLapSummary([
      lap({ lap_index: 1, duration_seconds: 100, avg_heart_rate: 120 }),
      lap({ lap_index: 2, duration_seconds: 200, avg_heart_rate: 150 }),
    ])

    expect(summary.durationSeconds).toBe(300)
    expect(summary.distanceMeters).toBeCloseTo(3218.688)
    expect(summary.avgSpeedMps).toBeCloseTo(10.72896)
    expect(summary.avgHeartRate).toBe(140)
    expect(summary.maxHeartRate).toBe(140)
  })

  it('preserves zero summary percentages and ignores unavailable heart rate values', () => {
    const summary = buildLapSummary([
      lap({
        lap_index: 1,
        distance_meters: 1000,
        paved_distance_meters: 0,
        unpaved_distance_meters: 1000,
        avg_heart_rate: 0,
      }),
      lap({
        lap_index: 2,
        distance_meters: 1000,
        paved_distance_meters: 0,
        unpaved_distance_meters: 1000,
        avg_heart_rate: null,
      }),
    ])

    expect(summary.pavedPercent).toBe(0)
    expect(summary.unpavedPercent).toBe(100)
    expect(summary.avgHeartRate).toBeNull()
  })

  it('falls back to distance weighting when heart-rate laps have zero duration', () => {
    const summary = buildLapSummary([
      lap({
        lap_index: 1,
        duration_seconds: 0,
        distance_meters: 1000,
        avg_heart_rate: 120,
      }),
      lap({
        lap_index: 2,
        duration_seconds: 0,
        distance_meters: 3000,
        avg_heart_rate: 160,
      }),
    ])

    expect(summary.avgHeartRate).toBe(150)
  })

  it('renders laps in lap order with cumulative time and summary', () => {
    render(
      <ActivityLapsTable
        laps={[
          lap({ id: 2, lap_index: 2, duration_seconds: 90 }),
          lap({ id: 1, lap_index: 1, duration_seconds: 60 }),
        ]}
      />,
    )

    const rows = screen.getAllByTestId(/lap-row-/)
    const firstCells = within(rows[0]).getAllByRole('cell')
    const secondCells = within(rows[1]).getAllByRole('cell')
    expect(firstCells[0]).toHaveTextContent('1')
    expect(firstCells[1]).toHaveTextContent('1:00')
    expect(firstCells[2]).toHaveTextContent('1:00')
    expect(secondCells[0]).toHaveTextContent('2')
    expect(secondCells[1]).toHaveTextContent('1:30')
    expect(secondCells[2]).toHaveTextContent('2:30')
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getAllByText('2.00')[0]).toBeInTheDocument()
  })

  it('supports selecting rows with click and keyboard', () => {
    render(
      <ActivityLapsTable
        laps={[lap({ lap_index: 1 }), lap({ lap_index: 2 })]}
      />,
    )

    const first = screen.getByTestId('lap-row-1')
    const second = screen.getByTestId('lap-row-2')

    fireEvent.click(first)
    expect(first).toHaveAttribute('data-selected', 'true')

    fireEvent.click(within(second).getByRole('button', { name: '2' }))
    expect(second).toHaveAttribute('data-selected', 'true')
    expect(within(second).getByRole('button', { name: '2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('renders selected lap details with recorded stats and a route map', () => {
    render(
      <ActivityLapsTable
        laps={[
          lap({
            lap_index: 1,
            start_time: '2026-03-14T09:05:00Z',
            end_time: '2026-03-14T09:10:00Z',
            duration_seconds: 300,
            elapsed_duration_seconds: 330,
            moving_duration_seconds: 290,
            distance_meters: 3218.688,
            paved_distance_meters: 1609.344,
            unpaved_distance_meters: 1609.344,
            avg_speed_mps: 5,
            avg_heart_rate: 145,
            max_heart_rate: 172,
            total_ascent_meters: 30.48,
            total_descent_meters: 15.24,
            calories: 123,
          }),
        ]}
        chartPoints={[
          {
            timestamp: '2026-03-14T09:05:00Z',
            latitude: 40.7,
            longitude: -74.01,
            speed_kmh: 18,
          },
          {
            timestamp: '2026-03-14T09:10:00Z',
            latitude: 40.71,
            longitude: -74.02,
            speed_kmh: 20,
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByTestId('lap-row-1'))

    const panel = screen.getByTestId('activity-lap-details-panel')
    expect(panel).toHaveTextContent('Lap 1')
    expect(panel).toHaveTextContent('Timer Time')
    expect(panel).toHaveTextContent('5:00')
    expect(panel).toHaveTextContent('Elapsed Time')
    expect(panel).toHaveTextContent('5:30')
    expect(panel).toHaveTextContent('Moving Time')
    expect(panel).toHaveTextContent('4:50')
    expect(panel).toHaveTextContent('2.00 mi')
    expect(panel).toHaveTextContent('50%')
    expect(panel).toHaveTextContent('11.2 mph')
    expect(panel).toHaveTextContent('145')
    expect(panel).toHaveTextContent('172')
    expect(panel).toHaveTextContent('100 ft')
    expect(panel).toHaveTextContent('50 ft')
    expect(panel).toHaveTextContent('123 kcal')
    expect(screen.getByTestId('activity-route-map')).toHaveTextContent(
      'route:2',
    )
    expect(latestRouteMapPoints).toEqual([
      { latitude: 40.7, longitude: -74.01, speed_kmh: 18 },
      { latitude: 40.71, longitude: -74.02, speed_kmh: 20 },
    ])
  })

  it('uses the effective fallback end time in the selected lap details', () => {
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }
    const expectedStart = new Date('2026-07-04T19:50:33Z').toLocaleTimeString(
      [],
      timeFormatOptions,
    )
    const expectedEnd = new Date('2026-07-04T19:52:33Z').toLocaleTimeString(
      [],
      timeFormatOptions,
    )

    render(
      <ActivityLapsTable
        laps={[
          lap({
            lap_index: 1,
            start_time: '2026-07-04T19:50:33Z',
            end_time: '2026-07-04T19:50:33Z',
            duration_seconds: 120,
          }),
        ]}
        chartPoints={[
          {
            timestamp: '2026-07-04T19:50:33Z',
            latitude: 40.7,
            longitude: -74.01,
          },
          {
            timestamp: '2026-07-04T19:52:00Z',
            latitude: 40.71,
            longitude: -74.02,
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByTestId('lap-row-1'))

    expect(screen.getByTestId('activity-lap-details-panel')).toHaveTextContent(
      `${expectedStart} – ${expectedEnd}`,
    )
  })

  it('renders the route map when one lap route point is resolved', () => {
    render(
      <ActivityLapsTable
        laps={[
          lap({
            lap_index: 1,
            start_time: '2026-03-14T09:05:00Z',
            end_time: '2026-03-14T09:06:00Z',
          }),
        ]}
        chartPoints={[
          {
            timestamp: '2026-03-14T09:05:30Z',
            latitude: 40.7,
            longitude: -74.01,
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByTestId('lap-row-1'))

    expect(screen.getByTestId('activity-route-map')).toHaveTextContent(
      'route:1',
    )
    expect(screen.queryByTestId('activity-lap-route-empty')).toBeNull()
  })

  it('renders an empty route state when selected lap has no matching points', () => {
    render(
      <ActivityLapsTable
        laps={[
          lap({
            lap_index: 1,
            start_time: '2026-03-14T09:05:00Z',
            end_time: '2026-03-14T09:10:00Z',
          }),
        ]}
        chartPoints={[]}
      />,
    )

    fireEvent.click(screen.getByTestId('lap-row-1'))

    expect(screen.getByTestId('activity-lap-route-empty')).toHaveTextContent(
      'No route points available for this lap.',
    )
  })

  it('renders an empty state when no laps are available', () => {
    render(<ActivityLapsTable laps={[]} />)

    expect(
      screen.getByText('No laps found for this activity.'),
    ).toBeInTheDocument()
  })
})

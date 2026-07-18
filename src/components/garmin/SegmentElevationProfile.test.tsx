import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentElevationProfile } from './SegmentElevationProfile'
import { buildSegmentElevationProfile } from './SegmentElevationProfile.helpers'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-chart">{children}</div>
  ),
  AreaChart: ({
    children,
    data,
  }: {
    children: React.ReactNode
    data: unknown[]
  }) => (
    <div data-testid="elevation-area-chart" data-point-count={data.length}>
      {children}
    </div>
  ),
  Area: () => null,
  CartesianGrid: () => null,
  Tooltip: ({
    formatter,
    labelFormatter,
  }: {
    formatter: (value: number) => [string, string]
    labelFormatter: (value: number) => string
  }) => (
    <div data-testid="elevation-tooltip-formatters">
      {formatter(100)[0]} at {labelFormatter(0.12)}
    </div>
  ),
  XAxis: ({ tickFormatter }: { tickFormatter: (value: number) => string }) => (
    <div data-testid="elevation-x-tick">{tickFormatter(0.12)}</div>
  ),
  YAxis: ({ tickFormatter }: { tickFormatter: (value: number) => string }) => (
    <div data-testid="elevation-y-tick">{tickFormatter(100.4)}</div>
  ),
}))

const routePoints = [
  {
    timestamp: '2026-07-18T12:00:00Z',
    distance_from_start_km: 10,
    altitude: 10,
  },
  {
    timestamp: '2026-07-18T12:00:30Z',
    distance_from_start_km: 10.1,
    altitude: 12,
  },
  {
    timestamp: '2026-07-18T12:01:00Z',
    distance_from_start_km: 10.2,
    altitude: 11,
  },
]

describe('buildSegmentElevationProfile', () => {
  it('normalizes distance and calculates start, finish, and cumulative gain', () => {
    const profile = buildSegmentElevationProfile(routePoints)

    expect(profile).not.toBeNull()
    expect(profile?.points[0].distanceMiles).toBe(0)
    expect(profile?.distanceMiles).toBeCloseTo(0.124, 3)
    expect(profile?.startElevationFeet).toBeCloseTo(32.81, 2)
    expect(profile?.finishElevationFeet).toBeCloseTo(36.09, 2)
    expect(profile?.elevationGainFeet).toBeCloseTo(6.56, 2)
  })

  it('returns null without at least two valid distance and altitude readings', () => {
    expect(
      buildSegmentElevationProfile([
        { timestamp: '2026-07-18T12:00:00Z', altitude: 10 },
        {
          timestamp: '2026-07-18T12:01:00Z',
          distance_from_start_km: 1,
          altitude: null,
        },
      ]),
    ).toBeNull()
    expect(
      buildSegmentElevationProfile([
        {
          timestamp: '2026-07-18T12:00:00Z',
          distance_from_start_km: 1,
          altitude: 10,
        },
        {
          timestamp: '2026-07-18T12:01:00Z',
          distance_from_start_km: 1,
          altitude: 12,
        },
      ]),
    ).toBeNull()
  })

  it('calculates the elevation domain for a large route without spreading point data', () => {
    const largeRoute = Array.from({ length: 150_000 }, (_, index) => ({
      timestamp: '2026-07-18T12:00:00Z',
      distance_from_start_km: index / 1_000,
      altitude: 10 + (index % 20),
    }))

    const profile = buildSegmentElevationProfile(largeRoute)

    expect(profile?.points).toHaveLength(150_000)
    expect(profile?.startElevationFeet).toBeCloseTo(32.81, 2)
    expect(profile?.finishElevationFeet).toBeCloseTo(95.14, 2)
    expect(profile?.yDomain).toEqual([22, 106])
  })
})

describe('SegmentElevationProfile', () => {
  it('renders a loading state while source track data is being fetched', () => {
    render(<SegmentElevationProfile routePoints={[]} loading />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading elevation profile...',
    )
  })

  it('renders the profile, summary statistics, and accessible description', () => {
    render(<SegmentElevationProfile routePoints={routePoints} />)

    expect(screen.getByRole('heading', { name: 'Elevation' })).toBeVisible()
    expect(screen.getByText('Start to finish')).toBeVisible()
    expect(screen.getByText('33 ft')).toBeVisible()
    expect(screen.getByText('36 ft')).toBeVisible()
    expect(screen.getByText('7 ft')).toBeVisible()
    expect(screen.getByTestId('elevation-area-chart')).toHaveAttribute(
      'data-point-count',
      '3',
    )
    expect(screen.getByTestId('elevation-x-tick')).toHaveTextContent('0.12')
    expect(screen.getByTestId('elevation-y-tick')).toHaveTextContent('100')
    expect(
      screen.getByTestId('elevation-tooltip-formatters'),
    ).toHaveTextContent('100 ft at 0.12 mi')
    expect(
      screen.getByRole('img', { name: /elevation profile from 33 ft/i }),
    ).toBeVisible()
  })

  it('renders a clear fallback when elevation data is unavailable', () => {
    render(
      <SegmentElevationProfile
        routePoints={[{ timestamp: '2026-07-18T12:00:00Z' }]}
      />,
    )

    expect(
      screen.getByText('Elevation profile unavailable for this segment.'),
    ).toBeVisible()
  })
})

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    onMouseMove,
    onMouseLeave,
  }: {
    children: React.ReactNode
    data: unknown[]
    onMouseMove?: (state: {
      activeTooltipIndex?: number | string | null
    }) => void
    onMouseLeave?: () => void
  }) => (
    <div data-testid="elevation-area-chart" data-point-count={data.length}>
      {children}
      <button onClick={() => onMouseMove?.({ activeTooltipIndex: '1' })}>
        Hover profile point
      </button>
      <button onClick={() => onMouseMove?.({ activeTooltipIndex: 0 })}>
        Hover first profile point
      </button>
      <button onClick={() => onMouseMove?.({ activeTooltipIndex: '' })}>
        Hover invalid profile point
      </button>
      <button onClick={onMouseLeave}>Leave profile</button>
    </div>
  ),
  Area: () => null,
  CartesianGrid: () => null,
  ReferenceDot: ({ x, y }: { x: number; y: number }) => (
    <div data-testid="elevation-playing-dot" data-x={x} data-y={y} />
  ),
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
    latitude: 40.79,
    longitude: -73.96,
  },
  {
    timestamp: '2026-07-18T12:00:30Z',
    distance_from_start_km: 10.1,
    altitude: 12,
    latitude: 40.795,
    longitude: -73.955,
  },
  {
    timestamp: '2026-07-18T12:01:00Z',
    distance_from_start_km: 10.2,
    altitude: 11,
    latitude: Number.NaN,
    longitude: null,
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
    expect(profile?.points[1]).toEqual(
      expect.objectContaining({ latitude: 40.795, longitude: -73.955 }),
    )
    expect(profile?.points[2]).toEqual(
      expect.objectContaining({ latitude: null, longitude: null }),
    )
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

  it('reuses a profile precomputed by the parent', () => {
    const precomputedProfile = buildSegmentElevationProfile(routePoints)

    render(
      <SegmentElevationProfile
        routePoints={[]}
        precomputedProfile={precomputedProfile}
      />,
    )

    expect(screen.getByTestId('elevation-area-chart')).toHaveAttribute(
      'data-point-count',
      '3',
    )
    expect(
      screen.queryByTestId('segment-elevation-profile-empty'),
    ).not.toBeInTheDocument()
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

  it('emits the active profile point and clears it when the pointer leaves', async () => {
    const user = userEvent.setup()
    const onActivePointChange = vi.fn()
    const { rerender } = render(
      <SegmentElevationProfile
        routePoints={routePoints}
        onActivePointChange={onActivePointChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Hover invalid profile point' }),
    )
    expect(onActivePointChange).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Hover profile point' }),
    )
    await waitFor(() =>
      expect(onActivePointChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          distanceMiles: expect.any(Number),
          elevationFeet: expect.any(Number),
          latitude: 40.795,
          longitude: -73.955,
        }),
      ),
    )
    expect(onActivePointChange).toHaveBeenCalledTimes(1)

    rerender(
      <SegmentElevationProfile
        routePoints={routePoints.map((point) => ({ ...point }))}
        onActivePointChange={onActivePointChange}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Hover profile point' }),
    )
    await new Promise((resolve) => window.requestAnimationFrame(resolve))
    expect(onActivePointChange).toHaveBeenCalledTimes(1)

    await user.click(
      screen.getByRole('button', { name: 'Hover first profile point' }),
    )
    await waitFor(() =>
      expect(onActivePointChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ latitude: 40.79, longitude: -73.96 }),
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Leave profile' }))
    await waitFor(() =>
      expect(onActivePointChange).toHaveBeenLastCalledWith(null),
    )
    const callCountAfterLeave = onActivePointChange.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Leave profile' }))
    await new Promise((resolve) => window.requestAnimationFrame(resolve))
    expect(onActivePointChange).toHaveBeenCalledTimes(callCountAfterLeave)
  })

  it('cancels a queued hover update when the profile unmounts', () => {
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockReturnValue(42)
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const onActivePointChange = vi.fn()
    const { unmount } = render(
      <SegmentElevationProfile
        routePoints={routePoints}
        onActivePointChange={onActivePointChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hover profile point' }))
    expect(requestFrame).toHaveBeenCalledOnce()

    unmount()
    expect(cancelFrame).toHaveBeenCalledWith(42)
    expect(onActivePointChange).not.toHaveBeenCalled()

    requestFrame.mockRestore()
    cancelFrame.mockRestore()
  })

  it('ignores hover updates when no listener is provided', () => {
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
    render(<SegmentElevationProfile routePoints={routePoints} />)

    fireEvent.click(screen.getByRole('button', { name: 'Hover profile point' }))

    expect(requestFrame).not.toHaveBeenCalled()
    requestFrame.mockRestore()
  })

  it('animates the active point from start to finish when Play is clicked', async () => {
    const frameCallbacks: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frameCallbacks.push(callback)
        return frameCallbacks.length
      })
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const onActivePointChange = vi.fn()
    const user = userEvent.setup()

    render(
      <SegmentElevationProfile
        routePoints={routePoints}
        onActivePointChange={onActivePointChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Play route playback' }),
    )
    expect(requestFrame).toHaveBeenCalledTimes(1)

    // Run the first queued frame at t=0 (start of the animation).
    act(() => frameCallbacks.shift()?.(0))
    // queueActivePointChange defers the actual callback by one more frame.
    act(() => frameCallbacks.shift()?.(0))
    expect(
      screen.getByRole('button', { name: 'Pause route playback' }),
    ).toBeVisible()
    expect(screen.getByTestId('elevation-playing-dot')).toBeInTheDocument()
    expect(onActivePointChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ latitude: 40.79, longitude: -73.96 }),
    )

    // Advance to the end of the animation window; playback should stop and
    // report the final profile point.
    act(() => frameCallbacks.shift()?.(6000))
    act(() => frameCallbacks.shift()?.(6000))

    expect(onActivePointChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ latitude: null, longitude: null }),
    )
    expect(
      screen.getByRole('button', { name: 'Play route playback' }),
    ).toBeVisible()
    expect(
      screen.queryByTestId('elevation-playing-dot'),
    ).not.toBeInTheDocument()

    requestFrame.mockRestore()
    now.mockRestore()
  })

  it('pauses in place and resumes from the paused position instead of restarting', async () => {
    const frameCallbacks: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frameCallbacks.push(callback)
        return frameCallbacks.length
      })
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const onActivePointChange = vi.fn()
    const user = userEvent.setup()

    render(
      <SegmentElevationProfile
        routePoints={routePoints}
        onActivePointChange={onActivePointChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Play route playback' }),
    )
    // Advance partway through the animation (half the 6s duration), landing
    // on the middle profile point (index 1 of 3).
    act(() => frameCallbacks.shift()?.(3000))
    act(() => frameCallbacks.shift()?.(3000))
    expect(
      screen.getByRole('button', { name: 'Pause route playback' }),
    ).toBeVisible()
    expect(onActivePointChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ latitude: 40.795, longitude: -73.955 }),
    )

    // Pause: the animation frame is cancelled, but the marker/active point
    // stay at the paused position rather than resetting to null.
    await user.click(
      screen.getByRole('button', { name: 'Pause route playback' }),
    )
    expect(cancelFrame).toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Play route playback' }),
    ).toBeVisible()
    expect(screen.getByTestId('elevation-playing-dot')).toBeInTheDocument()
    expect(onActivePointChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ latitude: 40.795, longitude: -73.955 }),
    )
    // The mocked requestAnimationFrame queue does not actually remove a
    // frame cancelled via cancelAnimationFrame (unlike a real browser), so
    // drop the stale pre-pause frame that's still sitting in the queue
    // before resuming, or it would run ahead of the fresh resumed step.
    frameCallbacks.length = 0

    // Resume: pressing Play again continues from the paused index instead of
    // restarting at t=0. Paused halfway through (index 1 of 2), so only the
    // remaining half of the 6000ms duration (3000ms of wall-clock time from
    // the resume click) is needed to reach the final point -- a fresh
    // restart would need the full 6000ms instead.
    now.mockReturnValue(100)
    await user.click(
      screen.getByRole('button', { name: 'Play route playback' }),
    )
    act(() => frameCallbacks.shift()?.(3100))
    act(() => frameCallbacks.shift()?.(3100))
    expect(onActivePointChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ latitude: null, longitude: null }),
    )
    expect(
      screen.getByRole('button', { name: 'Play route playback' }),
    ).toBeVisible()

    requestFrame.mockRestore()
    cancelFrame.mockRestore()
    now.mockRestore()
  })

  it('stops playback when the user hovers the chart manually', async () => {
    const frameCallbacks: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frameCallbacks.push(callback)
        return frameCallbacks.length
      })
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const user = userEvent.setup()

    render(<SegmentElevationProfile routePoints={routePoints} />)

    await user.click(
      screen.getByRole('button', { name: 'Play route playback' }),
    )
    act(() => frameCallbacks.shift()?.(0))
    expect(
      screen.getByRole('button', { name: 'Pause route playback' }),
    ).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Hover profile point' }),
    )
    expect(cancelFrame).toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Play route playback' }),
    ).toBeVisible()

    requestFrame.mockRestore()
    cancelFrame.mockRestore()
    now.mockRestore()
  })

  it('resets the Play button when the route changes mid-playback', async () => {
    const frameCallbacks: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frameCallbacks.push(callback)
        return frameCallbacks.length
      })
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const user = userEvent.setup()

    const { rerender } = render(
      <SegmentElevationProfile routePoints={routePoints} />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Play route playback' }),
    )
    act(() => frameCallbacks.shift()?.(0))
    expect(
      screen.getByRole('button', { name: 'Pause route playback' }),
    ).toBeVisible()

    const otherRoutePoints = routePoints.map((point) => ({ ...point }))
    act(() => {
      rerender(<SegmentElevationProfile routePoints={otherRoutePoints} />)
    })

    expect(cancelFrame).toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Play route playback' }),
    ).toBeVisible()

    requestFrame.mockRestore()
    cancelFrame.mockRestore()
    now.mockRestore()
  })

  it('coalesces multiple hover events into the latest animation frame point', () => {
    let queuedFrame: FrameRequestCallback | undefined
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        queuedFrame = callback
        return 42
      })
    const onActivePointChange = vi.fn()
    render(
      <SegmentElevationProfile
        routePoints={routePoints}
        onActivePointChange={onActivePointChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hover profile point' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Hover first profile point' }),
    )

    expect(requestFrame).toHaveBeenCalledOnce()
    queuedFrame?.(0)
    expect(onActivePointChange).toHaveBeenCalledOnce()
    expect(onActivePointChange).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 40.79, longitude: -73.96 }),
    )

    requestFrame.mockRestore()
  })
})

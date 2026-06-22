import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SavedPoint } from './ActivityChartData'
import { SegmentAnalysis } from './SegmentAnalysis'

function savedPoint(overrides: Partial<SavedPoint> = {}): SavedPoint {
  return {
    id: overrides.id ?? 'p',
    color: '#ff0000',
    timestamp: '2026-05-31T12:00:00Z',
    time: 0,
    distance: null,
    distanceKm: null,
    elevation: null,
    speed: null,
    heartRate: null,
    respirationRate: null,
    cadence: null,
    latitude: null,
    longitude: null,
    ...overrides,
  }
}

describe('SegmentAnalysis', () => {
  it('renders nothing with fewer than two points', () => {
    const { container } = render(<SegmentAnalysis points={[]} />)
    expect(container).toBeEmptyDOMElement()

    const { container: single } = render(
      <SegmentAnalysis points={[savedPoint()]} />,
    )
    expect(single).toBeEmptyDOMElement()
  })

  it('renders one row per consecutive segment', () => {
    const points = [
      savedPoint({ id: 'a', time: 0, distanceKm: 0 }),
      savedPoint({ id: 'b', time: 6, distanceKm: 1.609344 }),
      savedPoint({ id: 'c', time: 12, distanceKm: 3.218688 }),
    ]

    render(<SegmentAnalysis points={points} />)

    expect(screen.getByTestId('segment-analysis')).toBeInTheDocument()
    expect(screen.getByText('Segment Analysis (2)')).toBeInTheDocument()
    expect(screen.getAllByTestId('segment-row')).toHaveLength(2)
    expect(screen.getByText('#1→2')).toBeInTheDocument()
    expect(screen.getByText('#2→3')).toBeInTheDocument()
  })

  it('shows computed metrics for a segment', () => {
    const points = [
      savedPoint({ id: 'a', time: 0, distanceKm: 0, elevation: 100 }),
      savedPoint({ id: 'b', time: 6, distanceKm: 1.609344, elevation: 200 }),
    ]

    render(<SegmentAnalysis points={points} />)

    expect(screen.getByText('1.00 mi')).toBeInTheDocument()
    expect(screen.getByText('10.0 mph')).toBeInTheDocument()
    expect(screen.getByText('6:00 /mi')).toBeInTheDocument()
    expect(screen.getByText('+100 ft')).toBeInTheDocument()
  })

  it('flags a straight-line distance with a direct suffix', () => {
    const points = [
      savedPoint({ id: 'a', time: 0, latitude: 40.0, longitude: -74.0 }),
      savedPoint({ id: 'b', time: 10, latitude: 40.0, longitude: -73.9 }),
    ]

    render(<SegmentAnalysis points={points} />)

    expect(screen.getByText(/\(direct\)/)).toBeInTheDocument()
  })
})

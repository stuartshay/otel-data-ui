import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityStatsBar } from './ActivityStatsBar'

describe('ActivityStatsBar', () => {
  it('renders converted summary stats for the activity', () => {
    render(
      <ActivityStatsBar
        distanceKm={10}
        durationSeconds={3661}
        avgSpeedKmh={10}
        totalAscentM={100}
      />,
    )

    expect(screen.getByText('6.21')).toBeInTheDocument()
    expect(screen.getByText('1:01:01')).toBeInTheDocument()
    expect(screen.getByText('6.2')).toBeInTheDocument()
    expect(screen.getByText('328')).toBeInTheDocument()
  })
})

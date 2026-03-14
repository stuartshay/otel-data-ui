import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ActivityHeader } from './ActivityHeader'

describe('ActivityHeader', () => {
  it('renders the activity title, badges, and back link', () => {
    render(
      <MemoryRouter>
        <ActivityHeader
          sport="strength_training"
          subSport="upper_body"
          startTime="2026-03-14T09:00:00Z"
          deviceManufacturer="garmin"
          backTo="/garmin?page=2"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'strength training' }),
    ).toBeInTheDocument()
    expect(screen.getByText('upper body')).toBeInTheDocument()
    expect(screen.getByText('garmin')).toBeInTheDocument()
    expect(screen.getByTestId('back-to-list')).toHaveAttribute(
      'href',
      '/garmin?page=2',
    )
  })
})

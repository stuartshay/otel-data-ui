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

  it('renders the device model and firmware when device metadata is present', () => {
    render(
      <MemoryRouter>
        <ActivityHeader
          sport="cycling"
          startTime="2026-03-14T09:00:00Z"
          deviceManufacturer="garmin"
          device={{
            manufacturer: 'garmin',
            model: 'Edge 540 Solar',
            software_version: '31.30',
          }}
        />
      </MemoryRouter>,
    )

    const badge = screen.getByTestId('device-badge')
    expect(badge).toHaveTextContent('Edge 540 Solar')
    expect(badge).toHaveTextContent('v31.30')
    expect(badge).toHaveAttribute(
      'title',
      'Edge 540 Solar \u00b7 firmware 31.30',
    )
    // The raw manufacturer badge is superseded by the richer device badge.
    expect(screen.queryByText('garmin')).not.toBeInTheDocument()
  })

  it('falls back to the manufacturer badge when no device model is available', () => {
    render(
      <MemoryRouter>
        <ActivityHeader
          sport="cycling"
          startTime="2026-03-14T09:00:00Z"
          deviceManufacturer="garmin"
          device={null}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByTestId('device-badge')).not.toBeInTheDocument()
    expect(screen.getByText('garmin')).toBeInTheDocument()
  })
})

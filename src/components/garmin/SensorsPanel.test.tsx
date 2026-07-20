import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SensorsPanel } from './SensorsPanel'

describe('SensorsPanel', () => {
  it('shows a loading state', () => {
    render(<SensorsPanel sensors={[]} loading />)
    expect(screen.getByText('Loading sensors...')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    render(<SensorsPanel sensors={[]} error="network down" />)
    expect(
      screen.getByText(/Sensors unavailable: network down/),
    ).toBeInTheDocument()
  })

  it('shows an empty state when no sensors are recorded', () => {
    render(<SensorsPanel sensors={[]} />)
    expect(
      screen.getByText(/No sensor data recorded for this activity yet/),
    ).toBeInTheDocument()
  })

  it('renders the primary device using its product name', () => {
    render(
      <SensorsPanel
        sensors={[
          {
            id: 1,
            device_index: 0,
            is_primary: true,
            product_name: 'Edge 540 Solar',
            manufacturer: 'garmin',
            software_version: '27.14',
            battery_status: null,
          },
        ]}
      />,
    )

    expect(screen.getByText('Edge 540 Solar')).toBeInTheDocument()
    expect(screen.getByText('Garmin · v27.14')).toBeInTheDocument()
  })

  it('maps a known device_type to a friendly label for paired sensors', () => {
    render(
      <SensorsPanel
        sensors={[
          {
            id: 2,
            device_index: 1,
            is_primary: false,
            device_type: 'heart_rate',
            manufacturer: 'garmin',
            battery_status: 'low',
          },
        ]}
      />,
    )

    expect(screen.getByText('Heart Rate Monitor')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('falls back to a prettified raw device_type when unmapped', () => {
    render(
      <SensorsPanel
        sensors={[
          {
            id: 3,
            device_index: 2,
            is_primary: false,
            device_type: 'exd',
            manufacturer: null,
          },
        ]}
      />,
    )

    expect(screen.getByText('exd')).toBeInTheDocument()
  })

  it('renders battery status with distinct labels per state', () => {
    render(
      <SensorsPanel
        sensors={[
          {
            id: 1,
            device_index: 0,
            is_primary: true,
            battery_status: 'good',
          },
          {
            id: 2,
            device_index: 1,
            is_primary: false,
            device_type: 'bike_power',
            battery_status: 'critical',
          },
          {
            id: 3,
            device_index: 2,
            is_primary: false,
            device_type: 'bike_cadence',
            battery_status: 'charging',
          },
        ]}
      />,
    )

    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('Charging')).toBeInTheDocument()
  })

  it('omits the battery indicator when battery_status is missing', () => {
    render(
      <SensorsPanel
        sensors={[
          {
            id: 1,
            device_index: 0,
            is_primary: true,
            product_name: 'Edge 500',
            battery_status: null,
          },
        ]}
      />,
    )

    expect(screen.queryByText(/Unknown/)).not.toBeInTheDocument()
  })

  it('sorts sensors by device_index', () => {
    render(
      <SensorsPanel
        sensors={[
          {
            id: 2,
            device_index: 1,
            is_primary: false,
            device_type: 'bike_power',
          },
          {
            id: 1,
            device_index: 0,
            is_primary: true,
            product_name: 'Edge 540 Solar',
          },
        ]}
      />,
    )

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Edge 540 Solar')
    expect(items[1]).toHaveTextContent('Power Meter')
  })
})

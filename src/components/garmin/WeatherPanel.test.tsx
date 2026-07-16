import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WeatherPanel } from './WeatherPanel'

describe('WeatherPanel', () => {
  it('shows a loading state', () => {
    render(<WeatherPanel weather={undefined} loading />)
    expect(screen.getByText('Loading weather...')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    render(<WeatherPanel weather={undefined} error="network down" />)
    expect(
      screen.getByText(/Weather unavailable: network down/),
    ).toBeInTheDocument()
  })

  it('shows a not-yet-backfilled message when weather is null', () => {
    render(<WeatherPanel weather={null} />)
    expect(
      screen.getByText(/hasn't been recorded for this activity yet/),
    ).toBeInTheDocument()
  })

  it('renders converted metrics and conditions for a finalized reading', () => {
    render(
      <WeatherPanel
        weather={{
          temperature_c: 18.4,
          apparent_temperature_c: 17.0,
          relative_humidity_pct: 55,
          precipitation_mm: 2.54,
          cloud_cover_pct: 20,
          wind_speed_kmh: 16.09,
          wind_gusts_kmh: 32.19,
          weather_code: 61,
          is_provisional: false,
        }}
      />,
    )

    expect(screen.getByText('65°F')).toBeInTheDocument()
    expect(screen.getByText(/Slight rain/)).toBeInTheDocument()
    expect(screen.getByText(/Feels like 63°F/)).toBeInTheDocument()
    expect(screen.getByText('10 mph')).toBeInTheDocument()
    expect(screen.getByText('0.10 in')).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
    expect(screen.getByText(/Gusts up to 20 mph/)).toBeInTheDocument()
    expect(
      screen.queryByText(/Preliminary forecast data/),
    ).not.toBeInTheDocument()
  })

  it('flags provisional (not-yet-settled) readings', () => {
    render(
      <WeatherPanel
        weather={{
          temperature_c: 10,
          weather_code: 0,
          is_provisional: true,
        }}
      />,
    )

    expect(screen.getByText(/Preliminary forecast data/)).toBeInTheDocument()
  })

  it('renders dashes for missing optional fields', () => {
    render(<WeatherPanel weather={{ weather_code: null }} />)

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText(/Unknown conditions/)).toBeInTheDocument()
  })
})

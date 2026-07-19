import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WeatherHourlyBreakdown } from './WeatherHourlyBreakdown'

describe('WeatherHourlyBreakdown', () => {
  it('renders nothing when there are fewer than two hours', () => {
    const { container: empty } = render(
      <WeatherHourlyBreakdown hours={undefined} />,
    )
    expect(empty).toBeEmptyDOMElement()

    const { container: single } = render(
      <WeatherHourlyBreakdown hours={[{ hour_index: 0, temperature_c: 20 }]} />,
    )
    expect(single).toBeEmptyDOMElement()
  })

  it('renders an hour chip per reading, ordered by hour_index', () => {
    render(
      <WeatherHourlyBreakdown
        hours={[
          { hour_index: 1, temperature_c: 25, weather_code: 61 },
          { hour_index: 0, temperature_c: 10, weather_code: 0 },
        ]}
      />,
    )

    expect(screen.getByTestId('weather-hourly-breakdown')).toBeInTheDocument()
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText('+1h')).toBeInTheDocument()
    // 10C -> 50F, 25C -> 77F
    expect(screen.getByText('50°F')).toBeInTheDocument()
    expect(screen.getByText('77°F')).toBeInTheDocument()
    expect(screen.getByText('Clear sky')).toHaveClass('sr-only')
    expect(screen.getByText('Slight rain')).toHaveClass('sr-only')
  })

  it('shows the temperature range across the hours', () => {
    render(
      <WeatherHourlyBreakdown
        hours={[
          { hour_index: 0, temperature_c: 10 },
          { hour_index: 1, temperature_c: 25 },
        ]}
      />,
    )

    expect(screen.getByText('50°F – 77°F')).toBeInTheDocument()
  })

  it('flags provisional hours', () => {
    render(
      <WeatherHourlyBreakdown
        hours={[
          { hour_index: 0, temperature_c: 10, is_provisional: false },
          { hour_index: 1, temperature_c: 12, is_provisional: true },
        ]}
      />,
    )

    expect(screen.getByText(/preliminary forecast data/i)).toBeInTheDocument()
  })

  it('does not flag provisional when all hours are finalized', () => {
    render(
      <WeatherHourlyBreakdown
        hours={[
          { hour_index: 0, temperature_c: 10, is_provisional: false },
          { hour_index: 1, temperature_c: 12, is_provisional: false },
        ]}
      />,
    )

    expect(
      screen.queryByText(/preliminary forecast data/i),
    ).not.toBeInTheDocument()
  })
})

import {
  WEATHER_ICONS,
  fmtTemp,
  temperatureRangeF,
  weatherIconKind,
} from './WeatherPanel.helpers'

export interface WeatherHourlyPoint {
  hour_index: number
  temperature_c?: number | null
  weather_code?: number | null
  is_provisional?: boolean | null
}

interface WeatherHourlyBreakdownProps {
  hours: WeatherHourlyPoint[] | null | undefined
}

function hourLabel(hourIndex: number): string {
  return hourIndex === 0 ? 'Start' : `+${hourIndex}h`
}

/**
 * Route-sampled, hour-by-hour weather strip for multi-hour activities.
 *
 * A single-hour activity's weather is already fully represented by
 * WeatherPanel's summary card, so this renders nothing unless there are at
 * least two hours to compare — the whole point is showing how conditions
 * changed over the course of the activity (and across the route, since
 * each hour is sampled at wherever the athlete actually was).
 */
export function WeatherHourlyBreakdown({
  hours,
}: Readonly<WeatherHourlyBreakdownProps>) {
  if (!hours || hours.length < 2) {
    return null
  }

  const sorted = [...hours].sort((a, b) => a.hour_index - b.hour_index)
  const range = temperatureRangeF(sorted.map((h) => h.temperature_c))
  const anyProvisional = sorted.some((h) => h.is_provisional)

  return (
    <div className="space-y-2" data-testid="weather-hourly-breakdown">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Over the activity
        </span>
        {range && (
          <span className="text-xs text-muted-foreground">
            {range.minF}°F – {range.maxF}°F
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {sorted.map((hour) => {
          const Icon = WEATHER_ICONS[weatherIconKind(hour.weather_code)]
          return (
            <div
              key={hour.hour_index}
              className="flex flex-col items-center gap-1 shrink-0 min-w-14"
            >
              <span className="text-[11px] text-muted-foreground">
                {hourLabel(hour.hour_index)}
              </span>
              <Icon
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-sm font-medium tracking-tight">
                {fmtTemp(hour.temperature_c)}
              </span>
            </div>
          )
        })}
      </div>

      {anyProvisional && (
        <p className="text-[11px] text-muted-foreground italic">
          Some hours are preliminary forecast data pending ERA5 archive
          settlement.
        </p>
      )}
    </div>
  )
}

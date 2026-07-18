import { Loader2, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { kmhToMph, mmToInches } from '@/lib/units'
import {
  WEATHER_ICONS,
  describeWeatherCode,
  fmtTemp,
  weatherIconKind,
} from './WeatherPanel.helpers'
import {
  WeatherHourlyBreakdown,
  type WeatherHourlyPoint,
} from './WeatherHourlyBreakdown'

export interface WeatherPanelData {
  temperature_c?: number | null
  apparent_temperature_c?: number | null
  relative_humidity_pct?: number | null
  precipitation_mm?: number | null
  cloud_cover_pct?: number | null
  wind_speed_kmh?: number | null
  wind_gusts_kmh?: number | null
  weather_code?: number | null
  is_provisional?: boolean | null
}

interface WeatherPanelProps {
  weather: WeatherPanelData | null | undefined
  loading?: boolean
  error?: string | null
  hourly?: WeatherHourlyPoint[] | null
}

function fmtWind(kmh: number | null | undefined): string {
  return kmh != null ? `${Math.round(kmhToMph(kmh))} mph` : '—'
}

function fmtPrecip(mm: number | null | undefined): string {
  if (mm == null) return '—'
  const inches = mmToInches(mm)
  return inches < 0.01 ? '0 in' : `${inches.toFixed(2)} in`
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}

export function WeatherPanel({
  weather,
  loading,
  error,
  hourly,
}: Readonly<WeatherPanelProps>) {
  return (
    <Card data-testid="weather-panel">
      <CardHeader>
        <CardTitle className="text-base">Weather</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading weather...
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-muted-foreground py-4">
            Weather unavailable: {error}
          </p>
        )}
        {!loading && !error && !weather && (
          <p className="text-sm text-muted-foreground py-4">
            Weather hasn&apos;t been recorded for this activity yet.
          </p>
        )}
        {!loading && !error && weather && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon =
                  WEATHER_ICONS[weatherIconKind(weather.weather_code)]
                return (
                  <Icon
                    className="h-8 w-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                )
              })()}
              <div>
                <div className="text-2xl font-bold tracking-tight">
                  {fmtTemp(weather.temperature_c)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {describeWeatherCode(weather.weather_code)}
                  {weather.apparent_temperature_c != null &&
                    ` · Feels like ${fmtTemp(weather.apparent_temperature_c)}`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <Metric label="Wind" value={fmtWind(weather.wind_speed_kmh)} />
              <Metric
                label="Precip"
                value={fmtPrecip(weather.precipitation_mm)}
              />
              <Metric
                label="Humidity"
                value={
                  weather.relative_humidity_pct != null
                    ? `${Math.round(weather.relative_humidity_pct)}%`
                    : '—'
                }
              />
            </div>

            {weather.wind_gusts_kmh != null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                Gusts up to {fmtWind(weather.wind_gusts_kmh)}
              </div>
            )}

            <WeatherHourlyBreakdown hours={hourly} />

            {weather.is_provisional && (
              <p className="text-xs text-muted-foreground italic">
                Preliminary forecast data — will be refined once finalized
                weather records are available.
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              Weather data by{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Open-Meteo
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

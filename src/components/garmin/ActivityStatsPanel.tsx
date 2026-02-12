import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  kmToMi,
  kmhToMph,
  metersToFeet,
  celsiusToFahrenheit,
  formatDuration,
  formatPace,
} from '@/lib/units'

interface ActivityStatsPanelProps {
  activity: {
    distance_km?: number | null
    total_distance?: number | null
    duration_seconds?: number | null
    total_elapsed_time?: number | null
    total_timer_time?: number | null
    avg_speed_kmh?: number | null
    max_speed_kmh?: number | null
    avg_heart_rate?: number | null
    max_heart_rate?: number | null
    avg_cadence?: number | null
    max_cadence?: number | null
    total_ascent_m?: number | null
    total_descent_m?: number | null
    calories?: number | null
    avg_temperature_c?: number | null
    min_temperature_c?: number | null
    max_temperature_c?: number | null
    avg_pace?: number | null
  }
}

interface StatRow {
  label: string
  value: string
}

interface StatSection {
  title: string
  rows: StatRow[]
}

function fmt(
  val: number | null | undefined,
  decimals: number,
  unit: string,
): string {
  if (val == null) return '—'
  return `${val.toFixed(decimals)} ${unit}`
}

export function ActivityStatsPanel({ activity: a }: ActivityStatsPanelProps) {
  const sections: StatSection[] = [
    {
      title: 'Distance',
      rows: [
        {
          label: 'Total Distance',
          value:
            a.distance_km != null ? fmt(kmToMi(a.distance_km), 2, 'mi') : '—',
        },
        { label: 'Total Distance', value: fmt(a.distance_km, 2, 'km') },
      ],
    },
    {
      title: 'Timing',
      rows: [
        {
          label: 'Duration',
          value: formatDuration(a.duration_seconds ?? null),
        },
        {
          label: 'Elapsed Time',
          value: formatDuration(a.total_elapsed_time ?? null),
        },
        {
          label: 'Timer Time',
          value: formatDuration(a.total_timer_time ?? null),
        },
      ],
    },
    {
      title: 'Elevation',
      rows: [
        {
          label: 'Ascent',
          value:
            a.total_ascent_m != null
              ? fmt(metersToFeet(a.total_ascent_m), 0, 'ft')
              : '—',
        },
        {
          label: 'Descent',
          value:
            a.total_descent_m != null
              ? fmt(metersToFeet(a.total_descent_m), 0, 'ft')
              : '—',
        },
        { label: 'Ascent', value: fmt(a.total_ascent_m, 0, 'm') },
        { label: 'Descent', value: fmt(a.total_descent_m, 0, 'm') },
      ],
    },
    {
      title: 'Speed',
      rows: [
        {
          label: 'Avg Speed',
          value:
            a.avg_speed_kmh != null
              ? fmt(kmhToMph(a.avg_speed_kmh), 1, 'mph')
              : '—',
        },
        {
          label: 'Max Speed',
          value:
            a.max_speed_kmh != null
              ? fmt(kmhToMph(a.max_speed_kmh), 1, 'mph')
              : '—',
        },
        { label: 'Avg Pace', value: formatPace(a.avg_speed_kmh ?? null) },
        { label: 'Avg Speed', value: fmt(a.avg_speed_kmh, 1, 'km/h') },
        { label: 'Max Speed', value: fmt(a.max_speed_kmh, 1, 'km/h') },
      ],
    },
    {
      title: 'Heart Rate',
      rows: [
        {
          label: 'Avg Heart Rate',
          value: a.avg_heart_rate != null ? `${a.avg_heart_rate} bpm` : '—',
        },
        {
          label: 'Max Heart Rate',
          value: a.max_heart_rate != null ? `${a.max_heart_rate} bpm` : '—',
        },
      ],
    },
    {
      title: 'Cadence',
      rows: [
        {
          label: 'Avg Cadence',
          value: a.avg_cadence != null ? `${a.avg_cadence} rpm` : '—',
        },
        {
          label: 'Max Cadence',
          value: a.max_cadence != null ? `${a.max_cadence} rpm` : '—',
        },
      ],
    },
    {
      title: 'Temperature',
      rows: [
        {
          label: 'Avg Temperature',
          value:
            a.avg_temperature_c != null
              ? fmt(celsiusToFahrenheit(a.avg_temperature_c), 0, '°F')
              : '—',
        },
        {
          label: 'Min Temperature',
          value:
            a.min_temperature_c != null
              ? fmt(celsiusToFahrenheit(a.min_temperature_c), 0, '°F')
              : '—',
        },
        {
          label: 'Max Temperature',
          value:
            a.max_temperature_c != null
              ? fmt(celsiusToFahrenheit(a.max_temperature_c), 0, '°F')
              : '—',
        },
        {
          label: 'Avg Temperature',
          value:
            a.avg_temperature_c != null ? `${a.avg_temperature_c} °C` : '—',
        },
      ],
    },
    {
      title: 'Calories',
      rows: [
        {
          label: 'Total Calories',
          value: a.calories != null ? `${a.calories} kcal` : '—',
        },
      ],
    },
    {
      title: 'Training Effect',
      rows: [
        { label: 'Aerobic TE', value: '—' },
        { label: 'Anaerobic TE', value: '—' },
      ],
    },
    {
      title: 'Additional',
      rows: [
        { label: 'VO2 Max', value: '—' },
        { label: 'Exercise Load', value: '—' },
        { label: 'Sweat Loss', value: '—' },
      ],
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.rows.map((row, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

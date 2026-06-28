import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  kmToMi,
  kmhToMph,
  metersToFeet,
  celsiusToFahrenheit,
  formatDuration,
  formatPace,
} from '@/lib/units'
import type { ActivityChartTrackPoint } from './ActivityChartData'
import { ZONE_COLORS } from './heartRateZones'
import {
  buildHeartRateZoneSummaries,
  type HeartRateZoneSummary,
} from './heartRateZoneSummary'

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
    hr_available?: boolean | null
    min_heart_rate?: number | null
    aerobic_training_effect?: number | null
    anaerobic_training_effect?: number | null
    exercise_load?: number | null
    avg_respiration_rate?: number | null
    min_respiration_rate?: number | null
    max_respiration_rate?: number | null
    sweat_loss_ml?: number | null
    moderate_intensity_minutes?: number | null
    vigorous_intensity_minutes?: number | null
    total_intensity_minutes?: number | null
    paved_distance_km?: number | null
    unpaved_distance_km?: number | null
    avg_cadence?: number | null
    max_cadence?: number | null
    total_strokes?: number | null
    total_ascent_m?: number | null
    total_descent_m?: number | null
    calories?: number | null
    avg_temperature_c?: number | null
    min_temperature_c?: number | null
    max_temperature_c?: number | null
    avg_pace?: number | null
  }
  heartRateZonePoints?: ActivityChartTrackPoint[]
}

interface StatRow {
  label: string
  value: string
  badge?: string
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

function formatHeartRate(value: number | null | undefined): string {
  return isValidHeartRate(value) ? `${value} bpm` : '—'
}

function isValidHeartRate(value: number | null | undefined): value is number {
  return value != null && value > 0
}

function HeartRateZoneBreakdown({
  summaries,
}: {
  summaries: HeartRateZoneSummary[]
}) {
  const hasZoneTime = summaries.some((summary) => summary.seconds > 0)
  if (!hasZoneTime) return null

  return (
    <Card data-testid="heart-rate-zone-breakdown" className="lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Heart Rate Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaries.map((summary) => {
          const observedRange =
            summary.minHeartRate != null && summary.maxHeartRate != null
              ? summary.minHeartRate === summary.maxHeartRate
                ? `${summary.minHeartRate} bpm`
                : `${summary.minHeartRate} - ${summary.maxHeartRate} bpm`
              : null

          return (
            <div
              className="grid gap-2 text-sm sm:grid-cols-[minmax(10rem,16rem)_1fr_auto]"
              key={summary.zone}
            >
              <div>
                <span className="font-semibold">Zone {summary.zone}</span>
                {observedRange && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {observedRange}
                  </span>
                )}
              </div>
              <div
                aria-label={`Zone ${summary.zone}: ${formatDuration(summary.seconds)} (${summary.percent}%)`}
                className="h-6 overflow-hidden rounded-sm bg-muted"
                role="img"
              >
                <div
                  className="h-full"
                  style={{
                    backgroundColor: ZONE_COLORS[summary.zone],
                    width: `${summary.percent}%`,
                  }}
                />
              </div>
              <div className="flex min-w-24 justify-end gap-3 font-medium tabular-nums">
                <span>{formatDuration(summary.seconds)}</span>
                <span className="w-9 text-right text-muted-foreground">
                  {summary.percent}%
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function ActivityStatsPanel({
  activity: a,
  heartRateZonePoints = [],
}: ActivityStatsPanelProps) {
  const hasHeartRateSamples = heartRateZonePoints.some((point) =>
    isValidHeartRate(point.heart_rate),
  )
  const hrAvailable =
    a.hr_available === false
      ? false
      : isValidHeartRate(a.avg_heart_rate) ||
        isValidHeartRate(a.max_heart_rate) ||
        isValidHeartRate(a.min_heart_rate) ||
        hasHeartRateSamples
  const heartRateZoneSummaries = useMemo(
    () => (hrAvailable ? buildHeartRateZoneSummaries(heartRateZonePoints) : []),
    [heartRateZonePoints, hrAvailable],
  )

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
    ...(hrAvailable
      ? [
          {
            title: 'Heart Rate',
            rows: [
              {
                label: 'Avg Heart Rate',
                value: formatHeartRate(a.avg_heart_rate),
              },
              {
                label: 'Max Heart Rate',
                value: formatHeartRate(a.max_heart_rate),
              },
              {
                label: 'Min Heart Rate',
                value: formatHeartRate(a.min_heart_rate),
              },
            ],
          } satisfies StatSection,
        ]
      : []),
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
        {
          label: 'Total Strokes',
          value:
            a.total_strokes != null ? a.total_strokes.toLocaleString() : '—',
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
        {
          label: 'Est. Sweat Loss',
          value: a.sweat_loss_ml != null ? `${a.sweat_loss_ml} ml` : '—',
        },
      ],
    },
    ...(hrAvailable
      ? [
          {
            title: 'Training Effect',
            rows: [
              {
                label: 'Aerobic TE',
                value:
                  a.aerobic_training_effect != null
                    ? a.aerobic_training_effect.toFixed(1)
                    : '—',
              },
              {
                label: 'Anaerobic TE',
                value:
                  a.anaerobic_training_effect != null
                    ? a.anaerobic_training_effect.toFixed(1)
                    : '—',
              },
              {
                label: 'Exercise Load',
                value: a.exercise_load != null ? `${a.exercise_load}` : '—',
              },
            ],
          } satisfies StatSection,
          {
            title: 'Respiration',
            rows: [
              {
                label: 'Avg Respiration',
                value:
                  a.avg_respiration_rate != null
                    ? `${a.avg_respiration_rate} breaths/min`
                    : '—',
              },
              {
                label: 'Min Respiration',
                value:
                  a.min_respiration_rate != null
                    ? `${a.min_respiration_rate} breaths/min`
                    : '—',
              },
              {
                label: 'Max Respiration',
                value:
                  a.max_respiration_rate != null
                    ? `${a.max_respiration_rate} breaths/min`
                    : '—',
              },
            ],
          } satisfies StatSection,
          {
            title: 'Intensity Minutes',
            rows: [
              {
                label: 'Moderate',
                value:
                  a.moderate_intensity_minutes != null
                    ? `${a.moderate_intensity_minutes} min`
                    : '—',
              },
              {
                label: 'Vigorous',
                value:
                  a.vigorous_intensity_minutes != null
                    ? `${a.vigorous_intensity_minutes} min`
                    : '—',
                // Only show the x2 multiplier badge when a value is present.
                ...(a.vigorous_intensity_minutes != null
                  ? { badge: 'x2' }
                  : {}),
              },
              {
                label: 'Total',
                value: (() => {
                  // Garmin counts vigorous intensity minutes as 2x toward the
                  // total. Compute it from the components when both are present
                  // (self-consistent with the displayed values); otherwise fall
                  // back to the stored total.
                  if (
                    a.moderate_intensity_minutes != null &&
                    a.vigorous_intensity_minutes != null
                  ) {
                    return `${a.moderate_intensity_minutes + a.vigorous_intensity_minutes * 2} min`
                  }
                  return a.total_intensity_minutes != null
                    ? `${a.total_intensity_minutes} min`
                    : '—'
                })(),
              },
            ],
          } satisfies StatSection,
        ]
      : []),
    {
      title: 'Road Surface',
      rows: [
        {
          label: 'Paved',
          value:
            a.paved_distance_km != null
              ? `${kmToMi(a.paved_distance_km).toFixed(2)} mi`
              : '—',
        },
        {
          label: 'Unpaved',
          value:
            a.unpaved_distance_km != null
              ? `${kmToMi(a.unpaved_distance_km).toFixed(2)} mi`
              : '—',
        },
      ],
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hrAvailable && (
        <HeartRateZoneBreakdown summaries={heartRateZoneSummaries} />
      )}
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
                <span className="flex items-center gap-1.5 font-medium">
                  {row.value}
                  {row.badge && (
                    <span className="inline-flex items-center justify-center rounded-full bg-neutral-950/80 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {row.badge}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

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
import { cn } from '@/lib/utils'

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

// Convert then format, short-circuiting to an em dash for null/undefined so the
// converter never receives null.
function fmtConverted(
  val: number | null | undefined,
  convert: (v: number) => number,
  decimals: number,
  unit: string,
): string {
  return val == null ? '—' : fmt(convert(val), decimals, unit)
}

// Format a raw value with a trailing unit, or an em dash when absent.
function fmtUnit(val: number | null | undefined, unit: string): string {
  return val == null ? '—' : `${val} ${unit}`
}

// Format a count with locale grouping, or an em dash when absent.
function fmtCount(val: number | null | undefined): string {
  return val == null ? '—' : val.toLocaleString()
}

// Garmin counts vigorous intensity minutes as 2x toward the total. Compute it
// from the components when both are present (self-consistent with the displayed
// values); otherwise fall back to the stored total.
function formatTotalIntensityMinutes(
  moderate: number | null | undefined,
  vigorous: number | null | undefined,
  total: number | null | undefined,
): string {
  if (moderate != null && vigorous != null) {
    return `${moderate + vigorous * 2} min`
  }
  return fmtUnit(total, 'min')
}

function formatHeartRate(value: number | null | undefined): string {
  return isValidHeartRate(value) ? `${value} bpm` : '—'
}

function isValidHeartRate(value: number | null | undefined): value is number {
  return value != null && value > 0
}

function hasTrainingEffect(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value >= 0 && value <= 5
}

function formatTrainingEffect(value: number | null | undefined): string {
  return hasTrainingEffect(value) ? value.toFixed(1) : '—'
}

const TRAINING_EFFECT_SEGMENTS = [
  { start: 0, end: 1, className: 'bg-neutral-500' },
  { start: 1, end: 2, className: 'bg-neutral-500' },
  { start: 2, end: 3, className: 'bg-blue-400' },
  { start: 3, end: 4, className: 'bg-green-500' },
  { start: 4, end: 4.9, className: 'bg-orange-400' },
  { start: 4.9, end: 5, className: 'bg-red-500' },
]

function TrainingEffectGauge({
  label,
  value,
  markerClassName,
}: {
  label: string
  value: number | null | undefined
  markerClassName: string
}) {
  const safeValue = hasTrainingEffect(value) ? value : null
  const markerPosition = safeValue != null ? (safeValue / 5) * 100 : null

  return (
    <div
      className="grid items-center"
      data-testid={`training-effect-${label.toLowerCase()}`}
    >
      <div
        aria-label={`${label} training effect: ${formatTrainingEffect(value)}`}
        className="relative h-7"
        role="img"
      >
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 gap-1">
          {TRAINING_EFFECT_SEGMENTS.map((segment) => (
            <div
              className={cn('h-2.5 rounded-sm', segment.className)}
              key={`${segment.start}-${segment.end}`}
              style={{
                flexGrow: segment.end - segment.start,
              }}
            />
          ))}
        </div>
        {markerPosition != null && (
          <div
            className={cn(
              'absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-background shadow-[0_0_0_2px_rgba(0,0,0,0.55)]',
              markerClassName,
            )}
            data-testid={`training-effect-${label.toLowerCase()}-marker`}
            style={{ left: `${markerPosition}%` }}
          />
        )}
      </div>
    </div>
  )
}

function TrainingEffectGraphic({
  aerobic,
  anaerobic,
}: {
  aerobic: number | null | undefined
  anaerobic: number | null | undefined
}) {
  if (!hasTrainingEffect(aerobic) && !hasTrainingEffect(anaerobic)) {
    return null
  }

  return (
    <Card data-testid="training-effect-graphic" className="lg:col-span-3">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold">Training Effect</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="grid gap-3">
          <div className="border-t pt-2">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Aerobic
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatTrainingEffect(aerobic)}
              </div>
            </div>
          </div>
          <div className="border-t pt-2">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                Anaerobic
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatTrainingEffect(anaerobic)}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 pt-2">
          <TrainingEffectGauge
            label="Aerobic"
            markerClassName="bg-green-500"
            value={aerobic}
          />
          <TrainingEffectGauge
            label="Anaerobic"
            markerClassName="bg-blue-400"
            value={anaerobic}
          />
        </div>
      </CardContent>
    </Card>
  )
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

type ActivityStats = ActivityStatsPanelProps['activity']

// Build the ordered list of stat sections shown in the panel. HR-dependent
// sections are only included when heart-rate data is available.
function buildStatSections(
  a: ActivityStats,
  hrAvailable: boolean,
): StatSection[] {
  return [
    {
      title: 'Distance',
      rows: [
        {
          label: 'Total Distance',
          value: fmtConverted(a.distance_km, kmToMi, 2, 'mi'),
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
          value: fmtConverted(a.total_ascent_m, metersToFeet, 0, 'ft'),
        },
        {
          label: 'Descent',
          value: fmtConverted(a.total_descent_m, metersToFeet, 0, 'ft'),
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
          value: fmtConverted(a.avg_speed_kmh, kmhToMph, 1, 'mph'),
        },
        {
          label: 'Max Speed',
          value: fmtConverted(a.max_speed_kmh, kmhToMph, 1, 'mph'),
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
        { label: 'Avg Cadence', value: fmtUnit(a.avg_cadence, 'rpm') },
        { label: 'Max Cadence', value: fmtUnit(a.max_cadence, 'rpm') },
        { label: 'Total Strokes', value: fmtCount(a.total_strokes) },
      ],
    },
    {
      title: 'Temperature',
      rows: [
        {
          label: 'Avg Temperature',
          value: fmtConverted(
            a.avg_temperature_c,
            celsiusToFahrenheit,
            0,
            '°F',
          ),
        },
        {
          label: 'Min Temperature',
          value: fmtConverted(
            a.min_temperature_c,
            celsiusToFahrenheit,
            0,
            '°F',
          ),
        },
        {
          label: 'Max Temperature',
          value: fmtConverted(
            a.max_temperature_c,
            celsiusToFahrenheit,
            0,
            '°F',
          ),
        },
        {
          label: 'Avg Temperature',
          value: fmtUnit(a.avg_temperature_c, '°C'),
        },
      ],
    },
    {
      title: 'Calories',
      rows: [
        { label: 'Total Calories', value: fmtUnit(a.calories, 'kcal') },
        { label: 'Est. Sweat Loss', value: fmtUnit(a.sweat_loss_ml, 'ml') },
      ],
    },
    ...(hrAvailable && a.exercise_load != null
      ? [
          {
            title: 'Training Load',
            rows: [{ label: 'Exercise Load', value: `${a.exercise_load}` }],
          } satisfies StatSection,
        ]
      : []),
    ...(hrAvailable
      ? [
          {
            title: 'Respiration',
            rows: [
              {
                label: 'Avg Respiration',
                value: fmtUnit(a.avg_respiration_rate, 'breaths/min'),
              },
              {
                label: 'Min Respiration',
                value: fmtUnit(a.min_respiration_rate, 'breaths/min'),
              },
              {
                label: 'Max Respiration',
                value: fmtUnit(a.max_respiration_rate, 'breaths/min'),
              },
            ],
          } satisfies StatSection,
          {
            title: 'Intensity Minutes',
            rows: [
              {
                label: 'Moderate',
                value: fmtUnit(a.moderate_intensity_minutes, 'min'),
              },
              {
                label: 'Vigorous',
                value: fmtUnit(a.vigorous_intensity_minutes, 'min'),
                // Only show the x2 multiplier badge when a value is present.
                ...(a.vigorous_intensity_minutes != null
                  ? { badge: 'x2' }
                  : {}),
              },
              {
                label: 'Total',
                value: formatTotalIntensityMinutes(
                  a.moderate_intensity_minutes,
                  a.vigorous_intensity_minutes,
                  a.total_intensity_minutes,
                ),
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
          value: fmtConverted(a.paved_distance_km, kmToMi, 2, 'mi'),
        },
        {
          label: 'Unpaved',
          value: fmtConverted(a.unpaved_distance_km, kmToMi, 2, 'mi'),
        },
      ],
    },
  ]
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
  const hasAnyTrainingEffect =
    hasTrainingEffect(a.aerobic_training_effect) ||
    hasTrainingEffect(a.anaerobic_training_effect)

  const sections = buildStatSections(a, hrAvailable)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hrAvailable && (
        <HeartRateZoneBreakdown summaries={heartRateZoneSummaries} />
      )}
      {hrAvailable && hasAnyTrainingEffect && (
        <TrainingEffectGraphic
          aerobic={a.aerobic_training_effect}
          anaerobic={a.anaerobic_training_effect}
        />
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

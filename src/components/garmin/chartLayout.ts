/**
 * Shared layout constants for the Garmin activity charts.
 *
 * These are the single source of truth for the chart plot-area insets so that
 * overlays rendered outside the Recharts `<AreaChart>` (e.g. the heart-rate
 * zone ribbon) stay aligned with the plotted X axis. Keep the chart's
 * `<YAxis width>` and `margin.right` wired to these values to avoid drift.
 */
export const CHART_Y_AXIS_WIDTH = 50
export const CHART_MARGIN_RIGHT = 20

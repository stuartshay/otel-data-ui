import { buildSegmentPreviewPath } from './segmentPreviewPath'

interface SegmentMiniMapProps {
  startLat: number
  startLon: number
  endLat: number
  endLon: number
  label: string
}

export function SegmentMiniMap({
  startLat,
  startLon,
  endLat,
  endLon,
  label,
}: SegmentMiniMapProps) {
  const points = buildSegmentPreviewPath(startLat, startLon, endLat, endLon)
  const latitudes = points.map(([lat]) => lat)
  const longitudes = points.map(([, lon]) => lon)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const latRange = Math.max(maxLat - minLat, 0.000001)
  const lonRange = Math.max(maxLon - minLon, 0.000001)
  const padding = 14
  const width = 128
  const height = 112

  const svgPoints = points.map(([lat, lon]) => {
    const x = padding + ((lon - minLon) / lonRange) * (width - padding * 2)
    const y = padding + ((maxLat - lat) / latRange) * (height - padding * 2)
    return { x, y }
  })
  const pathData = svgPoints
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(' ')
  const startPoint = svgPoints[0]
  const endPoint = svgPoints[svgPoints.length - 1]

  return (
    <div
      aria-label={`${label} segment map`}
      className="h-24 w-28 shrink-0 overflow-hidden rounded-md border border-border/70 bg-slate-100 dark:bg-slate-900 sm:h-28 sm:w-32"
      data-testid="segment-mini-map"
      role="img"
    >
      <svg
        className="h-full w-full"
        data-testid="segment-mini-map-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        <rect
          width={width}
          height={height}
          fill="currentColor"
          opacity="0.04"
        />
        <path
          d="M18 26H110M18 56H110M18 86H110M36 14V98M70 14V98M102 14V98"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <path
          d="M16 74C36 58 48 64 68 48S96 34 112 24"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="7"
        />
        <path
          d={pathData}
          data-testid="segment-mini-map-path"
          fill="none"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {startPoint && (
          <circle
            cx={startPoint.x}
            cy={startPoint.y}
            fill="#22c55e"
            r="4"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        )}
        {endPoint && (
          <circle
            cx={endPoint.x}
            cy={endPoint.y}
            fill="#ef4444"
            r="4"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  )
}

import { addDays, format, isValid, parseISO, subDays } from 'date-fns'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Map as MapIcon,
  Route,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  useDailySummaryDateRangeQuery,
  useDailySummaryQuery,
  useUnifiedGpsLazyQuery,
  useUnifiedGpsQuery,
  type DailySummaryQuery,
  type UnifiedGpsQuery,
} from '@/__generated__/graphql'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatsCard } from '@/components/shared/StatsCard'
import { UnifiedGpsMap, type ColorBy } from '@/components/shared/UnifiedGpsMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toLocalDate } from '@/lib/date-range'
import { escapeCsvValue, triggerDownload } from '@/lib/export'

const PAGE_SIZE = 100
const EXPORT_LIMIT = 10000

type SourceFilter = 'owntracks' | 'garmin'
type SortOrder = 'asc' | 'desc'

function parseRouteDate(dateParam: string | undefined) {
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return undefined

  const parsed = parseISO(dateParam)
  return isValid(parsed) ? parsed : undefined
}

function parseSourceFilter(source: string | null): SourceFilter | undefined {
  if (source === 'owntracks' || source === 'garmin') return source
  return undefined
}

function parseSortOrder(value: string | null): SortOrder {
  return value === 'asc' ? 'asc' : 'desc'
}

function parseColorBy(value: string | null): ColorBy {
  if (value === 'speed' || value === 'heart_rate' || value === 'battery') {
    return value
  }
  return 'source'
}

function parseBoolParam(value: string | null): boolean {
  return value === '1' || value === 'true'
}

type UnifiedGpsItem = UnifiedGpsQuery['unifiedGps']['items'][number]
type DailySummaryItem = DailySummaryQuery['dailySummary']['items'][number]
type ExportFormat = 'csv' | 'geojson'

const CSV_HEADERS = [
  'source',
  'identifier',
  'latitude',
  'longitude',
  'timestamp',
  'battery',
  'speed_kmh',
  'heart_rate',
  'accuracy',
]

function buildDailyPointsCsv(items: UnifiedGpsItem[]): string {
  const rows = items.map((p) =>
    CSV_HEADERS.map((h) => escapeCsvValue((p as Record<string, unknown>)[h])),
  )
  return [CSV_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

function buildDailyPointsGeoJson(items: UnifiedGpsItem[]): string {
  const geojson = {
    type: 'FeatureCollection' as const,
    features: items.map((p) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        source: p.source,
        identifier: p.identifier,
        timestamp: p.timestamp,
        battery: p.battery ?? null,
        speed_kmh: p.speed_kmh ?? null,
        heart_rate: p.heart_rate ?? null,
        accuracy: p.accuracy ?? null,
      },
    })),
  }
  return JSON.stringify(geojson, null, 2)
}

function exportDailyPoints(
  formatType: ExportFormat,
  items: UnifiedGpsItem[],
  queryDate: string,
  sourceFilter: SourceFilter | undefined,
): void {
  const suffix = sourceFilter ? `-${sourceFilter}` : ''
  if (formatType === 'csv') {
    triggerDownload(
      buildDailyPointsCsv(items),
      'text/csv;charset=utf-8',
      `daily-summary-${queryDate}${suffix}.csv`,
    )
    return
  }
  triggerDownload(
    buildDailyPointsGeoJson(items),
    'application/geo+json',
    `daily-summary-${queryDate}${suffix}.geojson`,
  )
}

// Alt+Left / Alt+Right day navigation. Extracted to a hook so the page
// component stays focused on rendering.
function useDayKeyboardNavigation(
  prevDayIso: string | undefined,
  nextDayIso: string | undefined,
): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.key === 'ArrowLeft' && prevDayIso) {
        event.preventDefault()
        window.location.href = `/daily-summary/${prevDayIso}`
      } else if (event.key === 'ArrowRight' && nextDayIso) {
        event.preventDefault()
        window.location.href = `/daily-summary/${nextDayIso}`
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevDayIso, nextDayIso])
}

function DayNavButton({
  iso,
  direction,
}: Readonly<{
  iso: string | undefined
  direction: 'prev' | 'next'
}>) {
  const text = direction === 'prev' ? 'Previous Day' : 'Next Day'
  // Accessible name intentionally lower-cases "day" to match existing labels.
  const name = direction === 'prev' ? 'Previous day' : 'Next day'
  const arrowKey = direction === 'prev' ? 'Left' : 'Right'
  const icon =
    direction === 'prev' ? (
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
    ) : (
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    )
  const content =
    direction === 'prev' ? (
      <>
        {icon}
        {text}
      </>
    ) : (
      <>
        {text}
        {icon}
      </>
    )
  if (!iso) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        aria-label={name}
        title={`${name} unavailable`}
      >
        {content}
      </Button>
    )
  }
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      title={`${name} (Alt+${arrowKey})`}
    >
      <Link to={`/daily-summary/${iso}`} aria-label={name}>
        {content}
      </Link>
    </Button>
  )
}

function DayDetailHeader({
  routeDate,
  displayed,
  total,
  sourceFilter,
  ownTracksTotal,
  garminTotal,
  prevDayIso,
  nextDayIso,
}: Readonly<{
  routeDate: Date
  displayed: number
  total: number
  sourceFilter: SourceFilter | undefined
  ownTracksTotal: number
  garminTotal: number
  prevDayIso: string | undefined
  nextDayIso: string | undefined
}>) {
  const showBreakdown = !sourceFilter && (ownTracksTotal > 0 || garminTotal > 0)
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/daily-summary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Daily Summary
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {format(routeDate, 'MMMM d, yyyy')}
          </h1>
          <p className="text-muted-foreground">
            {displayed.toLocaleString()} of {total.toLocaleString()} GPS points
            {sourceFilter ? ` from ${sourceFilter}` : ''}
            {showBreakdown && (
              <>
                {' '}
                (OwnTracks: {ownTracksTotal.toLocaleString()}, Garmin:{' '}
                {garminTotal.toLocaleString()})
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DayNavButton iso={prevDayIso} direction="prev" />
        <DayNavButton iso={nextDayIso} direction="next" />
        <Badge className="bg-blue-500">OwnTracks</Badge>
        <Badge className="bg-red-500">Garmin</Badge>
      </div>
    </div>
  )
}

function DaySummaryStats({
  summary,
}: Readonly<{
  summary: DailySummaryItem | undefined
}>) {
  if (!summary) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Distance"
        value={
          summary.total_distance_km != null
            ? `${summary.total_distance_km.toFixed(2)} km`
            : '—'
        }
        description={
          summary.garmin_sport ? `Sport: ${summary.garmin_sport}` : undefined
        }
      />
      <StatsCard
        title="Avg Heart Rate"
        value={
          summary.avg_heart_rate != null ? `${summary.avg_heart_rate} bpm` : '—'
        }
      />
      <StatsCard
        title="Calories"
        value={summary.total_calories?.toLocaleString() ?? '—'}
      />
      <StatsCard
        title="Battery"
        value={
          summary.min_battery != null && summary.max_battery != null
            ? `${summary.min_battery}–${summary.max_battery}%`
            : '—'
        }
        description={
          summary.owntracks_device
            ? `Device: ${summary.owntracks_device}`
            : undefined
        }
      />
    </div>
  )
}

function DayFilterBar({
  sourceFilter,
  sortOrder,
  showTrack,
  colorBy,
  exportLoading,
  total,
  onSourceFilter,
  onSortOrder,
  onToggleTrack,
  onColorBy,
  onExport,
}: Readonly<{
  sourceFilter: SourceFilter | undefined
  sortOrder: SortOrder
  showTrack: boolean
  colorBy: ColorBy
  exportLoading: boolean
  total: number
  onSourceFilter: (source: SourceFilter | undefined) => void
  onSortOrder: (order: SortOrder) => void
  onToggleTrack: () => void
  onColorBy: (value: ColorBy) => void
  onExport: (formatType: ExportFormat) => void
}>) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filters &amp; display</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button
          variant={!sourceFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSourceFilter(undefined)}
          aria-current={!sourceFilter ? 'page' : undefined}
        >
          All
        </Button>
        <Button
          variant={sourceFilter === 'owntracks' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSourceFilter('owntracks')}
          aria-current={sourceFilter === 'owntracks' ? 'page' : undefined}
        >
          OwnTracks
        </Button>
        <Button
          variant={sourceFilter === 'garmin' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSourceFilter('garmin')}
          aria-current={sourceFilter === 'garmin' ? 'page' : undefined}
        >
          Garmin
        </Button>
        <div className="mx-2 hidden h-6 w-px bg-border sm:block" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          aria-label={`Sort by time ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
        >
          Order: {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
        </Button>
        <Button
          variant={showTrack ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleTrack}
          aria-pressed={showTrack}
        >
          <Route className="h-4 w-4" aria-hidden="true" />
          {showTrack ? 'Hide track' : 'Show track'}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Color by:</span>
          <Select
            value={colorBy}
            onValueChange={(value) => onColorBy(value as ColorBy)}
          >
            <SelectTrigger size="sm" aria-label="Color map markers by metric">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source">Source</SelectItem>
              <SelectItem value="speed">Speed</SelectItem>
              <SelectItem value="heart_rate">Heart rate</SelectItem>
              <SelectItem value="battery">Battery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
            disabled={exportLoading || total === 0}
            aria-label="Download points as CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('geojson')}
            disabled={exportLoading || total === 0}
            aria-label="Download points as GeoJSON"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            GeoJSON
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DayPointRow({
  point,
  index,
  focusKey,
  onFocus,
}: Readonly<{
  point: UnifiedGpsItem
  index: number
  focusKey: string | undefined
  onFocus: (key: string) => void
}>) {
  const rowKey = `${point.source}-${point.identifier}-${point.timestamp}-${index}`
  const isFocused = rowKey === focusKey
  return (
    <TableRow
      onClick={() => onFocus(rowKey)}
      data-state={isFocused ? 'selected' : undefined}
      className="cursor-pointer"
      aria-label={`Show ${point.source} point ${point.identifier} on map`}
    >
      <TableCell>
        <Badge variant={point.source === 'owntracks' ? 'default' : 'secondary'}>
          {point.source}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{point.identifier}</TableCell>
      <TableCell className="font-mono text-xs">
        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
      </TableCell>
      <TableCell>{point.battery != null ? `${point.battery}%` : '—'}</TableCell>
      <TableCell>
        {point.speed_kmh != null ? `${point.speed_kmh.toFixed(1)} km/h` : '—'}
      </TableCell>
      <TableCell>
        {point.heart_rate != null ? `${point.heart_rate} bpm` : '—'}
      </TableCell>
      <TableCell className="text-xs">
        {new Date(point.timestamp).toLocaleString()}
      </TableCell>
    </TableRow>
  )
}

function DayPointsSection({
  points,
  isPageOutOfRange,
  lastPage,
  hasFilter,
  focusKey,
  onFocus,
  onClearFilter,
  onResetPage,
}: Readonly<{
  points: ReadonlyArray<UnifiedGpsItem>
  isPageOutOfRange: boolean
  lastPage: number
  hasFilter: boolean
  focusKey: string | undefined
  onFocus: (key: string) => void
  onClearFilter: () => void
  onResetPage: () => void
}>) {
  if (isPageOutOfRange) {
    return (
      <div className="rounded-md border">
        <EmptyState
          title="Page out of range"
          message={`Only ${lastPage.toLocaleString()} page${lastPage === 1 ? '' : 's'} available for this day.`}
          onReset={onResetPage}
          resetLabel="Go to first page"
        />
      </div>
    )
  }
  if (points.length === 0) {
    return (
      <div className="rounded-md border">
        <EmptyState
          title="No points available"
          message={
            hasFilter
              ? 'No GPS points match the selected source filter for this day.'
              : 'No OwnTracks or Garmin GPS points were recorded for this day.'
          }
          onReset={hasFilter ? onClearFilter : undefined}
          resetLabel="Clear source filter"
        />
      </div>
    )
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Identifier</TableHead>
            <TableHead>Lat / Lon</TableHead>
            <TableHead>Battery</TableHead>
            <TableHead>Speed</TableHead>
            <TableHead>HR</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {points.map((point, index) => (
            <DayPointRow
              key={`${point.source}-${point.identifier}-${point.timestamp}-${index}`}
              point={point}
              index={index}
              focusKey={focusKey}
              onFocus={onFocus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function DayPagination({
  page,
  total,
  offset,
  isPageOutOfRange,
  onPageChange,
}: Readonly<{
  page: number
  total: number
  offset: number
  isPageOutOfRange: boolean
  onPageChange: (next: number) => void
}>) {
  if (total <= 0 || isPageOutOfRange) return null
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
        {total.toLocaleString()}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export function DailySummaryDetailPage() {
  const { date } = useParams<{ date: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '', 10)
  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage)
  const sourceFilter = parseSourceFilter(searchParams.get('source'))
  const sortOrder = parseSortOrder(searchParams.get('order'))
  const colorBy = parseColorBy(searchParams.get('color'))
  const showTrack = parseBoolParam(searchParams.get('track'))
  const offset = (page - 1) * PAGE_SIZE
  const routeDate = parseRouteDate(date)
  const queryDate = routeDate ? format(routeDate, 'yyyy-MM-dd') : ''

  const [focusKey, setFocusKey] = useState<string | undefined>(undefined)

  const { data, loading, error, refetch } = useUnifiedGpsQuery({
    variables: {
      source: sourceFilter,
      date_from: queryDate,
      date_to: queryDate,
      limit: PAGE_SIZE,
      offset,
      order: sortOrder,
    },
    skip: !routeDate,
  })

  // Fetch per-source totals for counts in header (independent of filter).
  const { data: ownTracksCountData } = useUnifiedGpsQuery({
    variables: {
      source: 'owntracks',
      date_from: queryDate,
      date_to: queryDate,
      limit: 1,
      offset: 0,
      order: 'desc',
    },
    skip: !routeDate,
  })
  const { data: garminCountData } = useUnifiedGpsQuery({
    variables: {
      source: 'garmin',
      date_from: queryDate,
      date_to: queryDate,
      limit: 1,
      offset: 0,
      order: 'desc',
    },
    skip: !routeDate,
  })

  // Per-day aggregated stats (reuses existing DailySummary query).
  const { data: daySummaryData } = useDailySummaryQuery({
    variables: {
      date_from: queryDate,
      date_to: queryDate,
      limit: 10,
      offset: 0,
    },
    skip: !routeDate,
  })

  const { data: dateRangeData } = useDailySummaryDateRangeQuery()
  const minDate = useMemo(
    () =>
      dateRangeData?.dailySummaryDateRange?.min_date
        ? toLocalDate(dateRangeData.dailySummaryDateRange.min_date)
        : undefined,
    [dateRangeData],
  )
  const maxDate = useMemo(
    () =>
      dateRangeData?.dailySummaryDateRange?.max_date
        ? toLocalDate(dateRangeData.dailySummaryDateRange.max_date)
        : undefined,
    [dateRangeData],
  )

  const [exportPoints, { loading: exportLoading }] = useUnifiedGpsLazyQuery()

  // Clamp out-of-range page when total is known.
  useEffect(() => {
    const total = data?.unifiedGps?.total
    if (total == null || total === 0) return
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (page > lastPage) {
      const params = new URLSearchParams(searchParams)
      if (lastPage <= 1) params.delete('page')
      else params.set('page', String(lastPage))
      setSearchParams(params, { replace: true })
    }
  }, [data?.unifiedGps?.total, page, searchParams, setSearchParams])

  // Day navigation via keyboard arrows (Alt + Left/Right) to avoid interfering
  // with other shortcuts.
  const prevDayIso = useMemo(() => {
    if (!routeDate) return undefined
    const prev = subDays(routeDate, 1)
    if (minDate && prev < minDate) return undefined
    return format(prev, 'yyyy-MM-dd')
  }, [routeDate, minDate])
  const nextDayIso = useMemo(() => {
    if (!routeDate) return undefined
    const next = addDays(routeDate, 1)
    if (maxDate && next > maxDate) return undefined
    return format(next, 'yyyy-MM-dd')
  }, [routeDate, maxDate])

  useDayKeyboardNavigation(prevDayIso, nextDayIso)

  const updateParams = useCallback(
    (mutator: (params: URLSearchParams) => void, resetPage = false) => {
      const params = new URLSearchParams(searchParams)
      mutator(params)
      if (resetPage) params.delete('page')
      setSearchParams(params)
    },
    [searchParams, setSearchParams],
  )

  const setSourceFilter = useCallback(
    (source: SourceFilter | undefined) => {
      updateParams((params) => {
        if (source) params.set('source', source)
        else params.delete('source')
      }, true)
    },
    [updateParams],
  )

  const setSortOrder = useCallback(
    (order: SortOrder) => {
      updateParams((params) => {
        if (order === 'asc') params.set('order', 'asc')
        else params.delete('order')
      }, true)
    },
    [updateParams],
  )

  const setColorBy = useCallback(
    (value: ColorBy) => {
      updateParams((params) => {
        if (value === 'source') params.delete('color')
        else params.set('color', value)
      })
    },
    [updateParams],
  )

  const toggleShowTrack = useCallback(() => {
    updateParams((params) => {
      if (showTrack) params.delete('track')
      else params.set('track', '1')
    })
  }, [updateParams, showTrack])

  const handleExport = useCallback(
    async (formatType: ExportFormat) => {
      if (!queryDate) return
      const result = await exportPoints({
        variables: {
          source: sourceFilter,
          date_from: queryDate,
          date_to: queryDate,
          limit: EXPORT_LIMIT,
          offset: 0,
          order: sortOrder,
        },
      })
      const items = result.data?.unifiedGps?.items ?? []
      exportDailyPoints(formatType, items, queryDate, sourceFilter)
    },
    [exportPoints, queryDate, sourceFilter, sortOrder],
  )

  const goToPage = useCallback(
    (next: number) => {
      updateParams((params) => {
        if (next <= 1) params.delete('page')
        else params.set('page', String(next))
      })
    },
    [updateParams],
  )

  const resetPageReplace = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete('page')
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  if (!routeDate) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/daily-summary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Daily Summary
          </Link>
        </Button>
        <ErrorState message="Select a valid daily summary date." />
      </div>
    )
  }

  if (loading && !data) return <LoadingState message="Loading day points..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const points = data?.unifiedGps?.items ?? []
  const total = data?.unifiedGps?.total ?? 0
  const displayed = points.length
  const hasFilter = sourceFilter != null
  const ownTracksTotal = ownTracksCountData?.unifiedGps?.total ?? 0
  const garminTotal = garminCountData?.unifiedGps?.total ?? 0
  const summaryForDay = daySummaryData?.dailySummary?.items?.[0]
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const isPageOutOfRange = total > 0 && points.length === 0 && page > lastPage

  return (
    <div className="space-y-6">
      <DayDetailHeader
        routeDate={routeDate}
        displayed={displayed}
        total={total}
        sourceFilter={sourceFilter}
        ownTracksTotal={ownTracksTotal}
        garminTotal={garminTotal}
        prevDayIso={prevDayIso}
        nextDayIso={nextDayIso}
      />

      <DaySummaryStats summary={summaryForDay} />

      <DayFilterBar
        sourceFilter={sourceFilter}
        sortOrder={sortOrder}
        showTrack={showTrack}
        colorBy={colorBy}
        exportLoading={exportLoading}
        total={total}
        onSourceFilter={setSourceFilter}
        onSortOrder={setSortOrder}
        onToggleTrack={toggleShowTrack}
        onColorBy={setColorBy}
        onExport={(formatType) => void handleExport(formatType)}
      />

      <div className="relative">
        <UnifiedGpsMap
          points={points}
          testId="daily-summary-map-container"
          className="h-[28rem]"
          showTrack={showTrack}
          colorBy={colorBy}
          focusKey={focusKey}
          onMarkerClick={(_, key) => setFocusKey(key)}
        />
        {loading && data && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end p-3"
            aria-hidden="true"
          >
            <Badge variant="secondary" className="animate-pulse">
              Updating…
            </Badge>
          </div>
        )}
      </div>

      <DayPointsSection
        points={points}
        isPageOutOfRange={isPageOutOfRange}
        lastPage={lastPage}
        hasFilter={hasFilter}
        focusKey={focusKey}
        onFocus={setFocusKey}
        onClearFilter={() => setSourceFilter(undefined)}
        onResetPage={resetPageReplace}
      />

      <DayPagination
        page={page}
        total={total}
        offset={offset}
        isPageOutOfRange={isPageOutOfRange}
        onPageChange={goToPage}
      />

      {(total > 0 || summaryForDay) && (
        <div className="flex items-center justify-between">
          <MapIcon
            className="hidden h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">
            Tip: click a table row to highlight its marker. Use Alt+Left /
            Alt+Right to move between days.
          </p>
        </div>
      )}
    </div>
  )
}

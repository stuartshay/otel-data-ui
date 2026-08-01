import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import {
  useGarminSegmentQuery,
  useGarminSegmentEffortsQuery,
  useGarminChartDataQuery,
  useGarminDateRangeQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentStartEndMap } from '@/components/garmin/SegmentStartEndMap'
import { SegmentElevationProfile } from '@/components/garmin/SegmentElevationProfile'
import {
  buildSegmentElevationProfile,
  type SegmentElevationChartPoint,
} from '@/components/garmin/SegmentElevationProfile.helpers'
import { SegmentPointAddress } from '@/components/garmin/SegmentPointAddress'
import { useReverseGeocodedRouteAddresses } from '@/components/garmin/useReverseGeocodedRouteAddresses'
import { SegmentEffortsLeaderboard } from '@/components/garmin/SegmentEffortsLeaderboard'
import { DeleteSegmentButton } from '@/components/garmin/DeleteSegmentButton'
import {
  formatDistanceMi,
  formatTolerance,
  type SegmentEffort,
} from '@/components/garmin/segmentEfforts'
import { getSegmentRoutePoints } from '@/components/garmin/segmentRoute'
import { setNRCustomAttribute } from '@/lib/newrelic-browser'
import { parseDateRangeParams, toLocalDate } from '@/lib/date-range'

// 500 is the otel-data-api's max; an activity that laps a loop segment
// several times now yields one effort per lap instead of just its fastest,
// so a popular segment can have well over 100 total efforts.
const EFFORTS_LIMIT = 500

interface ActiveElevationSelection {
  segmentId: string | undefined
  point: SegmentElevationChartPoint
}

export function GarminSegmentDetailPage() {
  const { segmentId } = useParams<{ segmentId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const id = Number(segmentId)
  const validId = Number.isInteger(id) && id > 0
  const [activeElevationSelection, setActiveElevationSelection] =
    useState<ActiveElevationSelection | null>(null)
  const activeElevationPoint =
    activeElevationSelection != null &&
    activeElevationSelection.segmentId === segmentId
      ? activeElevationSelection.point
      : null
  const handleActiveElevationPointChange = useCallback(
    (point: SegmentElevationChartPoint | null) => {
      setActiveElevationSelection(point ? { segmentId, point } : null)
    },
    [segmentId],
  )

  useEffect(() => {
    setNRCustomAttribute('garmin.flow', true)
  }, [])

  const {
    data: segmentData,
    loading: segmentLoading,
    error: segmentError,
    refetch: refetchSegment,
  } = useGarminSegmentQuery({ variables: { id }, skip: !validId })

  const dateFromParam = searchParams.get('date_from')
  const dateToParam = searchParams.get('date_to')
  const { data: dateRangeData } = useGarminDateRangeQuery()
  const DATA_MIN_DATE = dateRangeData?.garminDateRange?.min_date
    ? toLocalDate(dateRangeData.garminDateRange.min_date)
    : undefined
  const DATA_MAX_DATE = dateRangeData?.garminDateRange?.max_date
    ? toLocalDate(dateRangeData.garminDateRange.max_date)
    : new Date()
  const {
    dateFrom,
    dateTo,
    dateFromParam: dateFromStr,
    dateToParam: dateToStr,
  } = parseDateRangeParams(dateFromParam, dateToParam, {
    minDate: DATA_MIN_DATE,
    maxDate: DATA_MAX_DATE,
  })

  const {
    data: effortsData,
    loading: effortsLoading,
    error: effortsError,
    refetch: refetchEfforts,
  } = useGarminSegmentEffortsQuery({
    variables: {
      id,
      limit: EFFORTS_LIMIT,
      date_from: dateFromStr,
      date_to: dateToStr,
    },
    skip: !validId,
  })

  const segment = segmentData?.garminSegment

  const { data: sourceTrackData, loading: sourceTrackLoading } =
    useGarminChartDataQuery({
      variables: { activity_id: segment?.source_activity_id ?? '' },
      skip: !segment?.source_activity_id,
      fetchPolicy: 'no-cache',
    })

  const efforts = (effortsData?.garminSegmentEfforts?.items ??
    []) as SegmentEffort[]
  const total = effortsData?.garminSegmentEfforts?.total ?? 0
  const routePoints = useMemo(
    () =>
      segment
        ? getSegmentRoutePoints(
            sourceTrackData?.garminChartData ?? [],
            { lat: segment.start_latitude, lon: segment.start_longitude },
            { lat: segment.end_latitude, lon: segment.end_longitude },
          )
        : [],
    [segment, sourceTrackData?.garminChartData],
  )
  useReverseGeocodedRouteAddresses(routePoints)
  const activeLatLng =
    activeElevationPoint?.latitude != null &&
    Number.isFinite(activeElevationPoint.latitude) &&
    activeElevationPoint.longitude != null &&
    Number.isFinite(activeElevationPoint.longitude)
      ? {
          lat: activeElevationPoint.latitude,
          lng: activeElevationPoint.longitude,
        }
      : null
  // Build once and share with SegmentElevationProfile; the page also needs the
  // total distance to normalize the active point for the live speed/HR cells.
  const elevationProfile = useMemo(
    () => buildSegmentElevationProfile(routePoints),
    [routePoints],
  )
  const activeFraction =
    activeElevationPoint != null &&
    elevationProfile != null &&
    elevationProfile.distanceMiles > 0
      ? Math.min(
          Math.max(
            activeElevationPoint.distanceMiles / elevationProfile.distanceMiles,
            0,
          ),
          1,
        )
      : null

  const backLink = (
    <Link
      to="/garmin/segments"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to segments
    </Link>
  )

  if (!validId) {
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorState message="Invalid segment id." />
      </div>
    )
  }

  if (segmentLoading && !segmentData) {
    return (
      <div className="space-y-6">
        {backLink}
        <LoadingState message="Loading segment..." />
      </div>
    )
  }

  if (segmentError) {
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorState
          message={segmentError.message}
          onRetry={() => refetchSegment()}
        />
      </div>
    )
  }

  if (!segment) {
    return (
      <div className="space-y-6">
        {backLink}
        <EmptyState
          title="Segment not found"
          message="This segment does not exist or may have been deleted."
        />
      </div>
    )
  }

  const addressLatLng = activeLatLng ?? {
    lat: segment.start_latitude,
    lng: segment.start_longitude,
  }

  let effortsStatusNode: ReactNode = null
  if (effortsLoading && !effortsData) {
    effortsStatusNode = <LoadingState message="Loading efforts..." />
  } else if (effortsError) {
    effortsStatusNode = (
      <ErrorState
        message={effortsError.message}
        onRetry={() => refetchEfforts()}
      />
    )
  } else if (efforts.length === 0) {
    effortsStatusNode = (
      <EmptyState
        title="No efforts yet"
        message={
          dateFromStr || dateToStr
            ? 'No efforts match the selected date range. Try a different range.'
            : "No activities have traversed this segment's corridor."
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{segment.name}</h1>
          <p className="text-muted-foreground">
            {total.toLocaleString()} matching effort{total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {segment.sport && <Badge variant="secondary">{segment.sport}</Badge>}
          <DeleteSegmentButton
            segmentId={segment.id}
            segmentName={segment.name}
            onDeleted={() => navigate('/garmin/segments')}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Segment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SegmentStartEndMap
              startLat={segment.start_latitude}
              startLon={segment.start_longitude}
              endLat={segment.end_latitude}
              endLon={segment.end_longitude}
              routePoints={routePoints}
              activeLatLng={activeLatLng}
            />
            <SegmentPointAddress
              latitude={addressLatLng.lat}
              longitude={addressLatLng.lng}
              selected={activeLatLng != null}
            />
            <SegmentElevationProfile
              routePoints={routePoints}
              precomputedProfile={elevationProfile}
              loading={sourceTrackLoading}
              onActivePointChange={handleActiveElevationPointChange}
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Distance</dt>
              <dd className="text-right tabular-nums">
                {formatDistanceMi(
                  segment.distance_meters != null
                    ? segment.distance_meters / 1000
                    : null,
                )}
              </dd>
              <dt className="text-muted-foreground">Match tolerance</dt>
              <dd className="text-right tabular-nums">
                {formatTolerance(segment.match_tolerance_meters)}
              </dd>
              {segment.source_activity_id && (
                <>
                  <dt className="text-muted-foreground">Source activity</dt>
                  <dd className="text-right">
                    <Link
                      to={`/garmin/${segment.source_activity_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Effort leaderboard</CardTitle>
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              minDate={DATA_MIN_DATE}
              maxDate={DATA_MAX_DATE}
              onRangeChange={(from, to) => {
                const params = new URLSearchParams(searchParams)
                if (from)
                  params.set('date_from', formatDate(from, 'yyyy-MM-dd'))
                else params.delete('date_from')
                if (to) params.set('date_to', formatDate(to, 'yyyy-MM-dd'))
                else params.delete('date_to')
                setSearchParams(params)
              }}
            />
          </CardHeader>
          <CardContent>
            {effortsStatusNode ?? (
              <SegmentEffortsLeaderboard
                efforts={efforts}
                segmentId={id}
                activeFraction={activeFraction}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

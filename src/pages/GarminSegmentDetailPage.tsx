import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useGarminSegmentQuery,
  useGarminSegmentEffortsQuery,
  useGarminChartDataQuery,
} from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentStartEndMap } from '@/components/garmin/SegmentStartEndMap'
import { SegmentEffortsLeaderboard } from '@/components/garmin/SegmentEffortsLeaderboard'
import { DeleteSegmentButton } from '@/components/garmin/DeleteSegmentButton'
import {
  formatDistanceMi,
  formatTolerance,
  type SegmentEffort,
} from '@/components/garmin/segmentEfforts'
import { getSegmentRoutePoints } from '@/components/garmin/segmentRoute'
import { setNRCustomAttribute } from '@/lib/newrelic-browser'

const EFFORTS_LIMIT = 100

export function GarminSegmentDetailPage() {
  const { segmentId } = useParams<{ segmentId: string }>()
  const navigate = useNavigate()
  const id = Number(segmentId)
  const validId = Number.isInteger(id) && id > 0

  useEffect(() => {
    setNRCustomAttribute('garmin.flow', true)
  }, [])

  const {
    data: segmentData,
    loading: segmentLoading,
    error: segmentError,
    refetch: refetchSegment,
  } = useGarminSegmentQuery({ variables: { id }, skip: !validId })

  const {
    data: effortsData,
    loading: effortsLoading,
    error: effortsError,
    refetch: refetchEfforts,
  } = useGarminSegmentEffortsQuery({
    variables: { id, limit: EFFORTS_LIMIT },
    skip: !validId,
  })

  const segment = segmentData?.garminSegment

  const { data: sourceTrackData } = useGarminChartDataQuery({
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
          <CardHeader>
            <CardTitle>Effort leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {effortsLoading && !effortsData ? (
              <LoadingState message="Loading efforts..." />
            ) : effortsError ? (
              <ErrorState
                message={effortsError.message}
                onRetry={() => refetchEfforts()}
              />
            ) : efforts.length === 0 ? (
              <EmptyState
                title="No efforts yet"
                message="No activities have traversed this segment's corridor."
              />
            ) : (
              <SegmentEffortsLeaderboard efforts={efforts} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

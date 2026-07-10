import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Route } from 'lucide-react'
import { useGarminSegmentsQuery } from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SegmentMiniMap } from '@/components/garmin/SegmentMiniMap'
import {
  formatDistanceMi,
  formatEffortDate,
  formatTolerance,
} from '@/components/garmin/segmentEfforts'
import { setNRCustomAttribute } from '@/lib/newrelic-browser'

export function GarminSegmentsPage() {
  useEffect(() => {
    setNRCustomAttribute('garmin.flow', true)
  }, [])

  const { data, loading, error, refetch } = useGarminSegmentsQuery()
  const segments = data?.garminSegments ?? []

  let statusNode: ReactNode = null
  if (loading && !data) {
    statusNode = <LoadingState message="Loading segments..." />
  } else if (error) {
    statusNode = (
      <ErrorState message={error.message} onRetry={() => refetch()} />
    )
  } else if (segments.length === 0) {
    statusNode = (
      <EmptyState
        title="No saved segments"
        message="Saved segments will appear here. Creating a segment from an activity lap or climb is coming soon."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saved Segments</h1>
        <p className="text-muted-foreground">
          Named routes for comparing efforts across all matching activities
        </p>
      </div>

      {statusNode ?? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Link
              key={segment.id}
              to={`/garmin/segments/${segment.id}`}
              className="block"
              data-testid="segment-card"
            >
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="flex h-full gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Route className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-semibold">
                          {segment.name}
                        </span>
                      </div>
                      {segment.sport && (
                        <Badge variant="secondary">{segment.sport}</Badge>
                      )}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Distance</dt>
                      <dd className="text-right tabular-nums">
                        {formatDistanceMi(
                          segment.distance_meters != null
                            ? segment.distance_meters / 1000
                            : null,
                        )}
                      </dd>
                      <dt className="text-muted-foreground">Tolerance</dt>
                      <dd className="text-right tabular-nums">
                        {formatTolerance(segment.match_tolerance_meters)}
                      </dd>
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="text-right tabular-nums">
                        {formatEffortDate(segment.created_at)}
                      </dd>
                    </dl>
                  </div>
                  <SegmentMiniMap
                    startLat={segment.start_latitude}
                    startLon={segment.start_longitude}
                    endLat={segment.end_latitude}
                    endLon={segment.end_longitude}
                    label={segment.name}
                    route={segment.route}
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

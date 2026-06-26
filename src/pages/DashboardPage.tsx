import { useEffect, useMemo, useState } from 'react'
import {
  GarminActivitiesDocument,
  type GarminActivitiesQuery,
  type GarminActivitiesQueryVariables,
  useHealthQuery,
  useLocationCountQuery,
  useGarminActivitiesQuery,
  useGarminSportsQuery,
} from '@/__generated__/graphql'
import { useApolloClient } from '@apollo/client/react'
import { MapPin, Activity, Heart } from 'lucide-react'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GarminSyncCard } from '@/components/dashboard/GarminSyncCard'
import { GarminActivityHeatmap } from '@/components/dashboard/GarminActivityHeatmap'
import { GarminActivityTotals } from '@/components/dashboard/GarminActivityTotals'
import { CyclingInFocus } from '@/components/dashboard/CyclingInFocus'

const GARMIN_ACTIVITY_PAGE_SIZE = 1000
const MANUAL_DEVICE_LABEL = 'Manual'

type GarminActivityRow =
  GarminActivitiesQuery['garminActivities']['items'][number]

function getActivityDeviceLabel(activity: GarminActivityRow): string {
  return activity.device?.model?.trim() || MANUAL_DEVICE_LABEL
}

export function DashboardPage() {
  const apolloClient = useApolloClient()
  const { data: healthData, loading: healthLoading } = useHealthQuery()
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useLocationCountQuery()
  const { data: sportsData, loading: sportsLoading } = useGarminSportsQuery()
  const { data: deviceActivityData } = useGarminActivitiesQuery({
    variables: {
      limit: GARMIN_ACTIVITY_PAGE_SIZE,
      offset: 0,
      sort: 'start_time',
      order: 'desc',
    },
  })
  const [extraDeviceActivities, setExtraDeviceActivities] = useState<{
    total: number
    items: GarminActivityRow[]
  } | null>(null)

  useEffect(() => {
    const firstPage = deviceActivityData?.garminActivities
    if (!firstPage || firstPage.total <= firstPage.items.length) {
      return
    }

    let cancelled = false
    const fetchRemainingActivities = async () => {
      const offsets: number[] = []
      for (
        let offset = GARMIN_ACTIVITY_PAGE_SIZE;
        offset < firstPage.total;
        offset += GARMIN_ACTIVITY_PAGE_SIZE
      ) {
        offsets.push(offset)
      }

      const results = await Promise.all(
        offsets.map((offset) =>
          apolloClient.query<
            GarminActivitiesQuery,
            GarminActivitiesQueryVariables
          >({
            query: GarminActivitiesDocument,
            variables: {
              limit: GARMIN_ACTIVITY_PAGE_SIZE,
              offset,
              sort: 'start_time',
              order: 'desc',
            },
            fetchPolicy: 'cache-first',
          }),
        ),
      )

      if (cancelled) return
      setExtraDeviceActivities({
        total: firstPage.total,
        items: results.flatMap(
          (result) => result.data?.garminActivities.items ?? [],
        ),
      })
    }

    void fetchRemainingActivities()

    return () => {
      cancelled = true
    }
  }, [apolloClient, deviceActivityData])

  const deviceMetrics = useMemo(() => {
    const firstPage = deviceActivityData?.garminActivities
    const needsExtraPages =
      firstPage && firstPage.total > firstPage.items.length
    const extraActivities =
      firstPage && extraDeviceActivities?.total === firstPage.total
        ? extraDeviceActivities.items
        : []
    if (needsExtraPages && extraActivities.length === 0) {
      return []
    }
    const activities = [...(firstPage?.items ?? []), ...extraActivities]
    const counts = new Map<string, number>()

    activities.forEach((activity) => {
      const label = getActivityDeviceLabel(activity)
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => {
        if (a.label === MANUAL_DEVICE_LABEL) return 1
        if (b.label === MANUAL_DEVICE_LABEL) return -1
        return b.count - a.count || a.label.localeCompare(b.label)
      })
  }, [deviceActivityData, extraDeviceActivities])

  if (countLoading && sportsLoading && healthLoading) {
    return <LoadingState message="Loading dashboard..." />
  }

  if (countError) {
    return (
      <ErrorState message={countError.message} onRetry={() => refetchCount()} />
    )
  }

  const totalLocations = countData?.locationCount?.count ?? 0
  const totalSports = sportsData?.garminSports?.length ?? 0
  const totalActivities =
    sportsData?.garminSports?.reduce(
      (sum: number, s: { activity_count: number }) => sum + s.activity_count,
      0,
    ) ?? 0
  const physicalDeviceMetrics = deviceMetrics.filter(
    (metric) => metric.label !== MANUAL_DEVICE_LABEL,
  )
  const manualDeviceMetric = deviceMetrics.find(
    (metric) => metric.label === MANUAL_DEVICE_LABEL,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your location and activity data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Locations"
          value={totalLocations.toLocaleString()}
          icon={<MapPin className="h-4 w-4" />}
          description="OwnTracks GPS points"
        />
        <StatsCard
          title="Garmin Activities"
          value={totalActivities}
          icon={<Activity className="h-4 w-4" />}
          description={`Across ${totalSports} sports`}
        />
        <StatsCard
          title="API Status"
          value={healthData?.health?.status ?? 'unknown'}
          icon={<Heart className="h-4 w-4" />}
          description={`v${healthData?.health?.version ?? '?'}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CyclingInFocus />

        <Card data-testid="garmin-sports-card">
          <CardHeader>
            <CardTitle>Garmin Sports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sportsData?.garminSports?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sports
                </p>
                {sportsData.garminSports.map(
                  (s: { sport: string; activity_count: number }) => (
                    <div
                      key={s.sport}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">{s.sport}</span>
                      <Badge variant="outline">{s.activity_count}</Badge>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activities found
              </p>
            )}
            {deviceMetrics.length ? (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Devices
                </p>
                {physicalDeviceMetrics.map((device) => (
                  <div
                    key={device.label}
                    data-testid="garmin-device-row"
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-sm">{device.label}</span>
                    <Badge variant="outline">{device.count}</Badge>
                  </div>
                ))}
                {manualDeviceMetric ? (
                  <div
                    data-testid="garmin-manual-row"
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-sm">
                      {manualDeviceMetric.label}
                    </span>
                    <Badge variant="outline">{manualDeviceMetric.count}</Badge>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <GarminSyncCard />
      </div>

      <GarminActivityHeatmap />

      <GarminActivityTotals />
    </div>
  )
}

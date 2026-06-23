import {
  useHealthQuery,
  useLocationCountQuery,
  useDevicesQuery,
  useGarminSportsQuery,
} from '@/__generated__/graphql'
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

export function DashboardPage() {
  const { data: healthData, loading: healthLoading } = useHealthQuery()
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useLocationCountQuery()
  const { loading: devicesLoading } = useDevicesQuery()
  const { data: sportsData, loading: sportsLoading } = useGarminSportsQuery()

  if (countLoading && devicesLoading && sportsLoading && healthLoading) {
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

        <Card>
          <CardHeader>
            <CardTitle>Garmin Sports</CardTitle>
          </CardHeader>
          <CardContent>
            {sportsData?.garminSports?.length ? (
              <div className="space-y-2">
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
          </CardContent>
        </Card>

        <GarminSyncCard />
      </div>

      <GarminActivityHeatmap />

      <GarminActivityTotals />
    </div>
  )
}

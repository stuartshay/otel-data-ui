import { useParams, Link } from 'react-router-dom'
import { useLocationDetailQuery } from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function LocationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, refetch } = useLocationDetailQuery({
    variables: { id: Number(id) },
    skip: !id,
  })

  if (loading) return <LoadingState message="Loading location..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const loc = data?.location
  if (!loc) return <ErrorState message="Location not found" />

  const fields = [
    { label: 'Device', value: loc.device_id },
    { label: 'TID', value: loc.tid },
    { label: 'Latitude', value: loc.latitude },
    { label: 'Longitude', value: loc.longitude },
    {
      label: 'Accuracy',
      value: loc.accuracy != null ? `${loc.accuracy}m` : null,
    },
    {
      label: 'Altitude',
      value: loc.altitude != null ? `${loc.altitude}m` : null,
    },
    {
      label: 'Velocity',
      value: loc.velocity != null ? `${loc.velocity} km/h` : null,
    },
    { label: 'Battery', value: loc.battery != null ? `${loc.battery}%` : null },
    { label: 'Connection', value: loc.connection_type },
    { label: 'Trigger', value: loc.trigger },
    { label: 'Timestamp', value: new Date(loc.timestamp).toLocaleString() },
    {
      label: 'Created',
      value: loc.created_at ? new Date(loc.created_at).toLocaleString() : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/locations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Location #{loc.id}
          </h1>
          <Badge variant="outline">{loc.device_id}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(
              ({ label, value }) =>
                value != null && (
                  <div key={label}>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm">{String(value)}</dd>
                  </div>
                ),
            )}
          </dl>
        </CardContent>
      </Card>

      {loc.raw_payload && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded bg-muted p-4 text-xs">
              {JSON.stringify(loc.raw_payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

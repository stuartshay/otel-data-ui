import { useQuery } from '@apollo/client/react'
import { REFERENCE_LOCATIONS_QUERY } from '@/graphql/reference'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

export function ReferencesPage() {
  const { data, loading, error, refetch } = useQuery<Record<string, any>>(
    REFERENCE_LOCATIONS_QUERY,
  )

  if (loading) return <LoadingState message="Loading reference locations..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const locations = (data?.referenceLocations ?? []) as Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    radius_meters: number
    description: string | null
    created_at: string | null
  }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reference Locations
        </h1>
        <p className="text-muted-foreground">
          {locations.length} saved locations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <Card key={loc.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {loc.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground">
                {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </p>
              <Badge variant="outline">{loc.radius_meters}m radius</Badge>
              {loc.description && (
                <p className="text-sm text-muted-foreground">
                  {loc.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

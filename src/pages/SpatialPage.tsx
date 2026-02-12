import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import {
  NEARBY_POINTS_QUERY,
  CALCULATE_DISTANCE_QUERY,
} from '@/graphql/spatial'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function SpatialPage() {
  const [nearbyLat, setNearbyLat] = useState('40.736097')
  const [nearbyLon, setNearbyLon] = useState('-74.039373')
  const [nearbyRadius, setNearbyRadius] = useState('500')
  const [runNearby, setRunNearby] = useState(false)

  const [fromLat, setFromLat] = useState('40.736097')
  const [fromLon, setFromLon] = useState('-74.039373')
  const [toLat, setToLat] = useState('40.7484')
  const [toLon, setToLon] = useState('-73.9856')
  const [runDistance, setRunDistance] = useState(false)

  const { data: nearbyData, loading: nearbyLoading } = useQuery<
    Record<string, any>
  >(NEARBY_POINTS_QUERY, {
    variables: {
      lat: parseFloat(nearbyLat),
      lon: parseFloat(nearbyLon),
      radius_meters: parseFloat(nearbyRadius),
      limit: 20,
    },
    skip: !runNearby,
  })

  const { data: distanceData, loading: distanceLoading } = useQuery<
    Record<string, any>
  >(CALCULATE_DISTANCE_QUERY, {
    variables: {
      from_lat: parseFloat(fromLat),
      from_lon: parseFloat(fromLon),
      to_lat: parseFloat(toLat),
      to_lon: parseFloat(toLon),
    },
    skip: !runDistance,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Spatial Tools</h1>
        <p className="text-muted-foreground">
          Nearby point search and distance calculations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nearby Points */}
        <Card>
          <CardHeader>
            <CardTitle>Nearby Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  Latitude
                </label>
                <input
                  type="text"
                  value={nearbyLat}
                  onChange={(e) => setNearbyLat(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Longitude
                </label>
                <input
                  type="text"
                  value={nearbyLon}
                  onChange={(e) => setNearbyLon(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Radius (m)
                </label>
                <input
                  type="text"
                  value={nearbyRadius}
                  onChange={(e) => setNearbyRadius(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setRunNearby(true)}
              disabled={nearbyLoading}
            >
              {nearbyLoading ? 'Searching...' : 'Search'}
            </Button>

            {nearbyData?.nearbyPoints && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      nearbyData.nearbyPoints as Array<{
                        source: string
                        id: number
                        distance_meters: number
                        timestamp: string
                      }>
                    ).map((p) => (
                      <TableRow key={`${p.source}-${p.id}`}>
                        <TableCell>
                          <Badge variant="outline">{p.source}</Badge>
                        </TableCell>
                        <TableCell>{p.distance_meters.toFixed(1)}m</TableCell>
                        <TableCell className="text-xs">
                          {new Date(p.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distance Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Distance Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  From Lat
                </label>
                <input
                  type="text"
                  value={fromLat}
                  onChange={(e) => setFromLat(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  From Lon
                </label>
                <input
                  type="text"
                  value={fromLon}
                  onChange={(e) => setFromLon(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To Lat</label>
                <input
                  type="text"
                  value={toLat}
                  onChange={(e) => setToLat(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To Lon</label>
                <input
                  type="text"
                  value={toLon}
                  onChange={(e) => setToLon(e.target.value)}
                  className="w-full rounded border bg-background px-2 py-1 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setRunDistance(true)}
              disabled={distanceLoading}
            >
              {distanceLoading ? 'Calculating...' : 'Calculate'}
            </Button>

            {distanceData?.calculateDistance && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">
                  {(
                    distanceData.calculateDistance.distance_meters / 1000
                  ).toFixed(3)}{' '}
                  km
                </p>
                <p className="text-sm text-muted-foreground">
                  {distanceData.calculateDistance.distance_meters.toFixed(1)}{' '}
                  meters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  useNearbyPointsQuery,
  useCalculateDistanceQuery,
} from '@/__generated__/graphql'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ForwardGeocode } from '@/components/spatial/ForwardGeocode'
import { ReverseGeocode } from '@/components/spatial/ReverseGeocode'
import { Autocomplete } from '@/components/spatial/Autocomplete'

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

  const { data: nearbyData, loading: nearbyLoading } = useNearbyPointsQuery({
    variables: {
      lat: Number.parseFloat(nearbyLat),
      lon: Number.parseFloat(nearbyLon),
      radius_meters: Number.parseFloat(nearbyRadius),
      limit: 20,
    },
    skip: !runNearby,
  })

  const { data: distanceData, loading: distanceLoading } =
    useCalculateDistanceQuery({
      variables: {
        from_lat: Number.parseFloat(fromLat),
        from_lon: Number.parseFloat(fromLon),
        to_lat: Number.parseFloat(toLat),
        to_lon: Number.parseFloat(toLon),
      },
      skip: !runDistance,
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Spatial Tools</h1>
        <p className="text-muted-foreground">
          Nearby point search, distance calculations, and geocoding
        </p>
      </div>

      <Tabs defaultValue="spatial">
        <TabsList>
          <TabsTrigger value="spatial">Spatial Queries</TabsTrigger>
          <TabsTrigger value="geocoder">Geocoder</TabsTrigger>
        </TabsList>

        <TabsContent value="spatial">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Nearby Points */}
            <Card>
              <CardHeader>
                <CardTitle>Nearby Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label
                      htmlFor="nearby-lat"
                      className="text-xs text-muted-foreground"
                    >
                      Latitude
                    </label>
                    <input
                      id="nearby-lat"
                      type="text"
                      value={nearbyLat}
                      onChange={(e) => setNearbyLat(e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="nearby-lon"
                      className="text-xs text-muted-foreground"
                    >
                      Longitude
                    </label>
                    <input
                      id="nearby-lon"
                      type="text"
                      value={nearbyLon}
                      onChange={(e) => setNearbyLon(e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="nearby-radius"
                      className="text-xs text-muted-foreground"
                    >
                      Radius (m)
                    </label>
                    <input
                      id="nearby-radius"
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
                        {nearbyData.nearbyPoints.map((p) => (
                          <TableRow key={`${p.source}-${p.id}`}>
                            <TableCell>
                              <Badge variant="outline">{p.source}</Badge>
                            </TableCell>
                            <TableCell>
                              {p.distance_meters.toFixed(1)}m
                            </TableCell>
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
                    <label
                      htmlFor="distance-from-lat"
                      className="text-xs text-muted-foreground"
                    >
                      From Lat
                    </label>
                    <input
                      id="distance-from-lat"
                      type="text"
                      value={fromLat}
                      onChange={(e) => setFromLat(e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="distance-from-lon"
                      className="text-xs text-muted-foreground"
                    >
                      From Lon
                    </label>
                    <input
                      id="distance-from-lon"
                      type="text"
                      value={fromLon}
                      onChange={(e) => setFromLon(e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="distance-to-lat"
                      className="text-xs text-muted-foreground"
                    >
                      To Lat
                    </label>
                    <input
                      id="distance-to-lat"
                      type="text"
                      value={toLat}
                      onChange={(e) => setToLat(e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="distance-to-lon"
                      className="text-xs text-muted-foreground"
                    >
                      To Lon
                    </label>
                    <input
                      id="distance-to-lon"
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
                      {distanceData.calculateDistance.distance_meters.toFixed(
                        1,
                      )}{' '}
                      meters
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geocoder">
          <div className="grid gap-6 lg:grid-cols-2">
            <ForwardGeocode />
            <ReverseGeocode />
          </div>
          <div className="mt-6">
            <Autocomplete />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

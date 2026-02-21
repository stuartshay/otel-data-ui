import { useState } from 'react'
import { useDevicesQuery, useLocationsQuery } from '@/__generated__/graphql'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 25

export function LocationsPage() {
  const [offset, setOffset] = useState(0)
  const [deviceFilter, setDeviceFilter] = useState<string | undefined>()

  const { data: devicesData } = useDevicesQuery()
  const { data, loading, error, refetch } = useLocationsQuery({
    variables: {
      limit: PAGE_SIZE,
      offset,
      device_id: deviceFilter,
      order: 'desc',
      sort: 'timestamp',
    },
  })

  if (loading && !data) return <LoadingState message="Loading locations..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const locations = data?.locations?.items ?? []
  const total = data?.locations?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} OwnTracks GPS points
        </p>
      </div>

      {/* Device filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!deviceFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setDeviceFilter(undefined)
            setOffset(0)
          }}
        >
          All
        </Button>
        {devicesData?.devices?.map((d: { device_id: string }) => (
          <Button
            key={d.device_id}
            variant={deviceFilter === d.device_id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDeviceFilter(d.device_id)
              setOffset(0)
            }}
          >
            {d.device_id}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Lat / Lon</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell>
                  <Link
                    to={`/locations/${loc.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {loc.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{loc.device_id}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                </TableCell>
                <TableCell>
                  {loc.battery != null ? `${loc.battery}%` : '—'}
                </TableCell>
                <TableCell>
                  {loc.accuracy != null ? `${loc.accuracy.toFixed(0)}m` : '—'}
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(loc.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
          {total.toLocaleString()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

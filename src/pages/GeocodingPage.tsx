import { useState } from 'react'
import {
  Globe,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Percent,
  RefreshCw,
  LogIn,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useGeocodingStatusQuery,
  useTriggerGeocodingMutation,
} from '@/__generated__/graphql'
import { useAuth } from '@/contexts/AuthContext'
import { StatsCard } from '@/components/shared/StatsCard'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GeocodingPage() {
  const { isAuthenticated, login } = useAuth()
  const [batchSize, setBatchSize] = useState('100')
  const [retryFailed, setRetryFailed] = useState(false)

  const { data, loading, error, refetch } = useGeocodingStatusQuery({
    pollInterval: 30000,
  })

  const [triggerGeocoding, { loading: triggering }] =
    useTriggerGeocodingMutation({
      onCompleted(result) {
        const r = result.triggerGeocoding
        toast.success('Geocoding batch complete', {
          description: `Processed: ${r.processed}, Remaining: ${r.remaining}, Dedup skipped: ${r.skipped_dedup}`,
        })
        refetch()
      },
      onError(err) {
        toast.error('Geocoding failed', { description: err.message })
      },
    })

  const handleTrigger = () => {
    const variables: { batch_size?: number; retry_failed?: boolean } = {}
    const size = Number.parseInt(batchSize, 10)
    if (Number.isNaN(size) || size < 1 || size > 200) {
      toast.error('Invalid batch size', {
        description: 'Batch size must be between 1 and 200.',
      })
      return
    }
    variables.batch_size = size
    if (retryFailed) variables.retry_failed = true
    triggerGeocoding({ variables })
  }

  if (loading && !data)
    return <LoadingState message="Loading geocoding status..." />
  if (error)
    return <ErrorState message={error.message} onRetry={() => refetch()} />

  const status = data?.geocodingStatus

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Geocoding</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          title="Refresh status"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {status && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Locations"
            value={status.total_locations.toLocaleString()}
            icon={<MapPin className="h-4 w-4" />}
          />
          <StatsCard
            title="Geocoded"
            value={status.geocoded.toLocaleString()}
            icon={<Globe className="h-4 w-4" />}
            description={`${status.coverage_percent.toFixed(1)}% coverage`}
          />
          <StatsCard
            title="Successful"
            value={status.success.toLocaleString()}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Pending"
            value={status.pending.toLocaleString()}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsCard
            title="No Coverage"
            value={status.no_coverage.toLocaleString()}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <StatsCard
            title="Errors"
            value={status.errors.toLocaleString()}
            icon={<XCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Coverage"
            value={`${status.coverage_percent.toFixed(1)}%`}
            icon={<Percent className="h-4 w-4" />}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trigger Geocoding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground">
                Login required to trigger geocoding.
              </p>
              <Button variant="outline" size="sm" onClick={() => login()}>
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Process a batch of un-geocoded locations through the Pelias
                geocoder.
              </p>

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label
                    htmlFor="batchSize"
                    className="mb-1 block text-xs font-medium"
                  >
                    Batch size
                  </label>
                  <input
                    id="batchSize"
                    type="number"
                    min="1"
                    max="200"
                    step="1"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    className="h-8 w-28 rounded-md border bg-background px-2 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={retryFailed}
                    onChange={(e) => setRetryFailed(e.target.checked)}
                    className="rounded border"
                  />
                  <span>Retry failed</span>
                </label>

                <Button onClick={handleTrigger} disabled={triggering}>
                  <RefreshCw
                    className={`h-4 w-4 ${triggering ? 'animate-spin' : ''}`}
                  />
                  {triggering ? 'Processing...' : 'Run Geocoding'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useTriggerGarminSyncMutation } from '@/__generated__/graphql'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GarminSyncCard() {
  const { isAuthenticated, login } = useAuth()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [windowHours, setWindowHours] = useState('')
  const [lookback, setLookback] = useState('')

  const [triggerSync, { loading }] = useTriggerGarminSyncMutation({
    onCompleted(data) {
      const result = data.triggerGarminSync
      if (result.accepted) {
        toast.success('Garmin sync triggered', {
          description: `Window: ${result.window_hours}h from ${result.window_start ?? 'now'}`,
        })
      } else {
        toast.warning(result.message, {
          description: result.started_at
            ? `Running since ${result.started_at}`
            : undefined,
        })
      }
    },
    onError(error) {
      toast.error('Sync failed', { description: error.message })
    },
  })

  const handleSync = () => {
    const variables: { window_hours?: number; lookback?: number } = {}
    if (windowHours) variables.window_hours = parseInt(windowHours, 10)
    if (lookback) variables.lookback = parseInt(lookback, 10)
    triggerSync({ variables })
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Garmin Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Login required to trigger a manual sync.
          </p>
          <Button variant="outline" size="sm" onClick={() => login()}>
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Garmin Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Trigger a manual Garmin Connect sync.
        </p>

        <Button onClick={handleSync} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync Now'}
        </Button>

        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="space-y-2 rounded-md border p-3">
            <div>
              <label
                htmlFor="windowHours"
                className="mb-1 block text-xs font-medium"
              >
                Window hours
              </label>
              <input
                id="windowHours"
                type="number"
                min="1"
                placeholder="e.g. 24"
                value={windowHours}
                onChange={(e) => setWindowHours(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="lookback"
                className="mb-1 block text-xs font-medium"
              >
                Lookback
              </label>
              <input
                id="lookback"
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={lookback}
                onChange={(e) => setLookback(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Both optional. Window hours preferred over lookback.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

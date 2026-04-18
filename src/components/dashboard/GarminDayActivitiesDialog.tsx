import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { useGarminActivitiesQuery } from '@/__generated__/graphql'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface GarminDayActivitiesDialogProps {
  date: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

export function GarminDayActivitiesDialog({
  date,
  open,
  onOpenChange,
}: GarminDayActivitiesDialogProps) {
  const { data, loading, error } = useGarminActivitiesQuery({
    variables: {
      date_from: date ?? undefined,
      date_to: date ?? undefined,
      limit: 25,
      offset: 0,
      order: 'desc',
      sort: 'start_time',
    },
    skip: !open || !date,
  })

  const activities = data?.garminActivities?.items ?? []
  const total = data?.garminActivities?.total ?? 0
  const formattedDate = date
    ? format(new Date(`${date}T00:00:00`), 'EEEE, MMMM d, yyyy')
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" data-testid="garmin-day-dialog">
        <DialogHeader>
          <DialogTitle>Garmin Activities</DialogTitle>
          <DialogDescription>
            {date ? formattedDate : 'Select a day to view activities'}
            {!loading && !error && total > 0 && (
              <>
                {' '}
                &middot; {total} {total === 1 ? 'activity' : 'activities'}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div
              className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground"
              data-testid="garmin-day-dialog-loading"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activities...
            </div>
          ) : error ? (
            <div
              className="flex h-32 items-center justify-center text-sm text-destructive"
              data-testid="garmin-day-dialog-error"
            >
              Failed to load activities: {error.message}
            </div>
          ) : activities.length === 0 ? (
            <div
              className="flex h-32 items-center justify-center text-sm text-muted-foreground"
              data-testid="garmin-day-dialog-empty"
            >
              No activities found for this day.
            </div>
          ) : (
            <Table data-testid="garmin-day-dialog-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Sport</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Avg HR</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow
                    key={a.activity_id}
                    data-testid="garmin-day-dialog-row"
                  >
                    <TableCell>
                      <Link
                        to={`/garmin/${a.activity_id}`}
                        onClick={() => onOpenChange(false)}
                        className="font-medium capitalize text-primary hover:underline"
                        data-testid="garmin-day-dialog-sport-link"
                      >
                        {a.sport}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {a.distance_km != null
                        ? `${a.distance_km.toFixed(2)} km`
                        : '—'}
                    </TableCell>
                    <TableCell>{formatDuration(a.duration_seconds)}</TableCell>
                    <TableCell>
                      {a.avg_heart_rate != null
                        ? `${a.avg_heart_rate} bpm`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {a.calories != null ? a.calories : '—'}
                    </TableCell>
                    <TableCell>
                      {a.track_point_count != null
                        ? a.track_point_count.toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {a.start_time
                        ? new Date(a.start_time).toLocaleString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {date && !loading && !error && activities.length > 0 && (
          <div className="flex justify-end border-t pt-3">
            <Link
              to={`/garmin?date_from=${date}&date_to=${date}`}
              onClick={() => onOpenChange(false)}
              className="text-sm text-primary hover:underline"
              data-testid="garmin-day-dialog-view-all"
            >
              View in Garmin Activities page →
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { useGarminActivitiesQuery } from '@/__generated__/graphql'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { GarminActivitiesTable } from './GarminActivitiesTable'

interface GarminDayActivitiesPopoverProps {
  date: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorPos: { x: number; y: number } | null
}

export function GarminDayActivitiesPopover({
  date,
  open,
  onOpenChange,
  anchorPos,
}: GarminDayActivitiesPopoverProps) {
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
    ? format(new Date(`${date}T00:00:00`), 'EEE, MMM d, yyyy')
    : ''

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div
          style={{
            position: 'fixed',
            left: anchorPos?.x ?? 0,
            top: anchorPos?.y ?? 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
          aria-hidden
        />
      </PopoverAnchor>
      <PopoverContent
        align="center"
        side="top"
        sideOffset={8}
        className="w-72 p-0"
        data-testid="garmin-day-popover"
      >
        <div className="border-b px-3 py-1.5">
          <p className="text-xs font-semibold">{formattedDate}</p>
          {!loading && !error && total > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {total} {total === 1 ? 'activity' : 'activities'}
            </p>
          )}
        </div>

        {loading ? (
          <div
            className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground"
            data-testid="garmin-day-popover-loading"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div
            className="flex h-20 items-center justify-center px-3 text-center text-sm text-destructive"
            data-testid="garmin-day-popover-error"
          >
            Failed to load activities
          </div>
        ) : activities.length === 0 ? (
          <div
            className="flex h-20 items-center justify-center text-sm text-muted-foreground"
            data-testid="garmin-day-popover-empty"
          >
            No activities.
          </div>
        ) : (
          <div
            className="max-h-72 overflow-y-auto"
            data-testid="garmin-day-popover-list"
          >
            <GarminActivitiesTable
              activities={activities}
              distanceUnit="mi"
              linkSport
              onSportClick={() => onOpenChange(false)}
              rowTestId="garmin-day-popover-row"
              sportLinkTestId="garmin-day-popover-sport-link"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

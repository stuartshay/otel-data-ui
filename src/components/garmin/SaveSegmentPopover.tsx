import { useId, useState } from 'react'
import { LogIn, MapPinPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateGarminSegmentMutation } from '@/__generated__/graphql'
import { GARMIN_SEGMENTS_QUERY } from '@/graphql/segments'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface SaveSegmentPopoverProps {
  activityId?: string | null
  lapIndex: number
  sport?: string | null
  startLatitude: number
  startLongitude: number
  endLatitude: number
  endLongitude: number
  distanceMeters?: number | null
  defaultName?: string
}

const DEFAULT_TOLERANCE = 35

export function SaveSegmentPopover({
  activityId,
  lapIndex,
  sport,
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude,
  distanceMeters,
  defaultName = '',
}: SaveSegmentPopoverProps) {
  const { isAuthenticated, login } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName)
  const [tolerance, setTolerance] = useState(String(DEFAULT_TOLERANCE))
  const nameId = useId()
  const toleranceId = useId()

  const [createSegment, { loading }] = useCreateGarminSegmentMutation({
    refetchQueries: [{ query: GARMIN_SEGMENTS_QUERY }],
    onCompleted(data) {
      toast.success('Segment saved', {
        description: `"${data.createGarminSegment.name}" is now tracking efforts.`,
      })
      setOpen(false)
      setName('')
    },
    onError(error) {
      toast.error('Could not save segment', { description: error.message })
    },
  })

  const trimmedName = name.trim()
  const toleranceValue = Number(tolerance)
  const toleranceValid =
    Number.isFinite(toleranceValue) &&
    toleranceValue >= 5 &&
    toleranceValue <= 200
  const canSubmit = trimmedName.length > 0 && toleranceValid && !loading

  const handleSubmit = () => {
    if (!canSubmit) return
    createSegment({
      variables: {
        input: {
          name: trimmedName,
          sport: sport ?? null,
          start_latitude: startLatitude,
          start_longitude: startLongitude,
          end_latitude: endLatitude,
          end_longitude: endLongitude,
          distance_meters: distanceMeters ?? null,
          match_tolerance_meters: toleranceValue,
          source_activity_id: activityId ?? null,
          source_lap_index: lapIndex,
        },
      },
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-testid="save-segment-trigger">
          <MapPinPlus className="h-4 w-4" />
          Save as segment
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Log in to save this lap as a named segment.
            </p>
            <Button variant="outline" size="sm" onClick={() => login()}>
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
          >
            <div className="space-y-1">
              <label htmlFor={nameId} className="text-sm font-medium">
                Segment name
              </label>
              <Input
                id={nameId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Harlem Hill"
                autoFocus
                data-testid="save-segment-name"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={toleranceId} className="text-sm font-medium">
                Match tolerance (m)
              </label>
              <Input
                id={toleranceId}
                type="number"
                min={5}
                max={200}
                value={tolerance}
                onChange={(event) => setTolerance(event.target.value)}
                data-testid="save-segment-tolerance"
              />
              <p className="text-xs text-muted-foreground">
                Corridor radius used to match other activities (5–200 m).
              </p>
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={!canSubmit}
              data-testid="save-segment-submit"
            >
              {loading ? 'Saving…' : 'Save segment'}
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}

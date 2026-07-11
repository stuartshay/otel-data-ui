import { useState } from 'react'
import { LogIn, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteGarminSegmentMutation } from '@/__generated__/graphql'
import { GARMIN_SEGMENTS_QUERY } from '@/graphql/segments'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DeleteSegmentButtonProps {
  segmentId: number
  segmentName: string
  onDeleted: () => void
}

export function DeleteSegmentButton({
  segmentId,
  segmentName,
  onDeleted,
}: Readonly<DeleteSegmentButtonProps>) {
  const { isAuthenticated, login } = useAuth()
  const [open, setOpen] = useState(false)

  const [deleteSegment, { loading }] = useDeleteGarminSegmentMutation({
    refetchQueries: [{ query: GARMIN_SEGMENTS_QUERY }],
    onCompleted(data) {
      if (!data.deleteGarminSegment) {
        toast.error('Could not delete segment', {
          description: 'The server did not confirm the deletion.',
        })
        return
      }
      toast.success('Segment deleted', {
        description: `"${segmentName}" was removed and will be cleared from Garmin Connect shortly.`,
      })
      setOpen(false)
      onDeleted()
    },
    onError(error) {
      toast.error('Could not delete segment', { description: error.message })
    },
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          data-testid="delete-segment-trigger"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        {!isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Log in to delete this segment.
            </p>
            <Button variant="outline" size="sm" onClick={() => login()}>
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Delete “{segmentName}”?</p>
              <p className="text-sm text-muted-foreground">
                This removes the saved segment and queues it for removal from
                Garmin Connect (cleared on the next sync). This can’t be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteSegment({ variables: { id: segmentId } })}
                disabled={loading}
                data-testid="delete-segment-confirm"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

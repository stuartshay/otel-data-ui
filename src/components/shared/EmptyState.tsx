import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title = 'No data available',
  message,
  onReset,
  resetLabel = 'Clear filters',
}: Readonly<{
  title?: string
  message?: string
  onReset?: () => void
  resetLabel?: string
}>) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      {message && (
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      )}
      {onReset && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
          {resetLabel}
        </Button>
      )}
    </div>
  )
}

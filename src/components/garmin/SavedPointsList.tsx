import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SavedPoint } from './ActivityChartData'

interface SavedPointsListProps {
  points: SavedPoint[]
  onRemove: (id: string) => void
  onClear: () => void
}

/**
 * Lists the points the user has saved on the Garmin activity detail page. Each
 * row shows the saved point's color swatch and key metrics with a remove
 * control, plus a "Clear all" action. Renders nothing when no points are saved.
 */
export function SavedPointsList({
  points,
  onRemove,
  onClear,
}: SavedPointsListProps) {
  if (points.length === 0) return null

  return (
    <Card data-testid="saved-points-list">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          Saved Points ({points.length})
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          data-testid="saved-points-clear"
        >
          Clear all
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {points.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 text-xs"
            data-testid="saved-point-row"
          >
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            />
            <span className="font-medium">#{i + 1}</span>
            <span className="tabular-nums">
              {p.distance != null
                ? `${p.distance.toFixed(2)} mi`
                : `${p.time.toFixed(1)} min`}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {p.elevation != null ? `${p.elevation.toFixed(0)} ft` : '—'}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {p.speed != null ? `${p.speed.toFixed(1)} mph` : '—'}
            </span>
            <span className="hidden tabular-nums text-muted-foreground sm:inline">
              {p.latitude != null && p.longitude != null
                ? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
                : '—'}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-6 w-6"
              onClick={() => onRemove(p.id)}
              data-testid="saved-point-remove"
              aria-label={`Remove saved point ${i + 1}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

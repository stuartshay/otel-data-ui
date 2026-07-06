import { Link } from 'react-router-dom'
import { format as formatDate } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  buildComparisonMatrix,
  heatColor,
  type ComparisonItem,
  type LapMetric,
} from './lapComparison'

interface LapComparisonMatrixProps {
  items: ComparisonItem[]
  metric: LapMetric
}

function formatActivityDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return formatDate(d, 'MMM d, yyyy')
}

export function LapComparisonMatrix({
  items,
  metric,
}: LapComparisonMatrixProps) {
  const matrix = buildComparisonMatrix(items, metric)
  const lapColumns = Array.from({ length: matrix.lapCount }, (_, i) => i + 1)

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-card">
                Activity
              </TableHead>
              {lapColumns.map((c) => (
                <TableHead key={c} className="whitespace-nowrap text-right">
                  Lap {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.rows.map((row) => (
              <TableRow key={row.activityId}>
                <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-card font-medium">
                  <Link
                    to={`/garmin/${row.activityId}`}
                    className="hover:underline"
                  >
                    {formatActivityDate(row.startTime)}
                  </Link>
                </TableCell>
                {row.cells.map((cell) => (
                  <TableCell
                    key={cell.lapIndex}
                    className={cn(
                      'text-right tabular-nums',
                      cell.isPR &&
                        'rounded font-semibold ring-1 ring-inset ring-primary',
                    )}
                    style={{ backgroundColor: heatColor(cell.score) }}
                    title={cell.isPR ? 'Personal best for this lap' : undefined}
                  >
                    {cell.formatted}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            <TableRow className="border-t-2">
              <TableCell className="sticky left-0 z-10 bg-muted/50 font-semibold">
                Best
              </TableCell>
              {matrix.summary.map((s) => (
                <TableCell
                  key={s.lapIndex}
                  className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                >
                  {s.best}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 z-10 bg-muted/50 font-semibold">
                Avg
              </TableCell>
              {matrix.summary.map((s) => (
                <TableCell
                  key={s.lapIndex}
                  className="text-right tabular-nums text-muted-foreground"
                >
                  {s.avg}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="sticky left-0 z-10 bg-muted/50 font-semibold">
                Worst
              </TableCell>
              {matrix.summary.map((s) => (
                <TableCell
                  key={s.lapIndex}
                  className="text-right tabular-nums text-red-600 dark:text-red-400"
                >
                  {s.worst}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

import {
  format,
  isValid,
  subDays,
  startOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  dateFrom: Date | undefined
  dateTo: Date | undefined
  onRangeChange: (from: Date | undefined, to: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
}

const presets = [
  {
    label: 'Today',
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 7 days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'This month',
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfDay(new Date()),
    }),
  },
]

export function DateRangePicker({
  dateFrom,
  dateTo,
  onRangeChange,
  minDate,
  maxDate = new Date(),
}: Readonly<DateRangePickerProps>) {
  const hasRange = dateFrom != null || dateTo != null

  const selected: DateRange | undefined =
    dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined

  const handleSelect = (range: DateRange | undefined) => {
    onRangeChange(range?.from, range?.to)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRangeChange(undefined, undefined)
  }

  const safeFormat = (date: Date) =>
    isValid(date) ? format(date, 'MMM d, yyyy') : undefined

  const formatLabel = () => {
    if (!dateFrom && !dateTo) return 'Select dates'
    const fromStr = dateFrom ? safeFormat(dateFrom) : undefined
    const toStr = dateTo ? safeFormat(dateTo) : undefined
    if (fromStr && toStr) return `${fromStr} – ${toStr}`
    if (fromStr) return `${fromStr} – …`
    return 'Select dates'
  }

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            data-testid="date-range-trigger"
            className={hasRange ? 'border-primary' : undefined}
          >
            <CalendarIcon className="h-4 w-4" />
            {formatLabel()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex gap-2 border-b p-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  const { from, to } = preset.getRange()
                  const minClampedFrom =
                    minDate && from < minDate ? minDate : from
                  const clampedFrom =
                    maxDate && minClampedFrom > maxDate
                      ? maxDate
                      : minClampedFrom
                  const minClampedTo = minDate && to < minDate ? minDate : to
                  const clampedTo =
                    maxDate && minClampedTo > maxDate ? maxDate : minClampedTo
                  const normalizedTo =
                    clampedTo < clampedFrom ? clampedFrom : clampedTo

                  onRangeChange(clampedFrom, normalizedTo)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={[
              { after: maxDate },
              ...(minDate ? [{ before: minDate }] : []),
            ]}
            startMonth={minDate}
            endMonth={maxDate}
            defaultMonth={dateFrom ?? subDays(new Date(), 30)}
          />
        </PopoverContent>
      </Popover>
      {hasRange && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Clear date range"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

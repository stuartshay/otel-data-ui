import { parseISO, isValid, format } from 'date-fns'

interface DateRangeBounds {
  minDate?: Date
  maxDate: Date
}

interface ParsedDateRange {
  dateFrom: Date | undefined
  dateTo: Date | undefined
  dateFromParam: string | undefined
  dateToParam: string | undefined
}

function clampDate(
  date: Date | undefined,
  min: Date | undefined,
  max: Date,
): Date | undefined {
  if (!date) return undefined
  if (min && date < min) return min
  if (date > max) return max
  return date
}

/**
 * Convert a UTC ISO timestamp (e.g. "2025-01-01T00:00:00Z") to a local
 * midnight Date for its date portion, avoiding timezone off-by-one issues
 * where a UTC midnight timestamp maps to the prior local day.
 */
export function toLocalDate(isoTimestamp: string): Date {
  return parseISO(isoTimestamp.substring(0, 10))
}

/**
 * Parse, validate, and clamp date range URL parameters against API-provided
 * bounds. Swaps from/to when from > to.
 *
 * Bounds should be created with toLocalDate() to avoid timezone off-by-one.
 * Returns clamped Date values for the UI picker plus formatted yyyy-MM-dd
 * strings suitable for query variables.
 */
export function parseDateRangeParams(
  dateFromRaw: string | null,
  dateToRaw: string | null,
  bounds: DateRangeBounds,
): ParsedDateRange {
  const { minDate, maxDate } = bounds

  const dateFromParsed = dateFromRaw ? parseISO(dateFromRaw) : undefined
  const dateFromValid =
    dateFromParsed && isValid(dateFromParsed) ? dateFromParsed : undefined

  const dateToParsed = dateToRaw ? parseISO(dateToRaw) : undefined
  const dateToValid =
    dateToParsed && isValid(dateToParsed) ? dateToParsed : undefined

  let dateFrom = clampDate(dateFromValid, minDate, maxDate)
  let dateTo = clampDate(dateToValid, minDate, maxDate)

  if (dateFrom && dateTo && dateFrom > dateTo) {
    ;[dateFrom, dateTo] = [dateTo, dateFrom]
  }

  return {
    dateFrom,
    dateTo,
    dateFromParam: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    dateToParam: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
  }
}

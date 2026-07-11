/**
 * Shared export utilities for CSV and file download helpers.
 * Used by pages that offer on-demand data export (CSV, GeoJSON, etc.).
 */

/**
 * Wraps a value in CSV-safe quotes when it contains commas, quotes, or
 * newline characters. Returns an empty string for null / undefined values.
 */
export function escapeCsvValue(value: unknown): string {
  if (value == null) return ''

  const quoteIfNeeded = (str: string) =>
    /[,"\n\r]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str

  if (typeof value === 'object') {
    try {
      return quoteIfNeeded(JSON.stringify(value) ?? '')
    } catch {
      return ''
    }
  }

  if (typeof value === 'string') {
    return quoteIfNeeded(value)
  }

  if (typeof value === 'symbol') {
    return quoteIfNeeded(value.description ?? value.toString())
  }

  if (typeof value === 'function') {
    return quoteIfNeeded(value.name)
  }

  if (typeof value === 'number') {
    return quoteIfNeeded(value.toString())
  }

  if (typeof value === 'bigint') {
    return quoteIfNeeded(value.toString())
  }

  return quoteIfNeeded(value ? 'true' : 'false')
}

/**
 * Triggers a browser file download for the given string content.
 *
 * @param content  - String content to write to the file.
 * @param mime     - MIME type (e.g. 'text/csv', 'application/geo+json').
 * @param filename - Suggested download filename.
 */
export function triggerDownload(
  content: string,
  mime: string,
  filename: string,
): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  const revokeObjectURL =
    typeof URL.revokeObjectURL === 'function'
      ? URL.revokeObjectURL.bind(URL)
      : undefined
  if (revokeObjectURL) {
    window.setTimeout(() => revokeObjectURL(url), 0)
  }
}

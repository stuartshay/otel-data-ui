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
  const str = String(value)
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
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
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

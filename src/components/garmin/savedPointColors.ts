/**
 * Categorical palette for saved Garmin chart/map points. Deliberately distinct
 * from the route speed legend (blue/green/yellow/red) and the chart series
 * colors (gray elevation, blue speed) so saved markers stay visually separable.
 */
const SAVED_POINT_PALETTE = [
  '#a855f7', // purple
  '#14b8a6', // teal
  '#ec4899', // pink
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#d946ef', // fuchsia
  '#f43f5e', // rose
] as const

/**
 * Pick the next color for a new saved point: the first palette color not
 * already in use, or — once every color is taken — recycle deterministically by
 * count so colors keep cycling through the palette.
 */
export function nextSavedPointColor(
  existing: ReadonlyArray<{ color: string }>,
): string {
  const used = new Set(existing.map((p) => p.color))
  const unused = SAVED_POINT_PALETTE.find((color) => !used.has(color))
  return (
    unused ?? SAVED_POINT_PALETTE[existing.length % SAVED_POINT_PALETTE.length]
  )
}

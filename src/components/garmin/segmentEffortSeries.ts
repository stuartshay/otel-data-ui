/** One distance bin of an effort's speed/HR series (garminSegmentEffortSeries.bins). */
export interface SegmentEffortSeriesBin {
  index: number
  fraction: number
  speed_kmh?: number | null
  heart_rate?: number | null
}

export interface SegmentEffortSample {
  speed_kmh: number | null
  heart_rate: number | null
}

/**
 * How many neighboring bins to scan on each side when the exact bin has no
 * samples (GPS dropouts leave short runs of empty bins mid-series).
 */
const NEAREST_BIN_RADIUS = 2

/** Map a 0..1 fraction to a bin index, clamped to the series bounds. */
export function binIndexForFraction(
  fraction: number,
  binCount: number,
): number {
  if (binCount <= 0 || !Number.isFinite(fraction)) return 0
  const index = Math.floor(fraction * binCount)
  return Math.min(Math.max(index, 0), binCount - 1)
}

function binHasData(bin: SegmentEffortSeriesBin | undefined): boolean {
  return bin != null && (bin.speed_kmh != null || bin.heart_rate != null)
}

/**
 * The speed/HR reading at the given fraction of the traversal, falling back to
 * the nearest non-empty bin within {@link NEAREST_BIN_RADIUS} to bridge GPS
 * gaps. Returns null when no nearby bin has data (degenerate efforts).
 */
export function sampleAtFraction(
  bins: readonly SegmentEffortSeriesBin[],
  fraction: number,
): SegmentEffortSample | null {
  if (bins.length === 0) return null

  const center = binIndexForFraction(fraction, bins.length)
  for (let offset = 0; offset <= NEAREST_BIN_RADIUS; offset++) {
    for (const index of offset === 0
      ? [center]
      : [center - offset, center + offset]) {
      const bin = bins[index]
      if (binHasData(bin)) {
        return {
          speed_kmh: bin.speed_kmh ?? null,
          heart_rate: bin.heart_rate ?? null,
        }
      }
    }
  }
  return null
}

import { describe, expect, it } from 'vitest'
import { buildSegmentPreviewPath } from './segmentPreviewPath'

describe('buildSegmentPreviewPath', () => {
  it('builds a multi-point representative path between segment endpoints', () => {
    const path = buildSegmentPreviewPath(40.79, -73.96, 40.8, -73.94)

    expect(path).toHaveLength(4)
    expect(path[0]).toEqual([40.79, -73.96])
    expect(path[path.length - 1]).toEqual([40.8, -73.94])
    expect(path[1]).not.toEqual(path[2])
  })

  it('returns a single point when the endpoints overlap', () => {
    expect(buildSegmentPreviewPath(40.79, -73.96, 40.79, -73.96)).toEqual([
      [40.79, -73.96],
    ])
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetConfig = vi.fn().mockReturnValue('https://geocoder.example.com')

vi.mock('@/config/runtime', () => ({
  getConfig: mockGetConfig,
}))

const mockResponse = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-73.9857, 40.7484] },
      properties: {
        id: '1',
        gid: 'whosonfirst:venue:1',
        layer: 'venue',
        source: 'whosonfirst',
        source_id: '1',
        name: 'Empire State Building',
        label: 'Empire State Building, New York, NY, USA',
      },
    },
  ],
}

describe('geocoder service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockGetConfig.mockReturnValue('https://geocoder.example.com')
    globalThis.fetch = vi.fn()
  })

  describe('forwardGeocode', () => {
    it('constructs correct URL and returns data', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      globalThis.fetch = fetchMock

      const { forwardGeocode } = await import('./geocoder')
      const result = await forwardGeocode('Empire State Building')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://geocoder.example.com/v1/search?text=Empire+State+Building&size=5',
      )
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.name).toBe('Empire State Building')
    })

    it('uses custom size parameter', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      globalThis.fetch = fetchMock

      const { forwardGeocode } = await import('./geocoder')
      await forwardGeocode('test', 10)

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('size=10'))
    })

    it('throws on non-OK response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

      const { forwardGeocode } = await import('./geocoder')
      await expect(forwardGeocode('test')).rejects.toThrow(
        'Geocode failed: 500',
      )
    })
  })

  describe('reverseGeocode', () => {
    it('constructs correct URL with point.lat and point.lon', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      globalThis.fetch = fetchMock

      const { reverseGeocode } = await import('./geocoder')
      await reverseGeocode(40.7484, -73.9857)

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('point.lat=40.7484'),
      )
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('point.lon=-73.9857'),
      )
    })

    it('rejects NaN latitude', async () => {
      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(NaN, -73.9857)).rejects.toThrow(
        'Latitude must be between -90 and 90',
      )
    })

    it('rejects NaN longitude', async () => {
      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(40.7484, NaN)).rejects.toThrow(
        'Longitude must be between -180 and 180',
      )
    })

    it('rejects Infinity latitude', async () => {
      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(Infinity, -73.9857)).rejects.toThrow(
        'Latitude must be between -90 and 90',
      )
    })

    it('rejects out-of-range latitude', async () => {
      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(91, 0)).rejects.toThrow(
        'Latitude must be between -90 and 90',
      )
    })

    it('rejects out-of-range longitude', async () => {
      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(0, 181)).rejects.toThrow(
        'Longitude must be between -180 and 180',
      )
    })

    it('rejects invalid size', async () => {
      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(40, -73, NaN)).rejects.toThrow(
        'Size must be a positive number',
      )
    })

    it('throws on non-OK response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

      const { reverseGeocode } = await import('./geocoder')
      await expect(reverseGeocode(40.7484, -73.9857)).rejects.toThrow(
        'Reverse geocode failed: 404',
      )
    })
  })

  describe('autocomplete', () => {
    it('constructs correct URL and returns data', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      globalThis.fetch = fetchMock

      const { autocomplete } = await import('./geocoder')
      const result = await autocomplete('Empire')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://geocoder.example.com/v1/autocomplete?text=Empire&size=10',
      )
      expect(result.features).toHaveLength(1)
    })

    it('throws on non-OK response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      const { autocomplete } = await import('./geocoder')
      await expect(autocomplete('test')).rejects.toThrow(
        'Autocomplete failed: 503',
      )
    })
  })

  describe('getBaseUrl', () => {
    it('uses getConfig with correct key and fallback', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { forwardGeocode } = await import('./geocoder')
      await forwardGeocode('test')

      expect(mockGetConfig).toHaveBeenCalledWith(
        'GEOCODER_URL',
        'https://geocoder.lab.informationcart.com',
      )
    })
  })
})

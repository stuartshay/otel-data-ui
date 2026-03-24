import { getConfig } from '@/config/runtime'

export interface PeliasProperties {
  id: string
  gid: string
  layer: string
  source: string
  source_id: string
  name: string
  label: string
  confidence?: number
  accuracy?: string
  country?: string
  country_a?: string
  region?: string
  region_a?: string
  county?: string
  locality?: string
  neighbourhood?: string
  borough?: string
  housenumber?: string
  street?: string
  postalcode?: string
}

export interface PeliasGeometry {
  type: 'Point'
  coordinates: [number, number] // [lon, lat]
}

export interface PeliasFeature {
  type: 'Feature'
  geometry: PeliasGeometry
  properties: PeliasProperties
}

export interface PeliasResponse {
  type: 'FeatureCollection'
  features: PeliasFeature[]
}

function getBaseUrl(): string {
  return getConfig('GEOCODER_URL', 'https://geocoder.lab.informationcart.com')
}

export async function forwardGeocode(
  text: string,
  size: number = 5,
): Promise<PeliasResponse> {
  const url = `${getBaseUrl()}/v1/search?${new URLSearchParams({ text, size: String(size) })}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`)
  return res.json() as Promise<PeliasResponse>
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  size: number = 5,
): Promise<PeliasResponse> {
  if (lat < -90 || lat > 90)
    throw new Error('Latitude must be between -90 and 90')
  if (lon < -180 || lon > 180)
    throw new Error('Longitude must be between -180 and 180')

  const url = `${getBaseUrl()}/v1/reverse?${new URLSearchParams({
    'point.lat': String(lat),
    'point.lon': String(lon),
    size: String(size),
  })}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`)
  return res.json() as Promise<PeliasResponse>
}

export async function autocomplete(
  text: string,
  size: number = 10,
): Promise<PeliasResponse> {
  const url = `${getBaseUrl()}/v1/autocomplete?${new URLSearchParams({ text, size: String(size) })}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Autocomplete failed: ${res.status}`)
  return res.json() as Promise<PeliasResponse>
}

import { gql } from '@apollo/client'

export const GEOCODING_STATUS_QUERY = gql`
  query GeocodingStatus {
    geocodingStatus {
      total_locations
      geocoded
      success
      pending
      no_coverage
      errors
      coverage_percent
    }
  }
`

export const REVERSE_GEOCODE_POINT_QUERY = gql`
  query ReverseGeocodePoint($latitude: Float!, $longitude: Float!) {
    reverseGeocodePoint(latitude: $latitude, longitude: $longitude) {
      latitude
      longitude
      display_address
      status
      resolution_source
    }
  }
`

export const REVERSE_GEOCODE_POINTS_BATCH_QUERY = gql`
  query ReverseGeocodePointsBatch($points: [ReverseGeocodePointInput!]!) {
    reverseGeocodePointsBatch(points: $points) {
      items {
        latitude
        longitude
        display_address
        status
      }
    }
  }
`

export const TRIGGER_GEOCODING_MUTATION = gql`
  mutation TriggerGeocoding($batch_size: Int, $retry_failed: Boolean) {
    triggerGeocoding(batch_size: $batch_size, retry_failed: $retry_failed) {
      processed
      remaining
      skipped_dedup
    }
  }
`

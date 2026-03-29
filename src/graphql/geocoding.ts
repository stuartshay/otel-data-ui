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

export const TRIGGER_GEOCODING_MUTATION = gql`
  mutation TriggerGeocoding($batch_size: Int, $retry_failed: Boolean) {
    triggerGeocoding(batch_size: $batch_size, retry_failed: $retry_failed) {
      processed
      remaining
      skipped_dedup
    }
  }
`

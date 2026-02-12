import { gql } from '@apollo/client'

export const NEARBY_POINTS_QUERY = gql`
  query NearbyPoints(
    $lat: Float!
    $lon: Float!
    $radius_meters: Float
    $source: String
    $limit: Int
  ) {
    nearbyPoints(
      lat: $lat
      lon: $lon
      radius_meters: $radius_meters
      source: $source
      limit: $limit
    ) {
      source
      id
      latitude
      longitude
      distance_meters
      timestamp
    }
  }
`

export const CALCULATE_DISTANCE_QUERY = gql`
  query CalculateDistance(
    $from_lat: Float!
    $from_lon: Float!
    $to_lat: Float!
    $to_lon: Float!
  ) {
    calculateDistance(
      from_lat: $from_lat
      from_lon: $from_lon
      to_lat: $to_lat
      to_lon: $to_lon
    ) {
      distance_meters
      from_lat
      from_lon
      to_lat
      to_lon
    }
  }
`

export const WITHIN_REFERENCE_QUERY = gql`
  query WithinReference($name: String!, $source: String, $limit: Int) {
    withinReference(name: $name, source: $source, limit: $limit) {
      reference_name
      radius_meters
      total_points
      points {
        source
        id
        latitude
        longitude
        distance_meters
        timestamp
      }
    }
  }
`

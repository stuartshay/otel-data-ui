import { gql } from '@apollo/client'

export const GARMIN_SEGMENTS_QUERY = gql`
  query GarminSegments($sport: String) {
    garminSegments(sport: $sport) {
      id
      name
      sport
      start_latitude
      start_longitude
      end_latitude
      end_longitude
      distance_meters
      match_tolerance_meters
      source_activity_id
      source_lap_index
      source_climb_index
      created_at
      updated_at
      route
    }
  }
`

export const GARMIN_SEGMENT_QUERY = gql`
  query GarminSegment($id: Int!) {
    garminSegment(id: $id) {
      id
      name
      sport
      start_latitude
      start_longitude
      end_latitude
      end_longitude
      distance_meters
      match_tolerance_meters
      source_activity_id
      source_lap_index
      source_climb_index
      created_at
      updated_at
    }
  }
`

export const GARMIN_SEGMENT_EFFORTS_QUERY = gql`
  query GarminSegmentEfforts(
    $id: Int!
    $date_from: String
    $date_to: String
    $max_effort_seconds: Int
    $limit: Int
  ) {
    garminSegmentEfforts(
      id: $id
      date_from: $date_from
      date_to: $date_to
      max_effort_seconds: $max_effort_seconds
      limit: $limit
    ) {
      segment {
        start_lat
        start_lon
        end_lat
        end_lon
        tolerance_meters
      }
      items {
        rank
        activity_id
        sport
        activity_start_time
        effort_start
        effort_end
        elapsed_seconds
        distance_km
        avg_speed_kmh
        avg_heart_rate
        max_heart_rate
      }
      total
    }
  }
`

export const GARMIN_SEGMENT_EFFORT_SERIES_QUERY = gql`
  query GarminSegmentEffortSeries(
    $id: Int!
    $activity_id: String!
    $effort_start: String!
    $effort_end: String!
    $bins: Int
  ) {
    garminSegmentEffortSeries(
      id: $id
      activity_id: $activity_id
      effort_start: $effort_start
      effort_end: $effort_end
      bins: $bins
    ) {
      activity_id
      effort_start
      effort_end
      bin_count
      bins {
        index
        fraction
        speed_kmh
        heart_rate
      }
    }
  }
`

export const CREATE_GARMIN_SEGMENT_MUTATION = gql`
  mutation CreateGarminSegment($input: CreateGarminSegmentInput!) {
    createGarminSegment(input: $input) {
      id
      name
      sport
      start_latitude
      start_longitude
      end_latitude
      end_longitude
      distance_meters
      match_tolerance_meters
      source_activity_id
      source_lap_index
      source_climb_index
      created_at
      updated_at
    }
  }
`

export const DELETE_GARMIN_SEGMENT_MUTATION = gql`
  mutation DeleteGarminSegment($id: Int!) {
    deleteGarminSegment(id: $id)
  }
`

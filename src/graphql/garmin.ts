import { gql } from '@apollo/client'

export const GARMIN_ACTIVITIES_QUERY = gql`
  query GarminActivities(
    $sport: String
    $date_from: String
    $date_to: String
    $limit: Int
    $offset: Int
    $sort: String
    $order: SortOrder
  ) {
    garminActivities(
      sport: $sport
      date_from: $date_from
      date_to: $date_to
      limit: $limit
      offset: $offset
      sort: $sort
      order: $order
    ) {
      items {
        activity_id
        sport
        sub_sport
        start_time
        end_time
        distance_km
        duration_seconds
        avg_heart_rate
        max_heart_rate
        avg_cadence
        max_cadence
        calories
        avg_speed_kmh
        max_speed_kmh
        total_ascent_m
        total_descent_m
        total_distance
        avg_pace
        device_manufacturer
        created_at
        uploaded_at
        track_point_count
      }
      total
      limit
      offset
    }
  }
`

export const GARMIN_ACTIVITY_QUERY = gql`
  query GarminActivity($activity_id: String!) {
    garminActivity(activity_id: $activity_id) {
      activity_id
      sport
      sub_sport
      start_time
      end_time
      distance_km
      duration_seconds
      avg_heart_rate
      max_heart_rate
      avg_cadence
      max_cadence
      calories
      avg_speed_kmh
      max_speed_kmh
      total_ascent_m
      total_descent_m
      total_distance
      avg_pace
      device_manufacturer
      avg_temperature_c
      min_temperature_c
      max_temperature_c
      total_elapsed_time
      total_timer_time
      created_at
      uploaded_at
      track_point_count
    }
  }
`

export const GARMIN_TRACK_POINTS_QUERY = gql`
  query GarminTrackPoints(
    $activity_id: String!
    $limit: Int
    $offset: Int
    $sort: String
    $order: SortOrder
    $simplify: Float
  ) {
    garminTrackPoints(
      activity_id: $activity_id
      limit: $limit
      offset: $offset
      sort: $sort
      order: $order
      simplify: $simplify
    ) {
      items {
        id
        activity_id
        latitude
        longitude
        timestamp
        altitude
        distance_from_start_km
        speed_kmh
        heart_rate
        cadence
        temperature_c
        created_at
      }
      total
      limit
      offset
    }
  }
`

export const GARMIN_SPORTS_QUERY = gql`
  query GarminSports {
    garminSports {
      sport
      activity_count
    }
  }
`

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
        total_strokes
        calories
        avg_speed_kmh
        max_speed_kmh
        total_ascent_m
        total_descent_m
        total_distance
        avg_pace
        device_manufacturer
        device {
          device_id
          manufacturer
          garmin_product
          model
        }
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
      hr_available
      min_heart_rate
      aerobic_training_effect
      anaerobic_training_effect
      exercise_load
      avg_respiration_rate
      min_respiration_rate
      max_respiration_rate
      sweat_loss_ml
      moderate_intensity_minutes
      vigorous_intensity_minutes
      total_intensity_minutes
      paved_distance_km
      unpaved_distance_km
      avg_cadence
      max_cadence
      total_strokes
      calories
      avg_speed_kmh
      max_speed_kmh
      total_ascent_m
      total_descent_m
      total_distance
      avg_pace
      device_manufacturer
      device {
        device_id
        manufacturer
        garmin_product
        model
        software_version
      }
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

export const GARMIN_DATE_RANGE_QUERY = gql`
  query GarminDateRange {
    garminDateRange {
      min_date
      max_date
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

export const GARMIN_DEVICE_COUNTS_QUERY = gql`
  query GarminDeviceCounts {
    garminDeviceCounts {
      label
      activity_count
    }
  }
`

export const GARMIN_ACTIVITY_TOTALS_QUERY = gql`
  query GarminActivityTotals(
    $period: String!
    $date_from: String
    $date_to: String
    $sport: String
  ) {
    garminActivityTotals(
      period: $period
      date_from: $date_from
      date_to: $date_to
      sport: $sport
    ) {
      period_start
      activity_count
      total_distance_km
      total_duration_seconds
      total_ascent_m
      total_calories
    }
  }
`

export const GARMIN_CHART_DATA_QUERY = gql`
  query GarminChartData($activity_id: String!) {
    garminChartData(activity_id: $activity_id) {
      timestamp
      altitude
      distance_from_start_km
      speed_kmh
      heart_rate
      hr_zone
      respiration_rate
      cadence
      temperature_c
      latitude
      longitude
    }
  }
`

export const GARMIN_ACTIVITY_CLIMBS_QUERY = gql`
  query GarminActivityClimbs($activity_id: String!) {
    garminActivityClimbs(activity_id: $activity_id) {
      id
      activity_id
      source_split_index
      message_index
      climb_type
      start_time
      end_time
      duration_seconds
      elapsed_duration_seconds
      moving_duration_seconds
      distance_meters
      elevation_gain_meters
      elevation_loss_meters
      start_elevation_meters
      average_grade_percent
      max_grade_percent
      average_speed_mps
      max_speed_mps
      start_latitude
      start_longitude
      end_latitude
      end_longitude
      climb_pro_difficulty
    }
  }
`

export const GARMIN_ACTIVITY_LAPS_QUERY = gql`
  query GarminActivityLaps($activity_id: String!) {
    garminActivityLaps(activity_id: $activity_id) {
      id
      activity_id
      lap_index
      start_time
      end_time
      duration_seconds
      elapsed_duration_seconds
      moving_duration_seconds
      distance_meters
      paved_distance_meters
      unpaved_distance_meters
      avg_speed_mps
      avg_heart_rate
      max_heart_rate
      total_ascent_meters
      total_descent_meters
      calories
      created_at
      updated_at
    }
  }
`

export const GARMIN_LAPS_COMPARISON_QUERY = gql`
  query GarminLapsComparison(
    $sport: String
    $date_from: String
    $date_to: String
    $limit: Int
    $offset: Int
  ) {
    garminLapsComparison(
      sport: $sport
      date_from: $date_from
      date_to: $date_to
      limit: $limit
      offset: $offset
    ) {
      total
      limit
      offset
      items {
        activity {
          activity_id
          sport
          sub_sport
          start_time
          distance_km
          duration_seconds
          avg_speed_kmh
          avg_heart_rate
          max_heart_rate
          total_ascent_m
        }
        laps {
          id
          activity_id
          lap_index
          start_time
          end_time
          duration_seconds
          distance_meters
          avg_speed_mps
          avg_heart_rate
          max_heart_rate
          total_ascent_meters
          total_descent_meters
          calories
        }
      }
    }
  }
`

export const TRIGGER_GARMIN_SYNC_MUTATION = gql`
  mutation TriggerGarminSync($window_hours: Int, $lookback: Int) {
    triggerGarminSync(window_hours: $window_hours, lookback: $lookback) {
      status
      message
      accepted
      triggered_at
      started_at
      window_hours
      window_start
      lookback
    }
  }
`

export const GARMIN_EXPORT_POINTS_QUERY = gql`
  query GarminExportPoints($activity_id: String!, $limit: Int, $offset: Int) {
    garminTrackPoints(
      activity_id: $activity_id
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        activity_id
        timestamp
        latitude
        longitude
        altitude
        distance_from_start_km
        speed_kmh
        heart_rate
        hr_zone
        respiration_rate
        cadence
        temperature_c
        surface_type
        effort_level
        created_at
        address {
          display_address
          street
          housenumber
          neighbourhood
          locality
          region
          country
          postalcode
          confidence
          waypoint_kind
          status
          geocoded_at
        }
      }
      total
    }
  }
`

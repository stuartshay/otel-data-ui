import { gql } from '@apollo/client'

export const UNIFIED_GPS_QUERY = gql`
  query UnifiedGps(
    $source: String
    $date_from: String
    $date_to: String
    $limit: Int
    $offset: Int
    $order: SortOrder
  ) {
    unifiedGps(
      source: $source
      date_from: $date_from
      date_to: $date_to
      limit: $limit
      offset: $offset
      order: $order
    ) {
      items {
        source
        identifier
        latitude
        longitude
        timestamp
        accuracy
        battery
        speed_kmh
        heart_rate
        created_at
      }
      total
      limit
      offset
    }
  }
`

export const DAILY_SUMMARY_QUERY = gql`
  query DailySummary($date_from: String, $date_to: String, $limit: Int) {
    dailySummary(date_from: $date_from, date_to: $date_to, limit: $limit) {
      activity_date
      owntracks_device
      owntracks_points
      min_battery
      max_battery
      avg_accuracy
      garmin_sport
      garmin_activities
      total_distance_km
      total_duration_seconds
      avg_heart_rate
      total_calories
    }
  }
`

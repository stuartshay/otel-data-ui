import { gql } from '@apollo/client'

export const LOCATIONS_QUERY = gql`
  query Locations(
    $device_id: String
    $date_from: String
    $date_to: String
    $limit: Int
    $offset: Int
    $sort: String
    $order: SortOrder
  ) {
    locations(
      device_id: $device_id
      date_from: $date_from
      date_to: $date_to
      limit: $limit
      offset: $offset
      sort: $sort
      order: $order
    ) {
      items {
        id
        device_id
        tid
        latitude
        longitude
        accuracy
        altitude
        velocity
        battery
        battery_status
        connection_type
        trigger
        timestamp
        created_at
      }
      total
      limit
      offset
    }
  }
`

export const LOCATION_DETAIL_QUERY = gql`
  query LocationDetail($id: Int!) {
    location(id: $id) {
      id
      device_id
      tid
      latitude
      longitude
      accuracy
      altitude
      velocity
      battery
      battery_status
      connection_type
      trigger
      timestamp
      created_at
      raw_payload
    }
  }
`

export const DEVICES_QUERY = gql`
  query Devices {
    devices {
      device_id
    }
  }
`

export const LOCATION_COUNT_QUERY = gql`
  query LocationCount($date: String, $device_id: String) {
    locationCount(date: $date, device_id: $device_id) {
      count
      date
      device_id
    }
  }
`

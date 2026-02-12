import { gql } from '@apollo/client'

export const REFERENCE_LOCATIONS_QUERY = gql`
  query ReferenceLocations {
    referenceLocations {
      id
      name
      latitude
      longitude
      radius_meters
      description
      created_at
      updated_at
    }
  }
`

export const REFERENCE_LOCATION_QUERY = gql`
  query ReferenceLocation($id: Int!) {
    referenceLocation(id: $id) {
      id
      name
      latitude
      longitude
      radius_meters
      description
      created_at
      updated_at
    }
  }
`

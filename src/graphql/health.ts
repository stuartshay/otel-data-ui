import { gql } from '@apollo/client'

export const HEALTH_QUERY = gql`
  query Health {
    health {
      status
      version
    }
  }
`

export const READY_QUERY = gql`
  query Ready {
    ready {
      status
      database
      version
    }
  }
`

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { getConfig } from '@/config/runtime'

let client: ApolloClient | null = null

export function getApolloClient(): ApolloClient {
  if (client) return client

  const graphqlUrl = getConfig(
    'GRAPHQL_URL',
    'https://gateway.lab.informationcart.com',
  )

  const httpLink = new HttpLink({
    uri: graphqlUrl,
  })

  client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  })

  return client
}

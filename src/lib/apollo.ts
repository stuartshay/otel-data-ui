import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  HttpLink,
} from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { getConfig } from '@/config/runtime'
import { authService } from '@/services/auth'

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

  const authLink = new SetContextLink(async ({ headers }) => {
    const token = await authService.getAccessToken()
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  })

  client = new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  })

  return client
}

import { beforeEach, describe, expect, it, vi } from 'vitest'

const apolloMocks = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  HttpLinkMock: vi.fn(function HttpLink(options) {
    return {
      type: 'http-link',
      ...options,
    }
  }),
  InMemoryCacheMock: vi.fn(function InMemoryCache() {
    return {
      type: 'cache',
    }
  }),
  ApolloClientMock: vi.fn(function ApolloClient(options) {
    return {
      options,
    }
  }),
}))

vi.mock('@/config/runtime', () => ({
  getConfig: apolloMocks.getConfigMock,
}))

vi.mock('@apollo/client', () => ({
  ApolloClient: apolloMocks.ApolloClientMock,
  HttpLink: apolloMocks.HttpLinkMock,
  InMemoryCache: apolloMocks.InMemoryCacheMock,
}))

describe('apollo client', () => {
  beforeEach(() => {
    vi.resetModules()
    apolloMocks.getConfigMock.mockReset()
    apolloMocks.HttpLinkMock.mockClear()
    apolloMocks.InMemoryCacheMock.mockClear()
    apolloMocks.ApolloClientMock.mockClear()
    apolloMocks.getConfigMock.mockReturnValue(
      'https://graphql.example.com/query',
    )
  })

  it('creates and caches a configured Apollo client', async () => {
    const { getApolloClient } = await import('./apollo')

    const first = getApolloClient()
    const second = getApolloClient()
    const createdOptions = apolloMocks.ApolloClientMock.mock.results[0]?.value
      .options as {
      defaultOptions: {
        watchQuery: {
          fetchPolicy: string
        }
      }
    }

    expect(first).toBe(second)
    expect(apolloMocks.getConfigMock).toHaveBeenCalledWith(
      'GRAPHQL_URL',
      'https://gateway.lab.informationcart.com',
    )
    expect(apolloMocks.HttpLinkMock).toHaveBeenCalledWith({
      uri: 'https://graphql.example.com/query',
    })
    expect(apolloMocks.InMemoryCacheMock).toHaveBeenCalledTimes(1)
    expect(apolloMocks.ApolloClientMock).toHaveBeenCalledTimes(1)
    expect(createdOptions.defaultOptions.watchQuery.fetchPolicy).toBe(
      'cache-and-network',
    )
  })
})

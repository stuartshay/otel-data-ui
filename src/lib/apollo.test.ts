import { beforeEach, describe, expect, it, vi } from 'vitest'

const apolloMocks = vi.hoisted(() => {
  const concatMock = vi.fn(function concat(link: unknown) {
    return { type: 'combined-link', inner: link }
  })
  return {
    getConfigMock: vi.fn(),
    HttpLinkMock: vi.fn(function HttpLink(options: unknown) {
      return {
        type: 'http-link',
        ...((options as Record<string, unknown>) ?? {}),
      }
    }),
    InMemoryCacheMock: vi.fn(function InMemoryCache() {
      return {
        type: 'cache',
      }
    }),
    ApolloClientMock: vi.fn(function ApolloClient(options: unknown) {
      return {
        options,
      }
    }),
    setContextMock: vi.fn(() => ({ type: 'auth-link', concat: concatMock })),
    concatMock,
    getAccessTokenMock: vi.fn().mockResolvedValue(null),
  }
})

vi.mock('@/config/runtime', () => ({
  getConfig: apolloMocks.getConfigMock,
}))

vi.mock('@apollo/client', () => ({
  ApolloClient: apolloMocks.ApolloClientMock,
  HttpLink: apolloMocks.HttpLinkMock,
  InMemoryCache: apolloMocks.InMemoryCacheMock,
}))

vi.mock('@apollo/client/link/context', () => ({
  setContext: apolloMocks.setContextMock,
}))

vi.mock('@/services/auth', () => ({
  authService: {
    getAccessToken: apolloMocks.getAccessTokenMock,
  },
}))

describe('apollo client', () => {
  beforeEach(() => {
    vi.resetModules()
    apolloMocks.getConfigMock.mockReset()
    apolloMocks.HttpLinkMock.mockClear()
    apolloMocks.InMemoryCacheMock.mockClear()
    apolloMocks.ApolloClientMock.mockClear()
    apolloMocks.setContextMock.mockClear()
    apolloMocks.concatMock.mockClear()
    apolloMocks.getAccessTokenMock.mockReset().mockResolvedValue(null)
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
    expect(apolloMocks.setContextMock).toHaveBeenCalledTimes(1)
    expect(apolloMocks.concatMock).toHaveBeenCalledTimes(1)
    expect(createdOptions.defaultOptions.watchQuery.fetchPolicy).toBe(
      'cache-and-network',
    )
  })

  it('attaches Bearer token when authService returns a token', async () => {
    const { getApolloClient } = await import('./apollo')
    getApolloClient()

    const contextFn = apolloMocks.setContextMock.mock.calls[0][0] as (
      req: unknown,
      prev: { headers?: Record<string, string> },
    ) => Promise<{ headers: Record<string, string> }>

    apolloMocks.getAccessTokenMock.mockResolvedValue('my-jwt')
    const result = await contextFn({}, { headers: { 'X-Custom': 'val' } })

    expect(result.headers).toEqual({
      'X-Custom': 'val',
      Authorization: 'Bearer my-jwt',
    })
  })

  it('omits Authorization header when no token is available', async () => {
    const { getApolloClient } = await import('./apollo')
    getApolloClient()

    const contextFn = apolloMocks.setContextMock.mock.calls[0][0] as (
      req: unknown,
      prev: { headers?: Record<string, string> },
    ) => Promise<{ headers: Record<string, string> }>

    apolloMocks.getAccessTokenMock.mockResolvedValue(null)
    const result = await contextFn({}, {})

    expect(result.headers).not.toHaveProperty('Authorization')
  })
})

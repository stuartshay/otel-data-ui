import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => {
  const accessTokenExpiringHandlers: Array<() => void> = []
  const accessTokenExpiredHandlers: Array<() => void> = []
  const silentRenewErrorHandlers: Array<(error: unknown) => void> = []

  const userManager = {
    events: {
      addAccessTokenExpiring: vi.fn((handler: () => void) => {
        accessTokenExpiringHandlers.push(handler)
      }),
      addAccessTokenExpired: vi.fn((handler: () => void) => {
        accessTokenExpiredHandlers.push(handler)
      }),
      addSilentRenewError: vi.fn((handler: (error: unknown) => void) => {
        silentRenewErrorHandlers.push(handler)
      }),
    },
    signinRedirect: vi.fn(),
    signinRedirectCallback: vi.fn(),
    removeUser: vi.fn(),
    getUser: vi.fn(),
  }

  return {
    accessTokenExpiringHandlers,
    accessTokenExpiredHandlers,
    silentRenewErrorHandlers,
    userManager,
    config: {} as Record<string, unknown>,
    UserManagerMock: vi.fn(function UserManager(
      config: Record<string, unknown>,
    ) {
      authMocks.config = config
      return authMocks.userManager
    }),
    WebStorageStateStoreMock: vi.fn(function WebStorageStateStore(
      options: Record<string, unknown>,
    ) {
      return { options }
    }),
  }
})

vi.mock('@/config/runtime', () => ({
  getConfig: vi.fn((key: string) => {
    const values: Record<string, string> = {
      COGNITO_DOMAIN: 'auth.example.com',
      COGNITO_CLIENT_ID: 'client-123',
      COGNITO_REDIRECT_URI: 'https://data-ui.example.com/callback',
      COGNITO_ISSUER: 'https://issuer.example.com',
    }

    return values[key]
  }),
}))

vi.mock('oidc-client-ts', () => ({
  UserManager: authMocks.UserManagerMock,
  WebStorageStateStore: authMocks.WebStorageStateStoreMock,
}))

describe('authService', () => {
  beforeEach(() => {
    vi.resetModules()
    authMocks.accessTokenExpiringHandlers.length = 0
    authMocks.accessTokenExpiredHandlers.length = 0
    authMocks.silentRenewErrorHandlers.length = 0
    authMocks.UserManagerMock.mockClear()
    authMocks.WebStorageStateStoreMock.mockClear()
    authMocks.userManager.events.addAccessTokenExpiring.mockClear()
    authMocks.userManager.events.addAccessTokenExpired.mockClear()
    authMocks.userManager.events.addSilentRenewError.mockClear()
    authMocks.userManager.signinRedirect.mockReset()
    authMocks.userManager.signinRedirectCallback.mockReset()
    authMocks.userManager.removeUser.mockReset()
    authMocks.userManager.getUser.mockReset()
    window.history.replaceState({}, '', '/garmin/42')
  })

  it('creates the user manager with Cognito metadata and local storage state', async () => {
    await import('./auth')

    expect(authMocks.WebStorageStateStoreMock).toHaveBeenCalledWith({
      store: window.localStorage,
    })
    expect(authMocks.UserManagerMock).toHaveBeenCalledTimes(1)
    expect(authMocks.config.authority).toBe('https://issuer.example.com')
    expect(authMocks.config.client_id).toBe('client-123')
    expect(authMocks.config.redirect_uri).toBe(
      'https://data-ui.example.com/callback',
    )
    expect(authMocks.config.silent_redirect_uri).toBe(
      `${window.location.origin}/silent-renew.html`,
    )
    expect(authMocks.config.metadata).toEqual({
      issuer: 'https://issuer.example.com',
      authorization_endpoint: 'https://auth.example.com/oauth2/authorize',
      token_endpoint: 'https://auth.example.com/oauth2/token',
      userinfo_endpoint: 'https://auth.example.com/oauth2/userInfo',
    })
  })

  it('passes the current pathname through the login redirect state', async () => {
    const { authService } = await import('./auth')
    authMocks.userManager.signinRedirect.mockResolvedValue(undefined)

    await authService.login()

    expect(authMocks.userManager.signinRedirect).toHaveBeenCalledWith({
      state: '/garmin/42',
    })
  })

  it('restores the saved route after the redirect callback', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const { authService } = await import('./auth')
    authMocks.userManager.signinRedirectCallback.mockResolvedValue({
      state: '/garmin?page=2',
    })

    const user = await authService.handleCallback()

    expect(user.state).toBe('/garmin?page=2')
    expect(replaceStateSpy).toHaveBeenCalledWith(
      {},
      document.title,
      '/garmin?page=2',
    )
  })

  it('derives auth state, access token, and profile from the current user', async () => {
    const { authService } = await import('./auth')
    authMocks.userManager.getUser.mockResolvedValue({
      expired: false,
      access_token: 'token-123',
      profile: {
        email: 'runner@example.com',
        name: 'Runner',
        sub: 'sub-123',
      },
    })

    await expect(authService.isAuthenticated()).resolves.toBe(true)
    await expect(authService.getAccessToken()).resolves.toBe('token-123')
    await expect(authService.getUserProfile()).resolves.toEqual({
      email: 'runner@example.com',
      name: 'Runner',
      sub: 'sub-123',
    })
  })

  it('registers token event handlers that trigger logout on terminal failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { authService } = await import('./auth')
    const logoutSpy = vi
      .spyOn(authService, 'logout')
      .mockResolvedValue(undefined)

    authMocks.accessTokenExpiredHandlers[0]()
    authMocks.silentRenewErrorHandlers[0](new Error('renew failed'))

    expect(logoutSpy).toHaveBeenCalledTimes(2)

    errorSpy.mockRestore()
  })
})

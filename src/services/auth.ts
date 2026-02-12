import { UserManager, type User, WebStorageStateStore } from 'oidc-client-ts'
import { getConfig } from '@/config/runtime'

const cognitoDomain = getConfig('COGNITO_DOMAIN')
const clientId = getConfig('COGNITO_CLIENT_ID')
const redirectUri = getConfig('COGNITO_REDIRECT_URI')
const issuer = getConfig('COGNITO_ISSUER')

const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return redirectUri.replace(/\/callback$/, '')
}

const createStateStore = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return new WebStorageStateStore({
    store: window.localStorage,
  })
}

const stateStore = createStateStore()

const userManagerConfig = {
  authority: issuer,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'openid profile email',
  get post_logout_redirect_uri() {
    return getOrigin()
  },
  userStore: stateStore,
  stateStore: stateStore,
  automaticSilentRenew: true,
  get silent_redirect_uri() {
    return `${getOrigin()}/silent-renew.html`
  },
  metadata: {
    issuer: issuer,
    authorization_endpoint: `https://${cognitoDomain}/oauth2/authorize`,
    token_endpoint: `https://${cognitoDomain}/oauth2/token`,
    userinfo_endpoint: `https://${cognitoDomain}/oauth2/userInfo`,
  },
}

const userManager = new UserManager(userManagerConfig)

class AuthService {
  private userManager: UserManager

  constructor() {
    this.userManager = userManager

    this.userManager.events.addAccessTokenExpiring(() => {
      console.log('Access token expiring, attempting silent renewal...')
    })

    this.userManager.events.addAccessTokenExpired(() => {
      console.log('Access token expired')
      this.logout()
    })

    this.userManager.events.addSilentRenewError((error) => {
      console.error('Silent renew error:', error)
      this.logout()
    })
  }

  async login(): Promise<void> {
    await this.userManager.signinRedirect({
      state: window.location.pathname,
    })
  }

  async handleCallback(): Promise<User> {
    const user = await this.userManager.signinRedirectCallback()
    const returnUrl =
      (typeof user.state === 'string' ? user.state : null) || '/'
    window.history.replaceState({}, document.title, returnUrl)
    return user
  }

  async logout(): Promise<void> {
    await this.userManager.removeUser()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const logoutUrl = `https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(origin + '/')}`
    window.location.href = logoutUrl
  }

  async getUser(): Promise<User | null> {
    return await this.userManager.getUser()
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser()
    return user !== null && !user.expired
  }

  async getAccessToken(): Promise<string | null> {
    const user = await this.getUser()
    return user?.access_token || null
  }

  async getUserProfile(): Promise<{
    email?: string
    name?: string
    sub?: string
  } | null> {
    const user = await this.getUser()
    if (!user) return null
    return {
      email: user.profile.email as string,
      name: user.profile.name as string,
      sub: user.profile.sub as string,
    }
  }
}

export const authService = new AuthService()
export default authService

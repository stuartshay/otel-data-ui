import { describe, expect, it, vi } from 'vitest'
import { getAllConfig, getConfig } from './runtime'

describe('runtime config', () => {
  it('prefers runtime window config over Vite env values', () => {
    window.__ENV__ = {
      GRAPHQL_URL: 'https://runtime.example.com/graphql',
      COGNITO_DOMAIN: 'runtime-domain',
      COGNITO_CLIENT_ID: 'runtime-client',
      COGNITO_REDIRECT_URI: 'https://runtime.example.com/callback',
      COGNITO_ISSUER: 'https://issuer.runtime.example.com',
      APP_VERSION: '2.3.4',
      APP_NAME: 'runtime-ui',
      NRBA_ACCOUNT_ID: '',
      NRBA_APPLICATION_ID: '',
      NRBA_LICENSE_KEY: '',
      NRBA_TRUST_KEY: '',
      NRBA_AGENT_ID: '',
    }
    vi.stubEnv('VITE_GRAPHQL_URL', 'https://vite.example.com/graphql')

    expect(getConfig('GRAPHQL_URL')).toBe('https://runtime.example.com/graphql')
  })

  it('falls back to Vite env values when runtime config is absent', () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'env-domain')

    expect(getConfig('COGNITO_DOMAIN')).toBe('env-domain')
  })

  it('uses the provided fallback for missing optional config', () => {
    expect(getConfig('APP_VERSION', 'dev')).toBe('dev')
  })

  it('throws when required configuration is missing', () => {
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '')

    expect(() => getConfig('COGNITO_CLIENT_ID')).toThrow(
      'Missing required configuration: COGNITO_CLIENT_ID',
    )
  })

  it('returns the full configuration object with defaults', () => {
    window.__ENV__ = {
      GRAPHQL_URL: 'https://runtime.example.com/graphql',
      COGNITO_DOMAIN: 'runtime-domain',
      COGNITO_CLIENT_ID: 'runtime-client',
      COGNITO_REDIRECT_URI: 'https://runtime.example.com/callback',
      COGNITO_ISSUER: 'https://issuer.runtime.example.com',
      APP_VERSION: '9.9.9',
      APP_NAME: 'otel-data-ui-runtime',
      NRBA_ACCOUNT_ID: '',
      NRBA_APPLICATION_ID: '',
      NRBA_LICENSE_KEY: '',
      NRBA_TRUST_KEY: '',
      NRBA_AGENT_ID: '',
    }

    expect(getAllConfig()).toEqual({
      GRAPHQL_URL: 'https://runtime.example.com/graphql',
      COGNITO_DOMAIN: 'runtime-domain',
      COGNITO_CLIENT_ID: 'runtime-client',
      COGNITO_REDIRECT_URI: 'https://runtime.example.com/callback',
      COGNITO_ISSUER: 'https://issuer.runtime.example.com',
      APP_VERSION: '9.9.9',
      APP_NAME: 'otel-data-ui-runtime',
      NRBA_ACCOUNT_ID: '',
      NRBA_APPLICATION_ID: '',
      NRBA_LICENSE_KEY: '',
      NRBA_TRUST_KEY: '',
      NRBA_AGENT_ID: '',
    })
  })
})

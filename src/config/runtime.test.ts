import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllConfig, getConfig } from './runtime'

describe('runtime config', () => {
  beforeEach(() => {
    // window.__ENV__ is a mutable global; without resetting it, tests that
    // don't set it themselves can silently inherit a previous test's value.
    window.__ENV__ = undefined
    // Vite loads .env.local into import.meta.env for test runs same as
    // dev/build. A developer's local values there would otherwise leak
    // into these tests non-deterministically once an empty window.__ENV__
    // value correctly falls through to it.
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_NRBA_ACCOUNT_ID', '')
    vi.stubEnv('VITE_NRBA_APPLICATION_ID', '')
    vi.stubEnv('VITE_NRBA_LICENSE_KEY', '')
    vi.stubEnv('VITE_NRBA_TRUST_KEY', '')
    vi.stubEnv('VITE_NRBA_AGENT_ID', '')
    vi.stubEnv('VITE_APP_VERSION', '')
  })

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
      GEOCODER_URL: 'https://geocoder.runtime.example.com',
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

  it('uses the provided fallback when window.__ENV__ has an empty string', () => {
    // entrypoint.sh writes every window.__ENV__ key, even when the
    // underlying container env var is unset -- an empty string there must
    // not shadow a caller-supplied fallback (regression: this silently
    // zeroed out NRBA_TRUST_KEY/NRBA_AGENT_ID at runtime).
    window.__ENV__ = {
      GRAPHQL_URL: 'https://runtime.example.com/graphql',
      COGNITO_DOMAIN: 'runtime-domain',
      COGNITO_CLIENT_ID: 'runtime-client',
      COGNITO_REDIRECT_URI: 'https://runtime.example.com/callback',
      COGNITO_ISSUER: 'https://issuer.runtime.example.com',
      APP_VERSION: '2.3.4',
      APP_NAME: 'runtime-ui',
      NRBA_ACCOUNT_ID: '7574022',
      NRBA_APPLICATION_ID: '1134672998',
      NRBA_LICENSE_KEY: 'test-license-key',
      NRBA_TRUST_KEY: '',
      NRBA_AGENT_ID: '',
      GEOCODER_URL: 'https://geocoder.runtime.example.com',
    }

    expect(getConfig('NRBA_TRUST_KEY', '7574022')).toBe('7574022')
    expect(getConfig('NRBA_AGENT_ID', '1134672998')).toBe('1134672998')
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
      GEOCODER_URL: 'https://geocoder.runtime.example.com',
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
      GEOCODER_URL: 'https://geocoder.runtime.example.com',
    })
  })
})

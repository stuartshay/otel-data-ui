interface RuntimeConfig {
  GRAPHQL_URL: string
  COGNITO_DOMAIN: string
  COGNITO_CLIENT_ID: string
  COGNITO_REDIRECT_URI: string
  COGNITO_ISSUER: string
  APP_VERSION: string
  APP_NAME: string
}

declare global {
  interface Window {
    __ENV__?: RuntimeConfig
  }
}

export function getConfig<K extends keyof RuntimeConfig>(
  key: K,
  fallback?: string,
): string {
  if (typeof window !== 'undefined' && window.__ENV__) {
    const value = window.__ENV__[key]
    if (value) return value
  }

  const envKey = `VITE_${key}`
  const envValue = import.meta.env[envKey]
  if (envValue) return envValue

  if (fallback) return fallback

  throw new Error(`Missing required configuration: ${key}`)
}

export function getAllConfig(): RuntimeConfig {
  return {
    GRAPHQL_URL: getConfig(
      'GRAPHQL_URL',
      'https://gateway.lab.informationcart.com',
    ),
    COGNITO_DOMAIN: getConfig('COGNITO_DOMAIN'),
    COGNITO_CLIENT_ID: getConfig('COGNITO_CLIENT_ID'),
    COGNITO_REDIRECT_URI: getConfig('COGNITO_REDIRECT_URI'),
    COGNITO_ISSUER: getConfig('COGNITO_ISSUER'),
    APP_VERSION: getConfig('APP_VERSION', 'dev'),
    APP_NAME: getConfig('APP_NAME', 'otel-data-ui'),
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  BrowserAgentMock: vi.fn(function BrowserAgent() {
    return {
      setCustomAttribute: vi.fn(),
    }
  }),
}))

vi.mock('@/config/runtime', () => ({
  getConfig: mocks.getConfigMock,
}))

vi.mock('@newrelic/browser-agent/loaders/browser-agent', () => ({
  BrowserAgent: mocks.BrowserAgentMock,
}))

describe('newrelic-browser', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.getConfigMock.mockReset()
    mocks.BrowserAgentMock.mockClear()
  })

  it('skips init when NRBA_ACCOUNT_ID is empty', async () => {
    mocks.getConfigMock.mockReturnValue('')

    const { initNewRelicBrowser } = await import('./newrelic-browser')
    initNewRelicBrowser()

    expect(mocks.BrowserAgentMock).not.toHaveBeenCalled()
  })

  it('skips init when NRBA_APPLICATION_ID is missing', async () => {
    mocks.getConfigMock.mockImplementation((key: string) => {
      if (key === 'NRBA_ACCOUNT_ID') return '12345'
      return ''
    })

    const { initNewRelicBrowser } = await import('./newrelic-browser')
    initNewRelicBrowser()

    expect(mocks.BrowserAgentMock).not.toHaveBeenCalled()
  })

  it('creates BrowserAgent when all required config is present', async () => {
    mocks.getConfigMock.mockImplementation((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        NRBA_ACCOUNT_ID: '12345',
        NRBA_APPLICATION_ID: '67890',
        NRBA_LICENSE_KEY: 'test-license-key',
      }
      return values[key] ?? fallback ?? ''
    })

    const { initNewRelicBrowser } = await import('./newrelic-browser')
    initNewRelicBrowser()

    expect(mocks.BrowserAgentMock).toHaveBeenCalledTimes(1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (mocks.BrowserAgentMock.mock.calls as any[][])[0][0]
    expect(config.info.applicationID).toBe('67890')
    expect(config.info.licenseKey).toBe('test-license-key')
    expect(config.loader_config.accountID).toBe('12345')
    // The agent's own beacon endpoint must stay out of AJAX monitoring, or
    // it generates events for its own telemetry uploads.
    expect(config.init.ajax.deny_list).toContain('bam.nr-data.net')
  })

  it('allows distributed tracing headers on the GraphQL gateway origin', async () => {
    mocks.getConfigMock.mockImplementation((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        NRBA_ACCOUNT_ID: '12345',
        NRBA_APPLICATION_ID: '67890',
        NRBA_LICENSE_KEY: 'test-license-key',
        GRAPHQL_URL: 'https://gateway.lab.informationcart.com',
      }
      return values[key] ?? fallback ?? ''
    })

    const { initNewRelicBrowser } = await import('./newrelic-browser')
    initNewRelicBrowser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (mocks.BrowserAgentMock.mock.calls as any[][])[0][0]
    expect(config.init.distributed_tracing.enabled).toBe(true)
    expect(config.init.distributed_tracing.cors_use_tracecontext_headers).toBe(
      true,
    )
    expect(config.init.distributed_tracing.allowed_origins).toEqual([
      'https://gateway.lab.informationcart.com',
    ])
  })

  it('does not throw when BrowserAgent constructor throws', async () => {
    mocks.getConfigMock.mockImplementation((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        NRBA_ACCOUNT_ID: '12345',
        NRBA_APPLICATION_ID: '67890',
        NRBA_LICENSE_KEY: 'test-license-key',
      }
      return values[key] ?? fallback ?? ''
    })
    mocks.BrowserAgentMock.mockImplementation(() => {
      throw new Error('NR init failure')
    })

    const { initNewRelicBrowser } = await import('./newrelic-browser')
    expect(() => initNewRelicBrowser()).not.toThrow()
  })

  it('setNRCustomAttribute is safe to call before init', async () => {
    mocks.getConfigMock.mockReturnValue('')

    const { setNRCustomAttribute } = await import('./newrelic-browser')
    expect(() => setNRCustomAttribute('garmin.flow', true)).not.toThrow()
  })

  it('setNRCustomAttribute delegates to agent after init', async () => {
    const setCustomAttribute = vi.fn()
    mocks.BrowserAgentMock.mockImplementation(function BrowserAgent() {
      return { setCustomAttribute }
    })
    mocks.getConfigMock.mockImplementation((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        NRBA_ACCOUNT_ID: '12345',
        NRBA_APPLICATION_ID: '67890',
        NRBA_LICENSE_KEY: 'test-license-key',
      }
      return values[key] ?? fallback ?? ''
    })

    const { initNewRelicBrowser, setNRCustomAttribute } =
      await import('./newrelic-browser')
    initNewRelicBrowser()
    setNRCustomAttribute('garmin.flow', true)

    expect(setCustomAttribute).toHaveBeenCalledWith('garmin.flow', true)
  })
})

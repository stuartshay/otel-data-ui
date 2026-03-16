/**
 * New Relic Browser Agent (RUM) initialization.
 *
 * Requires account-specific values from New Relic → Browser → Setup:
 * - NRBA_ACCOUNT_ID
 * - NRBA_APPLICATION_ID
 * - NRBA_LICENSE_KEY
 * - NRBA_TRUST_KEY (optional, defaults to ACCOUNT_ID)
 * - NRBA_AGENT_ID (optional, defaults to APPLICATION_ID)
 *
 * Set these via VITE_ env vars (.env.local) or window.__ENV__ (runtime config).
 * When NRBA_ACCOUNT_ID is absent, initialization is silently skipped.
 */
import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

import { getConfig } from '@/config/runtime'

let agent: BrowserAgent | null = null

export function initNewRelicBrowser(): void {
  try {
    const accountId = getConfig('NRBA_ACCOUNT_ID', '')
    if (!accountId) return // NR not configured — skip silently

    const applicationId = getConfig('NRBA_APPLICATION_ID', '')
    const licenseKey = getConfig('NRBA_LICENSE_KEY', '')
    if (!applicationId || !licenseKey) return

    agent = new BrowserAgent({
      init: {
        distributed_tracing: { enabled: true },
        privacy: { cookies_enabled: true },
        ajax: { deny_list: [] },
      },
      info: {
        beacon: 'bam.nr-data.net',
        errorBeacon: 'bam.nr-data.net',
        licenseKey,
        applicationID: applicationId,
        sa: 1,
      },
      loader_config: {
        accountID: accountId,
        trustKey: getConfig('NRBA_TRUST_KEY', accountId),
        agentID: getConfig('NRBA_AGENT_ID', applicationId),
        licenseKey,
        applicationID: applicationId,
      },
    })
  } catch {
    // NR init failure should never break the app
  }
}

/**
 * Add custom attributes to the current NR Browser session.
 * Use this to tag Garmin-related page views with `garmin.flow: true`.
 */
export function setNRCustomAttribute(
  key: string,
  value: string | number | boolean,
): void {
  try {
    agent?.setCustomAttribute(key, value)
  } catch {
    // ignore
  }
}

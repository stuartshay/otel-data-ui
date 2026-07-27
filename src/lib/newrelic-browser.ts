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

    // distributed_tracing.enabled alone doesn't add trace headers to
    // cross-origin requests (the gateway is a different origin from this
    // app) -- it needs the gateway's origin in allowed_origins, or the
    // agent withholds the headers to avoid an unexpected CORS surface on
    // third-party origins. cors_use_tracecontext_headers sends the
    // standard W3C traceparent/tracestate headers (not just NR's
    // proprietary `newrelic` header), which is what the gateway's
    // OpenTelemetry SDK already knows how to continue as a parent span.
    //
    // Parsed defensively and outside the outer try: a malformed or
    // relative GRAPHQL_URL must not abort NR agent init entirely (it would
    // otherwise silently disable the agent even with valid NRBA config).
    let graphqlOrigin: string | undefined
    try {
      graphqlOrigin = new URL(
        getConfig('GRAPHQL_URL', 'https://gateway.lab.informationcart.com'),
        window.location.origin,
      ).origin
    } catch {
      graphqlOrigin = undefined
    }

    agent = new BrowserAgent({
      init: {
        distributed_tracing: {
          enabled: true,
          cors_use_tracecontext_headers: true,
          allowed_origins: graphqlOrigin ? [graphqlOrigin] : [],
        },
        privacy: { cookies_enabled: true },
        // Exclude the agent's own beacon endpoint so it doesn't monitor
        // (and generate AJAX events for) its own telemetry uploads.
        ajax: { deny_list: ['bam.nr-data.net'] },
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

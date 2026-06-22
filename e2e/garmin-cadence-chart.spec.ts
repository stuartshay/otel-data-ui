import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'cadence-chart')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Verifies the Cadence chart on the Garmin activity detail Charts tab.
 * Cadence (rpm) renders with the same functionality as the other charts
 * (average label, hover sync, expand/collapse).
 *
 * Only two activities currently have cadence data: 23321402669 and
 * 23334238053. Default to the 58.2 km ride; override via
 * PLAYWRIGHT_GARMIN_CADENCE_ACTIVITY_ID.
 */
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_CADENCE_ACTIVITY_ID ?? '23334238053'

test.describe('Garmin Cadence chart', () => {
  test.setTimeout(60_000)

  test('renders the cadence chart with an average rpm label', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    // Charts is the default tab; click to be explicit/robust.
    await page.getByTestId('garmin-tab-charts').click()

    const cadenceChart = page.getByTestId('chart-cadence')
    await expect(cadenceChart).toBeVisible({ timeout: 20_000 })
    await expect(
      cadenceChart.getByText('Cadence', { exact: true }),
    ).toBeVisible()

    // Average label, e.g. "Avg: 71 rpm".
    await expect(cadenceChart.getByText(/Avg:\s*\d+\s*rpm/)).toBeVisible()

    // The chart draws a series (Recharts renders an SVG path).
    await expect(cadenceChart.locator('svg path').first()).toBeVisible()

    await cadenceChart.screenshot({
      path: path.join(SCREENSHOT_DIR, 'cadence-chart.png'),
    })
  })

  test('cadence chart can be collapsed and expanded like the other charts', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.getByTestId('garmin-tab-charts').click()

    const cadenceChart = page.getByTestId('chart-cadence')
    await expect(cadenceChart).toBeVisible({ timeout: 20_000 })

    await cadenceChart
      .getByRole('button', { name: /Minimize Cadence graph/i })
      .click()
    await expect(
      cadenceChart.getByRole('button', { name: /Expand Cadence graph/i }),
    ).toBeVisible()

    await cadenceChart.screenshot({
      path: path.join(SCREENSHOT_DIR, 'cadence-chart-collapsed.png'),
    })
  })
})

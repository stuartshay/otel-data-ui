import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-hr-zone-ribbon')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Verifies the Heart Rate chart renders the HR-zone ribbon and Z1-Z5 legend.
 * The ribbon visualizes intensity across the activity (Z3 ~ moderate,
 * Z4-Z5 ~ vigorous).
 *
 * Default activity 23334238053 is a 58.2 km ride spanning HR zones 1-4.
 * Override per-environment via PLAYWRIGHT_GARMIN_ZONE_ACTIVITY_ID.
 */
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_ZONE_ACTIVITY_ID ?? '23334238053'

test.describe('Garmin Heart Rate zone ribbon', () => {
  test('renders the HR zone ribbon and Z1-Z5 legend on the heart rate chart', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    // Charts is the default tab; click to be explicit/robust.
    await page.getByTestId('garmin-tab-charts').click()

    const heartRateCard = page.getByTestId('chart-heartRate')
    await expect(heartRateCard).toBeVisible({ timeout: 20_000 })

    const ribbon = page.getByTestId('heart-rate-zone-ribbon')
    await expect(ribbon).toBeVisible({ timeout: 20_000 })

    // The ribbon contains at least one colored zone segment.
    const segments = ribbon.locator('[title^="Heart rate zone"]')
    expect(await segments.count()).toBeGreaterThan(0)

    // The Z1-Z5 legend is present.
    const legend = page.getByLabel('Heart rate zone legend')
    await expect(legend).toBeVisible()
    for (const label of ['Z1', 'Z2', 'Z3', 'Z4', 'Z5']) {
      await expect(legend.getByText(label, { exact: true })).toBeVisible()
    }

    await heartRateCard.screenshot({
      path: path.join(SCREENSHOT_DIR, 'heart-rate-zone-ribbon.png'),
    })
  })
})

import { test, expect } from '@playwright/test'
import path from 'node:path'

/**
 * Captures PNG screenshots of the new "No data available" empty state on
 * the Garmin Activities and Locations pages by selecting a future date
 * range that is guaranteed to contain no records.
 */

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'empty-state')
// Far-future date range with no data.
const FUTURE_FROM = '2099-01-01'
const FUTURE_TO = '2099-01-07'

test.describe('Empty state screenshots', () => {
  test('Garmin Activities - empty state', async ({ page }) => {
    await page.goto(`/garmin?date_from=${FUTURE_FROM}&date_to=${FUTURE_TO}`)

    await expect(page.getByText('No data available')).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('button', { name: /clear filters/i }),
    ).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'garmin-empty.png'),
      fullPage: true,
    })
  })

  test('Locations - empty state', async ({ page }) => {
    await page.goto(`/locations?date_from=${FUTURE_FROM}&date_to=${FUTURE_TO}`)

    await expect(page.getByText('No data available')).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('button', { name: /clear filters/i }),
    ).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'locations-empty.png'),
      fullPage: true,
    })
  })
})

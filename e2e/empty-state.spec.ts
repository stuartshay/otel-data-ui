import { test, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Captures PNG screenshots of the new "No data available" empty state on
 * the Garmin Activities and Locations pages by selecting a future date
 * range that is guaranteed to contain no records.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'empty-state')
// Far-future date range with no data.
// Filters chosen to be guaranteed empty without relying on date clamping
// (the pages clamp future dates to the data's max date).
const EMPTY_SPORT = '__no_such_sport__'
const EMPTY_DEVICE = '__no_such_device__'

test.describe('Empty state screenshots', () => {
  test('Garmin Activities - empty state', async ({ page }) => {
    await page.goto(`/garmin?sport=${EMPTY_SPORT}`)

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
    await page.goto(`/locations?device=${EMPTY_DEVICE}`)

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

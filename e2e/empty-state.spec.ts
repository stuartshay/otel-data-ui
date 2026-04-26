import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Captures PNG screenshots of the new "No data available" empty state on
 * the Garmin Activities and Locations pages by applying impossible filter
 * values that are guaranteed to return no records without relying on
 * future dates, which the pages clamp to the data's max date.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'empty-state')
// Filter values chosen to be guaranteed empty.
// This avoids depending on date parameters or future-date clamping behavior.
const EMPTY_SPORT = '__no_such_sport__'
const EMPTY_DEVICE = '__no_such_device__'

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

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

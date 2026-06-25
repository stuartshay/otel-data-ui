import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

/**
 * Validates that the Garmin activity detail page surfaces recording-device
 * metadata (model + firmware) in the activity header.
 *
 * Uses an activity recorded by a device with known metadata. In the lab
 * dataset, activity 23358057937 was recorded by an "Edge 540 Solar"
 * (firmware 31.30). Override per-environment via
 * PLAYWRIGHT_GARMIN_DEVICE_ACTIVITY_ID.
 */
const DEVICE_ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_DEVICE_ACTIVITY_ID ?? '23358057937'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-device')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Garmin Activity Device Metadata', () => {
  test('activity header shows the recording device model and firmware', async ({
    page,
  }) => {
    await page.goto(`/garmin/${DEVICE_ACTIVITY_ID}`)

    // The stats bar confirms the activity detail page has loaded.
    await expect(page.getByText('Distance').first()).toBeVisible({
      timeout: 15_000,
    })

    const deviceBadge = page.getByTestId('device-badge')
    await expect(deviceBadge).toBeVisible({ timeout: 15_000 })

    // The badge must show a non-empty device model and a firmware version.
    await expect(deviceBadge).not.toHaveText('')
    await expect(deviceBadge).toContainText(/v\d/)

    await deviceBadge.screenshot({
      path: path.join(SCREENSHOT_DIR, 'device-badge.png'),
    })
  })
})

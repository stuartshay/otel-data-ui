import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-weather-hourly')
// 2024-06-22 cycling activity, ~4.5h (14051s), confirmed to have 5 rows in
// garmin_activity_weather_hourly as of the production backfill.
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_WEATHER_HOURLY_ACTIVITY_ID ?? '16047161090'

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Garmin Activity Weather - hourly breakdown', () => {
  test('shows the hourly breakdown for a known multi-hour activity', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    await expect(page.getByTestId('garmin-detail-tabs')).toBeVisible({
      timeout: 20_000,
    })
    await page.getByTestId('garmin-tab-stats').click()

    const weatherPanel = page.getByTestId('weather-panel')
    await expect(weatherPanel).toBeVisible({ timeout: 20_000 })

    const hourlyBreakdown = page.getByTestId('weather-hourly-breakdown')
    await expect(hourlyBreakdown).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Over the activity')).toBeVisible()

    await weatherPanel.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'weather-panel-full.png'),
      clip: await weatherPanel.boundingBox().then((box) => box ?? undefined),
    })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'stats-tab-full-page.png'),
      fullPage: true,
    })

    console.log(
      `[garmin-weather-hourly] activity=${ACTIVITY_ID} weather-hourly-breakdown present=true`,
    )
  })
})

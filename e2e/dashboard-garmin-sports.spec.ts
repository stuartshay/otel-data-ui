import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join(
  'e2e',
  'screenshots',
  'dashboard-garmin-sports',
)

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Dashboard Garmin Sports tile', () => {
  test.setTimeout(60_000)

  test('shows sport, device, and manual activity counts', async ({ page }) => {
    const prefix = `garmin-sports-${test.info().project.name}`

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })

    const card = page.getByTestId('garmin-sports-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card.getByText('Sports', { exact: true })).toBeVisible()
    await expect(card.getByText('Cycling')).toBeVisible()
    await expect(card.getByText('Devices')).toBeVisible({ timeout: 30_000 })
    await expect(card.getByTestId('garmin-device-row')).toHaveCount(2, {
      timeout: 30_000,
    })
    await expect(card.getByText('Edge 500')).toBeVisible()
    await expect(
      card.getByTestId('garmin-device-row').filter({ hasText: 'Edge 500' }),
    ).toContainText('1237')
    await expect(card.getByText('Edge 540 Solar')).toBeVisible()
    await expect(
      card
        .getByTestId('garmin-device-row')
        .filter({ hasText: 'Edge 540 Solar' }),
    ).toContainText('194')
    await expect(card.getByTestId('garmin-manual-row')).toContainText('Manual')
    await expect(card.getByTestId('garmin-manual-row')).toContainText('5')

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-card.png`),
    })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-dashboard.png`),
      fullPage: true,
    })
  })
})

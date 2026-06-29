import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-climbs')
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_CLIMB_ACTIVITY_ID ?? '23390888525'

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Garmin Activity Climbs', () => {
  test('renders selectable climbs with inline graph and map details', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    await expect(page.getByTestId('garmin-detail-tabs')).toBeVisible({
      timeout: 20_000,
    })
    await page.getByTestId('garmin-tab-climbs').click()

    const firstClimb = page.getByTestId('climb-row-1')
    const secondClimb = page.getByTestId('climb-row-2')
    const details = page.getByTestId('climb-details-panel')

    await expect(firstClimb).toBeVisible({ timeout: 20_000 })
    await expect(secondClimb).toBeVisible({ timeout: 20_000 })
    await expect(firstClimb).toHaveAttribute('aria-pressed', 'true')
    await expect(details).toContainText('Climb 1 of 2')
    await expect(page.getByTestId('climb-elevation-grade-chart')).toBeVisible()
    await expect(page.getByTestId('climb-segment-map')).toBeVisible({
      timeout: 20_000,
    })

    await secondClimb.click()
    await expect(secondClimb).toHaveAttribute('aria-pressed', 'true')
    await expect(details).toContainText('Climb 2 of 2')

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'climbs-inline-detail.png'),
      fullPage: true,
    })
  })
})

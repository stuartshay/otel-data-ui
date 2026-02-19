import { test, expect } from '@playwright/test'

/**
 * Validates that the Garmin activity detail page renders
 * Elevation and Speed charts using Recharts.
 *
 * By default uses activity 21100373038 which has ~14 906 track points
 * with altitude / speed data from a Garmin FIT file.
 *
 * The activity ID can be overridden per-environment via the
 * PLAYWRIGHT_GARMIN_ACTIVITY_ID environment variable.
 */
const ACTIVITY_ID = process.env.PLAYWRIGHT_GARMIN_ACTIVITY_ID ?? '21100373038'

test.describe('Garmin Activity Charts', () => {
  test('page loads and activity header is visible', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    // The activity stats bar should always render
    await expect(page.getByText('Distance').first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('renders Elevation chart card', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const elevationCard = page
      .locator('[class*="card"]')
      .filter({ hasText: 'Elevation' })
    await expect(elevationCard).toBeVisible({ timeout: 20_000 })

    // Recharts renders <path> elements inside the Area component
    const areaPaths = elevationCard.locator('.recharts-area-area')
    await expect(areaPaths).toHaveCount(1)
  })

  test('renders Speed chart card', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const speedCard = page
      .locator('[class*="card"]')
      .filter({ hasText: 'Speed' })
    await expect(speedCard).toBeVisible({ timeout: 20_000 })

    const areaPaths = speedCard.locator('.recharts-area-area')
    await expect(areaPaths).toHaveCount(1)
  })

  test('distance/time toggle buttons are visible', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await expect(
      page.locator('[class*="card"]').filter({ hasText: 'Elevation' }),
    ).toBeVisible({ timeout: 20_000 })

    const distanceBtn = page.getByRole('button', { name: 'Distance' })
    const timeBtn = page.getByRole('button', { name: 'Time' })

    await expect(distanceBtn).toBeVisible()
    await expect(timeBtn).toBeVisible()
  })

  test('switching to Time x-axis re-renders charts', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await expect(
      page.locator('[class*="card"]').filter({ hasText: 'Elevation' }),
    ).toBeVisible({ timeout: 20_000 })

    const timeBtn = page.getByRole('button', { name: 'Time' })
    await timeBtn.click()

    // Both Elevation and Speed charts should still be present after toggle
    const charts = page.locator('.recharts-responsive-container')
    await expect(charts).toHaveCount(2)
    await expect(charts.nth(0)).toBeVisible()
    await expect(charts.nth(1)).toBeVisible()
  })
})

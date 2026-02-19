import { test, expect } from '@playwright/test'

/**
 * Validates that the Garmin activity detail page renders
 * Elevation and Speed charts using Recharts.
 *
 * Uses activity 21100373038 which has ~14 906 track points
 * with altitude / speed data from a Garmin FIT file.
 */
const ACTIVITY_ID = '21100373038'

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
    await page.waitForSelector('.recharts-responsive-container', {
      timeout: 20_000,
    })

    const elevationCard = page
      .locator('[class*="card"]')
      .filter({ hasText: 'Elevation' })
    await expect(elevationCard).toBeVisible()

    // Recharts renders <path> elements inside the Area component
    const areaPaths = elevationCard.locator('.recharts-area-area')
    await expect(areaPaths).toHaveCount(1)
  })

  test('renders Speed chart card', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.waitForSelector('.recharts-responsive-container', {
      timeout: 20_000,
    })

    const speedCard = page
      .locator('[class*="card"]')
      .filter({ hasText: 'Speed' })
    await expect(speedCard).toBeVisible()

    const areaPaths = speedCard.locator('.recharts-area-area')
    await expect(areaPaths).toHaveCount(1)
  })

  test('distance/time toggle buttons are visible', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.waitForSelector('.recharts-responsive-container', {
      timeout: 20_000,
    })

    const distanceBtn = page.getByRole('button', { name: 'Distance' })
    const timeBtn = page.getByRole('button', { name: 'Time' })

    await expect(distanceBtn).toBeVisible()
    await expect(timeBtn).toBeVisible()
  })

  test('switching to Time x-axis re-renders charts', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.waitForSelector('.recharts-responsive-container', {
      timeout: 20_000,
    })

    const timeBtn = page.getByRole('button', { name: 'Time' })
    await timeBtn.click()

    // Charts should still be present after switching x-axis mode
    const charts = page.locator('.recharts-responsive-container')
    await expect(charts.first()).toBeVisible()
  })
})

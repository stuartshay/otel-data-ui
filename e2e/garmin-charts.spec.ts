import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-charts')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Validates that the Garmin activity detail page renders
 * Elevation and Speed charts using Recharts.
 *
 * By default uses activity 9965963574 which has ~2 425 track points
 * with altitude / speed data from a Garmin FIT file.
 *
 * The activity ID can be overridden per-environment via the
 * PLAYWRIGHT_GARMIN_ACTIVITY_ID environment variable.
 */
const ACTIVITY_ID = process.env.PLAYWRIGHT_GARMIN_ACTIVITY_ID ?? '9965963574'

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

    const elevationCard = page.getByTestId('chart-elevation')
    await expect(elevationCard).toBeVisible({ timeout: 20_000 })

    // Verify the chart SVG rendered with at least one visible path
    const paths = elevationCard.locator('svg path')
    await expect(paths.first()).toBeVisible()
  })

  test('renders Speed chart card', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const speedCard = page.getByTestId('chart-speed')
    await expect(speedCard).toBeVisible({ timeout: 20_000 })

    // Verify the chart SVG rendered with at least one visible path
    const paths = speedCard.locator('svg path')
    await expect(paths.first()).toBeVisible()
  })

  test('distance/time toggle buttons are visible', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await expect(page.getByTestId('chart-elevation')).toBeVisible({
      timeout: 20_000,
    })

    const distanceBtn = page.getByRole('button', { name: 'Distance' })
    const timeBtn = page.getByRole('button', { name: 'Time' })

    await expect(distanceBtn).toBeVisible()
    await expect(timeBtn).toBeVisible()
  })

  test('switching to Time x-axis re-renders charts', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await expect(page.getByTestId('chart-elevation')).toBeVisible({
      timeout: 20_000,
    })

    const timeBtn = page.getByRole('button', { name: 'Time' })
    await timeBtn.click()

    // Both Elevation and Speed charts should still be present after toggle
    const charts = page.locator('.recharts-responsive-container')
    await expect(charts).toHaveCount(2)
    await expect(charts.nth(0)).toBeVisible()
    await expect(charts.nth(1)).toBeVisible()
  })

  test('hovering one chart syncs the cursor and map marker', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const elevationCard = page.getByTestId('chart-elevation')
    const speedCard = page.getByTestId('chart-speed')
    const routeMap = page.getByTestId('activity-route-map')
    const details = page.getByTestId('activity-hover-details')

    await expect(elevationCard).toBeVisible({ timeout: 20_000 })
    await expect(speedCard).toBeVisible({ timeout: 20_000 })
    await expect(routeMap).toBeVisible({ timeout: 20_000 })
    await expect(details).toBeVisible()

    // Hover the middle of the Elevation chart's SVG.
    const elevationSvg = elevationCard.locator('.recharts-responsive-container')
    const box = await elevationSvg.boundingBox()
    if (!box) throw new Error('Elevation chart bounding box unavailable')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

    // Both charts should render a synced cursor line (Recharts syncId).
    await expect(elevationCard.locator('.recharts-tooltip-cursor')).toHaveCount(
      1,
      { timeout: 5_000 },
    )
    await expect(speedCard.locator('.recharts-tooltip-cursor')).toHaveCount(1, {
      timeout: 5_000,
    })

    // Hover details panel should now show a numeric Elevation value
    // (replaces the placeholder text).
    await expect(details).not.toContainText('Hover the Elevation', {
      timeout: 5_000,
    })
    await expect(details).toContainText('ft')
    await expect(details).toContainText('mph')

    // Leaflet hover marker is added to the route map. Target the dedicated
    // `activity-hover-marker` class so we don't match the route polylines or
    // the start/finish circle markers (which are also leaflet-interactive).
    const hoverMarker = routeMap.locator(
      '.leaflet-overlay-pane svg path.activity-hover-marker',
    )
    await expect(hoverMarker).toHaveCount(1, { timeout: 5_000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'synced-cursor-and-map.png'),
      fullPage: true,
    })

    // Moving the pointer off the charts should clear the shared state:
    // the details panel returns to its placeholder and the hover marker
    // is removed from the map.
    await page.mouse.move(0, 0)
    await expect(details).toContainText('Hover the Elevation', {
      timeout: 5_000,
    })
    await expect(hoverMarker).toHaveCount(0, { timeout: 5_000 })
  })
})

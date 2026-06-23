import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'cycling-in-focus')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Validates the "Cycling In Focus" dashboard card layout:
 * - The last-4-weeks activity strip renders all dots on a single row.
 * - The "Last 4w" label sits BELOW the dots (not beside them).
 *
 * Screenshots are saved to e2e/screenshots/cycling-in-focus/ for review.
 */
test.describe('Cycling In Focus card', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('activity dots render on one line with the label below', async ({
    page,
  }) => {
    const prefix = `cycling-in-focus-${test.info().project.name}`

    const card = page.locator('[data-testid="cycling-in-focus-card"]')
    await expect(card).toBeVisible({ timeout: 15_000 })

    const strip = card.locator('[data-testid="in-focus-activity-strip"]')
    await expect(strip).toBeVisible()

    // The strip should render one dot per day across the last 4 weeks (28).
    const dots = strip.locator('span')
    await expect(dots).toHaveCount(28)

    // All dots must sit on the same horizontal line: every dot shares the
    // same top coordinate as the first dot (within a 2px tolerance).
    const count = await dots.count()
    const firstBox = await dots.first().boundingBox()
    expect(firstBox).not.toBeNull()
    for (let i = 1; i < count; i += 1) {
      const box = await dots.nth(i).boundingBox()
      expect(box).not.toBeNull()
      expect(Math.abs((box?.y ?? 0) - (firstBox?.y ?? 0))).toBeLessThan(2)
    }

    // The "Last 4w" label must be positioned BELOW the dots.
    const label = card.getByText(/Last 4w/)
    await expect(label).toBeVisible()
    const stripBox = await strip.boundingBox()
    const labelBox = await label.boundingBox()
    expect(stripBox).not.toBeNull()
    expect(labelBox).not.toBeNull()
    expect(labelBox?.y ?? 0).toBeGreaterThanOrEqual(
      (stripBox?.y ?? 0) + (stripBox?.height ?? 0) - 1,
    )

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-card.png`),
    })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-dashboard.png`),
      fullPage: true,
    })
  })
})

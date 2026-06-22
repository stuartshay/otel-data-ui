import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-intensity-badge')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Validates the Garmin activity detail "Intensity Minutes" card:
 * Garmin counts vigorous minutes as 2x toward the total, and the Vigorous
 * row carries an "x2" multiplier badge (a dark filled pill matching Garmin
 * Connect).
 *
 * Default activity 23321402669 has moderate=21, vigorous=13, so the total is
 * 21 + 13 * 2 = 47. Override per-environment via
 * PLAYWRIGHT_GARMIN_INTENSITY_ACTIVITY_ID.
 */
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_INTENSITY_ACTIVITY_ID ?? '23321402669'

test.describe('Garmin Intensity Minutes badge', () => {
  test('vigorous row shows an x2 badge and the total counts vigorous as 2x', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    // The detailed stats (incl. Intensity Minutes) live under the Stats tab.
    await page.getByTestId('garmin-tab-stats').click()

    const heading = page.getByText('Intensity Minutes', { exact: true })
    await expect(heading).toBeVisible({ timeout: 20_000 })

    // Scope to the Intensity Minutes card (innermost div containing both the
    // heading and the Vigorous row).
    const card = page
      .locator('div')
      .filter({ has: heading })
      .filter({ hasText: 'Vigorous' })
      .last()

    const vigorousRow = card
      .locator('div')
      .filter({ hasText: 'Vigorous' })
      .last()
    await expect(vigorousRow).toContainText('13 min')

    const badge = vigorousRow.getByText('x2', { exact: true })
    await expect(badge).toBeVisible()

    // Total counts vigorous as 2x: 21 + 13 * 2 = 47.
    const totalRow = card.locator('div').filter({ hasText: 'Total' }).last()
    await expect(totalRow).toContainText('47 min')

    // The badge is a filled pill (non-transparent background), matching Garmin.
    const backgroundColor = await badge.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    )
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(backgroundColor).not.toBe('transparent')

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, 'intensity-minutes.png'),
    })
  })
})

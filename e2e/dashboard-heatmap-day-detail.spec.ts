import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'heatmap-day-detail')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Validates that clicking a day on the Dashboard Garmin Activity heatmap
 * opens a dialog listing the activities for that day, and that clicking
 * an activity link navigates to the Garmin activity detail page.
 */
test.describe('Dashboard Heatmap Day Detail', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
    // Wait for heatmap data to finish loading
    await expect(page.getByText('Less')).toBeVisible({ timeout: 30_000 })
  })

  test('clicking a colored day opens activity dialog and links to detail', async ({
    page,
  }) => {
    const prefix = `heatmap-day-${test.info().project.name}`

    // Find the first non-empty day cell
    const coloredDay = page
      .locator(
        '.garmin-heatmap svg rect.color-scale-1, .garmin-heatmap svg rect.color-scale-2, .garmin-heatmap svg rect.color-scale-3, .garmin-heatmap svg rect.color-scale-4',
      )
      .first()
    await expect(coloredDay).toBeVisible({ timeout: 15_000 })
    await coloredDay.click({ force: true })

    // Dialog opens
    const dialog = page.getByTestId('garmin-day-dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Garmin Activities')).toBeVisible()

    // Wait for either rows or empty state
    await expect(
      dialog
        .getByTestId('garmin-day-dialog-loading')
        .or(dialog.getByTestId('garmin-day-dialog-table'))
        .or(dialog.getByTestId('garmin-day-dialog-empty'))
        .or(dialog.getByTestId('garmin-day-dialog-error')),
    ).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByTestId('garmin-day-dialog-loading')).toBeHidden({
      timeout: 15_000,
    })

    // Expect the table to be populated (clicked day was a colored cell)
    await expect(dialog.getByTestId('garmin-day-dialog-table')).toBeVisible()
    await expect(
      dialog.getByRole('columnheader', { name: 'Sport' }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('columnheader', { name: 'Distance' }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('columnheader', { name: 'Duration' }),
    ).toBeVisible()

    const rows = dialog.getByTestId('garmin-day-dialog-row')
    await expect(rows.first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-day-dialog.png`),
      fullPage: true,
    })

    // Click the first sport link and expect to navigate to detail page
    const firstSportLink = dialog
      .getByTestId('garmin-day-dialog-sport-link')
      .first()
    const href = await firstSportLink.getAttribute('href')
    expect(href).toMatch(/^\/garmin\/.+/)

    await firstSportLink.click()

    // Dialog should close and URL should match
    await expect(dialog).toBeHidden({ timeout: 10_000 })
    await expect(page).toHaveURL(new RegExp(`${href}$`))

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-detail.png`),
      fullPage: true,
    })
  })
})

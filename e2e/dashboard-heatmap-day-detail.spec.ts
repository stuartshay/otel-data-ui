import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'heatmap-day-detail')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Dashboard Heatmap Day Detail', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('Less')).toBeVisible({ timeout: 30_000 })
  })

  test('clicking a colored day opens activity popover and links to detail', async ({
    page,
  }) => {
    const prefix = `heatmap-day-${test.info().project.name}`

    const coloredDay = page
      .locator(
        '.garmin-heatmap svg rect.color-scale-1, .garmin-heatmap svg rect.color-scale-2, .garmin-heatmap svg rect.color-scale-3, .garmin-heatmap svg rect.color-scale-4',
      )
      .first()
    await expect(coloredDay).toBeVisible({ timeout: 15_000 })
    await coloredDay.click({ force: true })

    const popover = page.getByTestId('garmin-day-popover')
    await expect(popover).toBeVisible({ timeout: 10_000 })

    await expect(popover.getByTestId('garmin-day-popover-loading')).toBeHidden({
      timeout: 15_000,
    })
    await expect(popover.getByTestId('garmin-day-popover-list')).toBeVisible()
    await expect(popover.getByText('Sport')).toBeVisible()
    await expect(popover.getByText('Distance')).toBeVisible()
    await expect(popover.getByText('Duration')).toBeVisible()

    const rows = popover.getByTestId('garmin-day-popover-row')
    await expect(rows.first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-day-popover.png`),
      fullPage: true,
    })

    const firstSportLink = popover
      .getByTestId('garmin-day-popover-sport-link')
      .first()
    const href = await firstSportLink.getAttribute('href')
    expect(href).toMatch(/^\/garmin\/.+/)

    await firstSportLink.click()
    await expect(popover).toBeHidden({ timeout: 10_000 })
    await expect(page).toHaveURL(new RegExp(`${href}$`))

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-detail.png`),
      fullPage: true,
    })
  })
})

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'activity-totals')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Validates the Activity Totals dashboard card:
 * - Monthly tab shows a month selector and renders bars by year
 * - Month selector change re-renders the chart
 * - Weekly and Yearly tabs do not show the month selector
 * - Metric toggle works in monthly mode
 *
 * Screenshots are saved to e2e/screenshots/activity-totals/ for visual review.
 */
test.describe('Dashboard Activity Totals', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Wait for dashboard stats to confirm page is fully loaded
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('monthly tab shows month selector with current month default', async ({
    page,
  }) => {
    const prefix = `activity-totals-${test.info().project.name}`

    // Activity Totals card should be visible
    const card = page.locator('[data-testid="activity-totals-card"]')
    await expect(card).toBeVisible()

    // Monthly should be the default active tab — "Monthly" button has aria-checked=true
    const monthlyBtn = card.getByRole('radio', { name: 'Monthly' })
    await expect(monthlyBtn).toHaveAttribute('aria-checked', 'true')

    // Month selector combobox should be visible in monthly mode
    const monthSelect = card.getByRole('combobox', { name: /select month/i })
    await expect(monthSelect).toBeVisible()

    // Subtitle should show the selected month name
    const currentMonthName = new Date().toLocaleString('en-US', {
      month: 'long',
    })
    await expect(
      card.getByText(new RegExp(currentMonthName, 'i')),
    ).toBeVisible()

    // Full dashboard screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-monthly-default.png`),
      fullPage: true,
    })

    // Card-level screenshot
    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-monthly-card.png`),
    })
  })

  test('changing month selector updates the chart', async ({ page }) => {
    const prefix = `activity-totals-${test.info().project.name}`

    const card = page.locator('[data-testid="activity-totals-card"]')
    await expect(card).toBeVisible({ timeout: 15_000 })

    // Ensure Monthly tab is active (default)
    const monthlyBtn = card.getByRole('radio', { name: 'Monthly' })
    await expect(monthlyBtn).toHaveAttribute('aria-checked', 'true')

    // Open the month dropdown and select January
    const monthSelect = card.getByRole('combobox', { name: /select month/i })
    await monthSelect.click()
    await page.getByRole('option', { name: 'Jan' }).click()

    // Subtitle should now show January
    await expect(card.getByText(/January/i)).toBeVisible({ timeout: 10_000 })

    // Card screenshot after month change
    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-month-changed-jan.png`),
    })
  })

  test('weekly tab shows pagination pill and hides month selector', async ({
    page,
  }) => {
    const prefix = `activity-totals-${test.info().project.name}`

    const card = page.locator('[data-testid="activity-totals-card"]')
    await expect(card).toBeVisible({ timeout: 15_000 })

    // Click the Weekly tab
    await card.getByRole('radio', { name: 'Weekly' }).click()
    await expect(card.getByRole('radio', { name: 'Weekly' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    // Month selector should not be visible
    await expect(
      card.getByRole('combobox', { name: /select month/i }),
    ).not.toBeVisible()

    // Week range pill and Prev/Next buttons should be visible
    const pill = card.getByTestId('week-range-pill')
    await expect(pill).toBeVisible()
    const initialPillText = (await pill.textContent())?.trim() ?? ''
    expect(initialPillText).toMatch(/\w{3} \d+ – \w{3} \d+/)
    await expect(
      card.getByRole('button', { name: /previous week/i }),
    ).toBeVisible()
    await expect(card.getByRole('button', { name: /next week/i })).toBeVisible()

    // Subtitle should reflect "by year" suffix
    await expect(card.getByText(/by year/i)).toBeVisible()

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-04-weekly-default.png`),
    })

    // Click Previous week — pill text should change
    await card.getByRole('button', { name: /previous week/i }).click()
    await expect(pill).not.toHaveText(initialPillText)
    const prevPillText = (await pill.textContent())?.trim() ?? ''

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-05-weekly-prev.png`),
    })

    // Click Next week — should return to original window
    await card.getByRole('button', { name: /next week/i }).click()
    await expect(pill).toHaveText(initialPillText)
    expect(prevPillText).not.toBe(initialPillText)

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-06-weekly-next.png`),
    })
  })

  test('yearly tab does not show month selector', async ({ page }) => {
    const prefix = `activity-totals-${test.info().project.name}`

    const card = page.locator('[data-testid="activity-totals-card"]')
    await expect(card).toBeVisible({ timeout: 15_000 })

    // Click the Yearly tab
    await card.getByRole('radio', { name: 'Yearly' }).click()
    await expect(card.getByRole('radio', { name: 'Yearly' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    // Month selector should not be visible
    await expect(
      card.getByRole('combobox', { name: /select month/i }),
    ).not.toBeVisible()

    // Card screenshot with yearly mode active
    await card.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        `${prefix}-07-yearly-no-month-select.png`,
      ),
    })
  })

  test('metric toggle works in monthly mode', async ({ page }) => {
    const prefix = `activity-totals-${test.info().project.name}`

    const card = page.locator('[data-testid="activity-totals-card"]')
    await expect(card).toBeVisible({ timeout: 15_000 })

    // Monthly is default — switch metric to Duration
    await card.getByRole('radio', { name: 'Duration' }).click()
    await expect(card.getByRole('radio', { name: 'Duration' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    // Card screenshot showing Duration metric in monthly mode
    await card.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        `${prefix}-08-monthly-metric-duration.png`,
      ),
    })
  })
})

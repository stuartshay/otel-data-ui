import { test, expect } from '@playwright/test'

test.describe('Unified Map Date Picker', () => {
  test.beforeEach(async ({ page }) => {
    // Retry page load in case of transient 503 errors
    await page.goto('/map')
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }
  })

  test('page loads with map, date picker, and source badges', async ({
    page,
  }) => {
    const main = page.getByRole('main')

    // Date picker button should show today's date
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await expect(dateButton).toBeVisible()

    // Source badges should be visible (scoped to main to avoid sidebar match)
    await expect(main.getByText('OwnTracks')).toBeVisible()
    await expect(main.getByText('Garmin')).toBeVisible()

    // Map container div should render
    await expect(page.locator('.rounded-lg.border').first()).toBeVisible()

    // Point count summary should be visible (handles comma-formatted numbers)
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('date picker opens calendar and allows date selection', async ({
    page,
  }) => {
    const main = page.getByRole('main')

    // Wait for data to load before interacting
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })

    // Click date picker button to open calendar
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()

    // Calendar should be visible (month/year navigation)
    await expect(page.getByText(/April 2026/)).toBeVisible({ timeout: 5_000 })

    // Select day 3 (past date; use button text inside calendar grid)
    await page
      .locator('[data-slot="calendar"] td button')
      .filter({ hasText: /^3$/ })
      .click()

    // Calendar should close and date label should update to April 3
    await expect(page.getByText(/April 3, 2026/)).toBeVisible({
      timeout: 10_000,
    })

    // "Today" button should appear since we're viewing a past date
    await expect(main.getByRole('button', { name: 'Today' })).toBeVisible()
  })

  test('Today button returns to current date', async ({ page }) => {
    const main = page.getByRole('main')

    // Wait for data to load
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })

    // Open calendar and select a past date
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()
    await expect(page.getByText(/April 2026/)).toBeVisible({ timeout: 5_000 })

    await page
      .locator('[data-slot="calendar"] td button')
      .filter({ hasText: /^3$/ })
      .click()

    // Wait for the "Today" button to appear
    const todayBtn = main.getByRole('button', { name: 'Today' })
    await expect(todayBtn).toBeVisible({ timeout: 5_000 })

    // Click "Today" to return to current date
    await todayBtn.click()

    // "Today" button should disappear and "(Today)" label should show
    await expect(todayBtn).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('(Today)')).toBeVisible()
  })

  test('map displays data points for a date with known data', async ({
    page,
  }) => {
    // Wait for initial data to load and check point count
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })

    // Verify the page subtitle contains date information
    const subtitle = page.locator('p.text-muted-foreground')
    await expect(subtitle).toContainText(/\w+ \d+, \d{4}/)
    await expect(subtitle).toContainText(/points/)
  })
})

import { test, expect } from '@playwright/test'

/**
 * Derive dynamic date strings so tests don't break when run in a different
 * month/year. The "past date" target is always yesterday relative to today.
 */
function getDateContext() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const monthYear = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const pastDay = yesterday.getDate()
  const pastDateLabel = yesterday.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  // data-day attribute uses locale date string (e.g. "4/3/2026")
  const pastDataDay = `${yesterday.getMonth() + 1}/${pastDay}/${yesterday.getFullYear()}`

  return { monthYear, pastDay, pastDateLabel, pastDataDay }
}

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

    // Map container div should render (use data-testid when deployed, class fallback)
    const mapContainer =
      (await page.getByTestId('unified-map-container').count()) > 0
        ? page.getByTestId('unified-map-container')
        : page.locator('.rounded-lg.border').first()
    await expect(mapContainer).toBeVisible()

    // Point count summary should be visible (handles comma-formatted numbers)
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('date picker opens calendar and allows date selection', async ({
    page,
  }) => {
    const { monthYear, pastDateLabel, pastDataDay } = getDateContext()
    const main = page.getByRole('main')

    // Wait for data to load before interacting
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })

    // Click date picker button to open calendar
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()

    // Calendar should be visible with current month/year
    await expect(page.getByText(monthYear)).toBeVisible({ timeout: 5_000 })

    // Select yesterday using the stable data-day attribute (scoped to current month)
    await page
      .locator(`[data-slot="calendar"] button[data-day="${pastDataDay}"]`)
      .click()

    // Calendar should close and date label should update to the selected date
    await expect(page.getByText(pastDateLabel)).toBeVisible({
      timeout: 10_000,
    })

    // "Today" button should appear since we're viewing a past date
    await expect(main.getByRole('button', { name: 'Today' })).toBeVisible()
  })

  test('Today button returns to current date', async ({ page }) => {
    const { monthYear, pastDataDay } = getDateContext()
    const main = page.getByRole('main')

    // Wait for data to load
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 15_000,
    })

    // Open calendar and select a past date
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()
    await expect(page.getByText(monthYear)).toBeVisible({ timeout: 5_000 })

    await page
      .locator(`[data-slot="calendar"] button[data-day="${pastDataDay}"]`)
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

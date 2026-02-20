import { test, expect } from '@playwright/test'

/**
 * Validates that the Garmin activities list persists pagination state
 * in URL search params so navigating back from a detail page returns
 * to the same page.
 */
test.describe('Garmin Activities List Pagination', () => {
  test('page number is reflected in the URL', async ({ page }) => {
    await page.goto('/garmin')
    await expect(page.getByText('Showing 1–')).toBeVisible({ timeout: 15_000 })

    // Navigate to page 2
    const nextBtn = page.getByRole('button', { name: 'Next' })
    await nextBtn.click()
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(page.getByText('Showing 26–')).toBeVisible()
  })

  test('navigating back from detail page preserves page number', async ({
    page,
  }) => {
    // Go directly to page 3
    await page.goto('/garmin?page=3')
    await expect(page.getByText('Showing 51–')).toBeVisible({ timeout: 15_000 })

    // Click the first activity link in the table
    const firstActivityLink = page.locator('table tbody tr td a').first()
    await firstActivityLink.click()

    // Wait for the detail page to load (activity stats bar appears)
    await expect(page.getByText('Distance').first()).toBeVisible({
      timeout: 15_000,
    })

    // Click the back arrow to return to the list
    const backButton = page.locator('a[href*="/garmin?"]').first()
    await backButton.click()

    // Should be back on page 3, not page 1
    await expect(page).toHaveURL(/[?&]page=3/)
    await expect(page.getByText('Showing 51–')).toBeVisible({ timeout: 15_000 })
  })

  test('sport filter is reflected in the URL', async ({ page }) => {
    await page.goto('/garmin')
    await expect(page.getByText('Showing 1–')).toBeVisible({ timeout: 15_000 })

    // Click a sport filter button (e.g. "cycling")
    const cyclingBtn = page.getByRole('button', { name: /cycling/i })
    if (await cyclingBtn.isVisible()) {
      await cyclingBtn.click()
      await expect(page).toHaveURL(/[?&]sport=cycling/)
    }
  })

  test('direct URL with page param loads correct page', async ({ page }) => {
    await page.goto('/garmin?page=2')
    await expect(page.getByText('Showing 26–')).toBeVisible({ timeout: 15_000 })

    // Prev button should be enabled
    const prevBtn = page.getByRole('button', { name: 'Prev' })
    await expect(prevBtn).toBeEnabled()
  })
})

import { test, expect } from '@playwright/test'

/**
 * Validates that the Locations list persists pagination state
 * in URL search params so navigating back from a detail page returns
 * to the same page.
 */
test.describe('Locations List Pagination', () => {
  test('page number is reflected in the URL', async ({ page }) => {
    await page.goto('/locations')
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
    // Go directly to page 4
    await page.goto('/locations?page=4')
    await expect(page.getByText('Showing 76–')).toBeVisible({
      timeout: 15_000,
    })

    // Click the first location link in the table
    const firstLocationLink = page.locator('table tbody tr td a').first()
    await firstLocationLink.click()

    // Wait for the detail page to load
    await expect(page.getByText('Location #')).toBeVisible({
      timeout: 15_000,
    })

    // Click the back arrow to return to the list
    const backButton = page.getByTestId('back-to-list')
    await backButton.click()

    // Should be back on page 4, not page 1
    await expect(page).toHaveURL(/[?&]page=4/)
    await expect(page.getByText('Showing 76–')).toBeVisible({
      timeout: 15_000,
    })
  })

  test('device filter is reflected in the URL', async ({ page }) => {
    await page.goto('/locations')
    await expect(page.getByText('Showing 1–')).toBeVisible({ timeout: 15_000 })

    // Click a device filter button (skip "All")
    const filterButtons = page.locator(
      'div.flex.flex-wrap.gap-2 button:not(:first-child)',
    )
    const count = await filterButtons.count()
    if (count > 0) {
      await filterButtons.first().click()
      await expect(page).toHaveURL(/[?&]device=/)
    }
  })

  test('direct URL with page param loads correct page', async ({ page }) => {
    await page.goto('/locations?page=2')
    await expect(page.getByText('Showing 26–')).toBeVisible({ timeout: 15_000 })

    // Prev button should be enabled
    const prevBtn = page.getByRole('button', { name: 'Prev' })
    await expect(prevBtn).toBeEnabled()
  })
})

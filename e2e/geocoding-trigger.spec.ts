import { test, expect } from '@playwright/test'

/**
 * Validates the Geocoding page: status display and batch trigger.
 *
 * Uses a small batch size (5) to minimize runtime while still
 * exercising the full mutation path through the gateway.
 *
 * The test intercepts the GraphQL response to detect timeout vs success.
 */

test.describe('Geocoding Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/geocoding')
  })

  test('displays geocoding status cards', async ({ page }) => {
    // The "Total Locations" stat card should render once the query completes
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Geocoded')).toBeVisible()
    await expect(page.getByText('Pending')).toBeVisible()
    await expect(page.getByText('Coverage', { exact: true })).toBeVisible()
  })

  test('trigger geocoding batch completes without timeout', async ({
    page,
  }) => {
    test.setTimeout(180_000)

    // Wait for the page to load
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 15_000,
    })

    // If the trigger section shows "Login required", skip the test
    const loginRequired = page.getByText('Login required')
    if (await loginRequired.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, 'Authentication required — skipping trigger test')
      return
    }

    // Set a small batch size to keep the request fast
    const batchInput = page.locator('#batchSize')
    await batchInput.fill('5')

    // Intercept the GraphQL TriggerGeocoding mutation response
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' &&
        (resp.url().includes('/graphql') ||
          resp.url().includes('gateway.lab.informationcart.com')) &&
        (resp.request().postData()?.includes('TriggerGeocoding') ?? false),
      { timeout: 120_000 },
    )

    // Click Run Geocoding
    await page.getByRole('button', { name: /Run Geocoding/i }).click()

    // The button should show "Processing..." while the mutation is in-flight
    await expect(
      page.getByRole('button', { name: /Processing/i }),
    ).toBeVisible()

    // Wait for the GraphQL response (generous 120s timeout)
    const response = await responsePromise

    // Check the response didn't abort or 5xx
    expect(response.status()).toBeLessThan(500)

    // After completion the button should return to "Run Geocoding"
    await expect(
      page.getByRole('button', { name: /Run Geocoding/i }),
    ).toBeVisible({ timeout: 120_000 })

    // A success toast should appear (or an error toast if timeout)
    const toast = page.locator('[data-sonner-toast]').first()
    if (await toast.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const toastText = await toast.textContent()
      expect(toastText).not.toBeNull()
      const toastMessage = toastText ?? ''

      // Fail explicitly if we see a timeout/abort message
      expect(toastMessage).not.toContain('abort')
      expect(toastMessage).not.toContain('timeout')
      expect(toastMessage).not.toContain('Geocoding failed')
    }
  })
})

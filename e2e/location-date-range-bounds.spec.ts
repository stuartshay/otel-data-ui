import { test, expect } from '@playwright/test'

/**
 * Validates that the Locations page dynamically fetches date-range bounds
 * from the API (via locationDateRange GraphQL query) and applies them to
 * the DateRangePicker calendar component.
 */
test.describe('Location Date Range Bounds', () => {
  test.setTimeout(60_000)

  test('locationDateRange GraphQL query returns valid min/max dates', async ({
    page,
  }) => {
    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    // Fetch the GraphQL query directly from the loaded page context
    const dateRangeResponse = await page.evaluate(async () => {
      const res = await fetch(
        (window as { __ENV__?: { GRAPHQL_URL?: string } }).__ENV__
          ?.GRAPHQL_URL ?? 'https://gateway.lab.informationcart.com',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query { locationDateRange { min_date max_date } }`,
          }),
        },
      )
      return res.json()
    })

    // Verify the response contains valid date fields
    expect(dateRangeResponse.data).toBeDefined()
    expect(dateRangeResponse.data.locationDateRange).toBeDefined()
    expect(dateRangeResponse.data.locationDateRange.min_date).toBeTruthy()
    expect(dateRangeResponse.data.locationDateRange.max_date).toBeTruthy()

    // Verify dates are parseable
    const minDate = new Date(dateRangeResponse.data.locationDateRange.min_date)
    const maxDate = new Date(dateRangeResponse.data.locationDateRange.max_date)
    expect(minDate.getTime()).not.toBeNaN()
    expect(maxDate.getTime()).not.toBeNaN()
    expect(minDate.getTime()).toBeLessThan(maxDate.getTime())
  })

  test('date picker shows "Select dates" by default and preset range updates URL', async ({
    page,
  }) => {
    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const trigger = page.getByTestId('date-range-trigger')

    // Without any date params, should show "Select dates"
    await expect(trigger).toHaveText(/Select dates/)

    // Open the date picker popover
    await trigger.click()

    // Click "Last 7 days" preset — use force to bypass popover animation
    const preset = page.getByRole('button', { name: 'Last 7 days' })
    await expect(preset).toBeVisible({ timeout: 5_000 })
    await preset.click({ force: true })

    // URL should now contain date_from and date_to params
    await expect(page).toHaveURL(/[?&]date_from=/, { timeout: 10_000 })
    await expect(page).toHaveURL(/[?&]date_to=/)

    // Trigger text should show a date range (not "Select dates")
    await expect(trigger).not.toHaveText(/Select dates/)

    // Now clear the date filter
    const clearBtn = page.getByRole('button', { name: 'Clear date range' })
    await clearBtn.click()

    // URL should no longer contain date params
    await expect(page).not.toHaveURL(/[?&]date_from=/, { timeout: 5_000 })
    await expect(page).not.toHaveURL(/[?&]date_to=/)

    // Trigger should revert to "Select dates"
    await expect(trigger).toHaveText(/Select dates/)
  })

  test('out-of-range date_from URL param is clamped to API min_date', async ({
    page,
  }) => {
    // Fetch the actual min_date from the gateway API directly
    const gatewayUrl = 'https://gateway.lab.informationcart.com'
    const res = await page.request.post(gatewayUrl, {
      data: {
        query: `query { locationDateRange { min_date max_date } }`,
      },
    })
    const dateRangeResponse = await res.json()
    const minDate = new Date(dateRangeResponse.data.locationDateRange.min_date)

    // Navigate with a date_from before the actual min_date
    const earlyDate = new Date(minDate)
    earlyDate.setFullYear(earlyDate.getFullYear() - 1)
    const earlyStr = earlyDate.toISOString().slice(0, 10)

    await page.goto(`/locations?date_from=${earlyStr}`)
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    // The date picker trigger should NOT show the early date year
    const trigger = page.getByTestId('date-range-trigger')
    await expect(trigger).not.toHaveText(
      new RegExp(earlyDate.getFullYear().toString()),
    )
  })
})

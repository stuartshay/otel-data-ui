import { test, expect } from '@playwright/test'

/** Resolve GraphQL endpoint: env var → runtime config → default. */
async function resolveGraphqlUrl(page: import('@playwright/test').Page) {
  if (process.env.GRAPHQL_URL) return process.env.GRAPHQL_URL
  return page.evaluate(
    () =>
      (window as { __ENV__?: { GRAPHQL_URL?: string } }).__ENV__?.GRAPHQL_URL ??
      'https://gateway.lab.informationcart.com',
  )
}

/**
 * Validates that the Garmin Activities page dynamically fetches date-range
 * bounds from the API (via garminDateRange GraphQL query) and applies them
 * to the DateRangePicker calendar component.
 */
test.describe('Garmin Date Range Bounds', () => {
  test.setTimeout(60_000)

  test('garminDateRange GraphQL query returns valid min/max dates', async ({
    page,
  }) => {
    await page.goto('/garmin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const graphqlUrl = await resolveGraphqlUrl(page)

    const dateRangeApiResponse = await page.request.post(graphqlUrl, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `query { garminDateRange { min_date max_date } }`,
      },
    })
    expect(dateRangeApiResponse.ok()).toBeTruthy()

    const dateRangeResponse = await dateRangeApiResponse.json()

    // Verify the response contains valid date fields
    expect(dateRangeResponse.data).toBeDefined()
    expect(dateRangeResponse.data.garminDateRange).toBeDefined()
    expect(dateRangeResponse.data.garminDateRange.min_date).toBeTruthy()
    expect(dateRangeResponse.data.garminDateRange.max_date).toBeTruthy()

    // Verify dates are parseable
    const minDate = new Date(dateRangeResponse.data.garminDateRange.min_date)
    const maxDate = new Date(dateRangeResponse.data.garminDateRange.max_date)
    expect(minDate.getTime()).not.toBeNaN()
    expect(maxDate.getTime()).not.toBeNaN()
    expect(minDate.getTime()).toBeLessThan(maxDate.getTime())
  })

  test('date picker shows "Select dates" by default and preset range updates URL', async ({
    page,
  }) => {
    await page.goto('/garmin', { waitUntil: 'domcontentloaded' })
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
    await page.goto('/garmin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const graphqlUrl = await resolveGraphqlUrl(page)

    const res = await page.request.post(graphqlUrl, {
      data: {
        query: `query { garminDateRange { min_date max_date } }`,
      },
    })
    const dateRangeResponse = await res.json()
    const minDate = new Date(dateRangeResponse.data.garminDateRange.min_date)

    // Navigate with a date_from before the actual min_date
    const earlyDate = new Date(minDate)
    earlyDate.setFullYear(earlyDate.getFullYear() - 1)
    const earlyStr = earlyDate.toISOString().slice(0, 10)

    await page.goto(`/garmin?date_from=${earlyStr}`)
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

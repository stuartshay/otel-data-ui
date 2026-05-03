import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'daily-summary')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Daily Summary Pagination & Calendar Filter', () => {
  test.setTimeout(60_000)

  test('default state shows summaries with pagination footer', async ({
    page,
  }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText('Daily Summary')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/Showing \d+–\d+ of \d+/)).toBeVisible({
      timeout: 30_000,
    })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'default-state.png'),
      fullPage: true,
    })
  })

  test('pagination Next button updates URL and visible range', async ({
    page,
  }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Showing 1–/)).toBeVisible({ timeout: 30_000 })

    const nextBtn = page.getByRole('button', { name: 'Next' })
    if (await nextBtn.isEnabled()) {
      await nextBtn.click()
      await expect(page).toHaveURL(/[?&]page=2/)
      await expect(page.getByText(/Showing 26–/)).toBeVisible({
        timeout: 15_000,
      })

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'pagination-next.png'),
        fullPage: true,
      })

      const prevBtn = page.getByRole('button', { name: 'Prev' })
      await prevBtn.click()
      await expect(page.getByText(/Showing 1–/)).toBeVisible({
        timeout: 15_000,
      })
    }
  })

  test('calendar preset updates URL and resets pagination to page 1', async ({
    page,
  }) => {
    // Start on page 2 to verify the preset resets pagination
    await page.goto('/daily-summary?page=2', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const trigger = page.getByTestId('date-range-trigger')
    await trigger.click()

    const preset = page.getByRole('button', { name: 'Last 7 days' })
    await expect(preset).toBeVisible({ timeout: 5_000 })
    await preset.click({ force: true })

    await expect(page).toHaveURL(/[?&]date_from=/, { timeout: 10_000 })
    await expect(page).toHaveURL(/[?&]date_to=/)
    await expect(page).not.toHaveURL(/[?&]page=2/)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'date-range-change.png'),
      fullPage: true,
    })

    const clearBtn = page.getByRole('button', { name: 'Clear date range' })
    await clearBtn.click()
    await expect(page).not.toHaveURL(/[?&]date_from=/, { timeout: 5_000 })
  })

  test('dailySummaryDateRange GraphQL query returns valid min/max dates', async ({
    page,
  }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const graphqlUrl = await page.evaluate(
      () =>
        (window as { __ENV__?: { GRAPHQL_URL?: string } }).__ENV__
          ?.GRAPHQL_URL ?? 'https://gateway.lab.informationcart.com',
    )

    const response = await page.request.post(graphqlUrl, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `query { dailySummaryDateRange { min_date max_date } }`,
      },
    })
    expect(response.ok()).toBeTruthy()

    const json = await response.json()
    expect(json.data).toBeDefined()
    expect(json.data.dailySummaryDateRange).toBeDefined()
    expect(json.data.dailySummaryDateRange.min_date).toBeTruthy()
    expect(json.data.dailySummaryDateRange.max_date).toBeTruthy()

    const minDate = new Date(json.data.dailySummaryDateRange.min_date)
    const maxDate = new Date(json.data.dailySummaryDateRange.max_date)
    expect(minDate.getTime()).not.toBeNaN()
    expect(maxDate.getTime()).not.toBeNaN()
    expect(minDate.getTime()).toBeLessThanOrEqual(maxDate.getTime())
  })
})

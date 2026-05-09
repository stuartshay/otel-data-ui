import { test, expect, type Locator, type Page } from '@playwright/test'

async function fetchLocationDateBounds(page: Page) {
  const graphqlUrl = await page.evaluate(
    () =>
      (window as { __ENV__?: { GRAPHQL_URL?: string } }).__ENV__?.GRAPHQL_URL ??
      'https://gateway.lab.informationcart.com',
  )

  const res = await page.request.post(graphqlUrl, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      query: `query { locationDateRange { min_date max_date } }`,
    },
  })
  expect(res.ok()).toBeTruthy()

  const body = await res.json()
  return {
    minDate: new Date(body.data.locationDateRange.min_date),
    maxDate: new Date(body.data.locationDateRange.max_date),
  }
}

function monthSpan(from: Date, to: Date) {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    to.getMonth() -
    from.getMonth()
  )
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

async function clickPreviousUntilStopped(
  calendar: Locator,
  minDate: Date,
  maxDate: Date,
) {
  const previousMonthBtn = calendar.getByRole('button', {
    name: /previous/i,
  })

  await expect(previousMonthBtn).toBeVisible()

  let clickCount = 0
  const maxClicks = Math.max(24, monthSpan(minDate, maxDate) + 6)
  for (let i = 0; i < maxClicks; i++) {
    const isDisabled = await previousMonthBtn.isDisabled().catch(() => true)
    const isHidden = await previousMonthBtn.isHidden().catch(() => true)
    if (isDisabled || isHidden) break

    await previousMonthBtn.click()
    clickCount++
  }

  expect(
    clickCount,
    `Calendar allowed ${clickCount} backward clicks without stopping; navigation should be bounded by startMonth (${minDate.toISOString()})`,
  ).toBeLessThan(maxClicks)

  await expect(
    calendar.getByText(monthLabel(minDate), { exact: true }),
  ).toBeVisible()
}

test.describe('Calendar past month navigation', () => {
  test.setTimeout(60_000)

  test('Map page: calendar should not allow navigating before data min date month', async ({
    page,
  }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }

    const { minDate, maxDate } = await fetchLocationDateBounds(page)

    const main = page.getByRole('main')
    await main.getByRole('button', { name: /\w+ \d+, \d{4}/ }).click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    await clickPreviousUntilStopped(calendar, minDate, maxDate)
  })

  test('Locations page: calendar should not allow navigating before data min date month', async ({
    page,
  }) => {
    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const { minDate, maxDate } = await fetchLocationDateBounds(page)

    await page.getByTestId('date-range-trigger').click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    await clickPreviousUntilStopped(calendar, minDate, maxDate)
  })
})

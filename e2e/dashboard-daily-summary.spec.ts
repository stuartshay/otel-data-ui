import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join(
  'e2e',
  'screenshots',
  'dashboard-daily-summary',
)

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

function formatHeadingDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

async function expectNoDailySummarySchemaError(page: Page) {
  await expect(
    page.getByText(
      /Cannot query field "activity_date" on type "DailySummaryConnection"/,
    ),
  ).toHaveCount(0)
  await expect(
    page.getByText(
      /Cannot query field "owntracks_device" on type "DailySummaryConnection"/,
    ),
  ).toHaveCount(0)
}

async function openSummaryDetailWithMinimumPoints(
  page: Page,
  minimumPoints: number,
) {
  await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })

  const rows = page.getByRole('main').locator('table tbody tr')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })

  const rowCount = await rows.count()
  for (let index = 0; index < rowCount; index += 1) {
    const row = rows.nth(index)
    const pointsText = await row.locator('td').nth(2).innerText()
    const points = Number.parseInt(pointsText.replace(/[^\d]/g, ''), 10)
    if (Number.isNaN(points) || points < minimumPoints) continue

    const dateLink = row.locator('a[href^="/daily-summary/"]').first()
    const href = await dateLink.getAttribute('href')
    if (!href) continue

    await dateLink.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    return { href, points }
  }

  return null
}

test.describe('Dashboard Daily Summary detail map', () => {
  test.setTimeout(90_000)

  test('daily summary renders date links without GraphQL schema errors', async ({
    page,
  }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })

    const main = page.getByRole('main')
    await expect(
      main.getByRole('heading', { name: 'Daily Summary' }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })
    await expectNoDailySummarySchemaError(page)

    const rows = main.locator('table tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    expect(await rows.count()).toBeGreaterThan(0)

    const firstDateLink = rows
      .first()
      .locator('a[href^="/daily-summary/"]')
      .first()
    await expect(firstDateLink).toBeVisible()

    const href = await firstDateLink.getAttribute('href')
    expect(href).toMatch(/^\/daily-summary\/\d{4}-\d{2}-\d{2}$/)

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        `summary-${test.info().project.name}-01-list.png`,
      ),
      fullPage: true,
    })
  })

  test('clicking a daily summary date opens the day point map', async ({
    page,
  }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })

    const main = page.getByRole('main')
    const firstDateLink = main
      .locator('table tbody tr')
      .first()
      .locator('a[href^="/daily-summary/"]')
      .first()
    await expect(firstDateLink).toBeVisible({ timeout: 30_000 })

    const href = await firstDateLink.getAttribute('href')
    expect(href).not.toBeNull()
    const selectedDate = href!.split('/').pop()!

    await firstDateLink.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expect(
      page.getByRole('heading', { name: formatHeadingDate(selectedDate) }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/[\d,]+ of [\d,]+ GPS points/)).toBeVisible({
      timeout: 30_000,
    })
    await expectNoDailySummarySchemaError(page)

    const mapContainer = page.getByTestId('daily-summary-map-container')
    await expect(mapContainer).toBeVisible()
    await expect(mapContainer).toHaveClass(/leaflet-container/, {
      timeout: 20_000,
    })
    await expect(
      mapContainer.locator('.leaflet-tile-pane img.leaflet-tile').first(),
    ).toBeVisible({ timeout: 20_000 })

    const pointRows = page.locator('table tbody tr')
    await expect(pointRows.first()).toBeVisible({ timeout: 30_000 })
    expect(await pointRows.count()).toBeGreaterThan(0)
    await expect(pointRows.first().locator('td').first()).toContainText(
      /owntracks|garmin/i,
    )

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        `summary-${test.info().project.name}-02-detail.png`,
      ),
      fullPage: true,
    })
  })

  test('detail keyboard shortcuts navigate between available days', async ({
    page,
  }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })

    const dateRows = page.getByRole('main').locator('table tbody tr')
    await expect(dateRows.first()).toBeVisible({ timeout: 30_000 })
    const dateRowCount = await dateRows.count()
    expect(dateRowCount).toBeGreaterThanOrEqual(3)

    const selectedDateLink = dateRows
      .nth(Math.floor(dateRowCount / 2))
      .locator('a[href^="/daily-summary/"]')
      .first()
    await expect(selectedDateLink).toBeVisible()

    const selectedHref = await selectedDateLink.getAttribute('href')
    expect(selectedHref).not.toBeNull()
    await selectedDateLink.click()
    await expect(page).toHaveURL(new RegExp(`${selectedHref}$`))

    const previousHref = await page
      .getByRole('link', { name: 'Previous day' })
      .getAttribute('href')
    expect(previousHref).toMatch(/^\/daily-summary\/\d{4}-\d{2}-\d{2}$/)

    await page.keyboard.press('Alt+ArrowLeft')
    await expect(page).toHaveURL(new RegExp(`${previousHref}$`))
    await expect(
      page.getByRole('heading', {
        name: formatHeadingDate(previousHref!.split('/').pop()!),
      }),
    ).toBeVisible({ timeout: 30_000 })

    await page.keyboard.press('Alt+ArrowRight')
    await expect(page).toHaveURL(new RegExp(`${selectedHref}$`))
  })

  test('pagination updates the URL and result range', async ({ page }) => {
    await page.goto('/daily-summary', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/Showing 1–25 of [\d,]+/)).toBeVisible({
      timeout: 30_000,
    })

    const nextButton = page.getByRole('button', { name: 'Next' })
    await expect(nextButton).toBeEnabled()
    await nextButton.click()

    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(page.getByText(/Showing 26–/)).toBeVisible({
      timeout: 30_000,
    })

    const prevButton = page.getByRole('button', { name: 'Prev' })
    await expect(prevButton).toBeEnabled()
    await prevButton.click()

    await expect(page).not.toHaveURL(/[?&]page=2/)
    await expect(page.getByText(/Showing 1–25 of [\d,]+/)).toBeVisible({
      timeout: 30_000,
    })
  })

  test('direct page URL opens the requested summary page', async ({ page }) => {
    await page.goto('/daily-summary?page=2', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(page.getByText(/Showing 26–/)).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('button', { name: 'Prev' })).toBeEnabled()
  })

  test('date filter preset updates and clears URL params', async ({ page }) => {
    await page.goto('/daily-summary?page=2', { waitUntil: 'domcontentloaded' })

    const trigger = page.getByTestId('date-range-trigger')
    await expect(trigger).toBeVisible({ timeout: 30_000 })
    await expect(trigger).toHaveText(/Select dates/)

    await trigger.click()
    const preset = page.getByRole('button', { name: 'Last 7 days' })
    await expect(preset).toBeVisible({ timeout: 5_000 })
    await preset.click({ force: true })

    await expect(page).toHaveURL(/[?&]date_from=/, { timeout: 10_000 })
    await expect(page).toHaveURL(/[?&]date_to=/)
    await expect(page).not.toHaveURL(/[?&]page=2/)
    await expect(trigger).not.toHaveText(/Select dates/)
    await expect(page.getByText(/Showing 1–/)).toBeVisible({
      timeout: 30_000,
    })

    await page.getByRole('button', { name: 'Clear date range' }).click()

    await expect(page).not.toHaveURL(/[?&]date_from=/, { timeout: 5_000 })
    await expect(page).not.toHaveURL(/[?&]date_to=/)
    await expect(trigger).toHaveText(/Select dates/)
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

  test('detail page paginates and filters source-limited points', async ({
    page,
  }) => {
    const detail = await openSummaryDetailWithMinimumPoints(page, 101)
    test.skip(
      detail == null,
      'No daily summary row with enough GPS points to validate detail pagination.',
    )

    await expect(page.getByText(/Showing 1–100 of [\d,]+/)).toBeVisible({
      timeout: 30_000,
    })

    const nextButton = page.getByRole('button', { name: 'Next page' })
    await expect(nextButton).toBeEnabled()
    await nextButton.click()

    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(page.getByText(/Showing 101–/)).toBeVisible({
      timeout: 30_000,
    })

    await page.getByRole('button', { name: 'OwnTracks' }).click()

    await expect(page).toHaveURL(/[?&]source=owntracks/)
    await expect(page).not.toHaveURL(/[?&]page=2/)
    await expect(page.getByText(/GPS points from owntracks/)).toBeVisible({
      timeout: 30_000,
    })

    await page.getByRole('button', { name: 'All' }).click()

    await expect(page).not.toHaveURL(/[?&]source=owntracks/)
    // Header text (no filter) ends with "GPS points" optionally followed by
    // the per-source counts summary "(OwnTracks: N, Garmin: M)".
    await expect(
      page.getByText(/GPS points(\s*\(OwnTracks: [\d,]+, Garmin: [\d,]+\))?$/),
    ).toBeVisible({
      timeout: 30_000,
    })
  })

  test('direct navigation to an invalid summary date shows a handled error', async ({
    page,
  }) => {
    await page.goto('/daily-summary/not-a-date', {
      waitUntil: 'domcontentloaded',
    })

    await expect(
      page.getByText('Select a valid daily summary date.'),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Daily Summary' }),
    ).toBeVisible()
  })
})

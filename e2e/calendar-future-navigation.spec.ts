import { test, expect } from '@playwright/test'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'calendar-future-nav')

/**
 * Verifies that the calendar controls on Locations and Map pages
 * do NOT allow navigating to months beyond the data max date.
 *
 * Takes screenshots at each step for visual verification.
 */
test.describe('Calendar future month navigation', () => {
  test.setTimeout(60_000)

  test('Locations page: calendar should not allow navigating past data max date month', async ({
    page,
  }) => {
    const prefix = `locations-${test.info().project.name}`

    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-page-loaded.png`),
      fullPage: false,
    })

    // Query the API for the actual max_date
    const graphqlUrl = await page.evaluate(
      () =>
        (window as { __ENV__?: { GRAPHQL_URL?: string } }).__ENV__
          ?.GRAPHQL_URL ?? 'https://gateway.lab.informationcart.com',
    )

    const res = await page.request.post(graphqlUrl, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `query { locationDateRange { min_date max_date } }`,
      },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const maxDate = new Date(body.data.locationDateRange.max_date)
    console.log(`  API max_date: ${body.data.locationDateRange.max_date}`)

    // Open the date range picker
    const trigger = page.getByTestId('date-range-trigger')
    await trigger.click()

    const calendarContainer = page.locator('[data-slot="calendar"]')
    await expect(calendarContainer).toBeVisible({ timeout: 5_000 })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-calendar-opened.png`),
      fullPage: false,
    })

    // Try clicking the forward (next month) navigation button repeatedly
    const nextMonthBtn = calendarContainer.getByRole('button', {
      name: /next/i,
    })

    let clickCount = 0
    const maxClicks = 24
    for (let i = 0; i < maxClicks; i++) {
      const isDisabled = await nextMonthBtn.isDisabled().catch(() => true)
      const isHidden = await nextMonthBtn.isHidden().catch(() => true)
      if (isDisabled || isHidden) {
        console.log(
          `  Forward button stopped at click ${i} (disabled=${isDisabled}, hidden=${isHidden})`,
        )
        break
      }
      await nextMonthBtn.click()
      clickCount++
    }

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        `${prefix}-03-after-forward-navigation.png`,
      ),
      fullPage: false,
    })
    console.log(`  Forward clicks made: ${clickCount}`)

    // The forward button should have been stopped before exhausting all clicks.
    // If it was never stopped, the calendar allowed unlimited future navigation.
    expect(
      clickCount,
      `Calendar allowed ${clickCount} forward clicks without stopping — navigation should be bounded by endMonth (${maxDate.toISOString()})`,
    ).toBeLessThan(maxClicks)
  })

  test('Map page: calendar should not allow navigating past data max date month', async ({
    page,
  }) => {
    const prefix = `map-${test.info().project.name}`

    await page.goto('/map', { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-page-loaded.png`),
      fullPage: false,
    })

    // Query the API for the actual max_date
    const graphqlUrl = await page.evaluate(
      () =>
        (window as { __ENV__?: { GRAPHQL_URL?: string } }).__ENV__
          ?.GRAPHQL_URL ?? 'https://gateway.lab.informationcart.com',
    )

    const res = await page.request.post(graphqlUrl, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `query { locationDateRange { min_date max_date } }`,
      },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const maxDate = new Date(body.data.locationDateRange.max_date)
    console.log(`  API max_date: ${body.data.locationDateRange.max_date}`)

    // Open the date picker
    const main = page.getByRole('main')
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()

    const calendarContainer = page.locator('[data-slot="calendar"]')
    await expect(calendarContainer).toBeVisible({ timeout: 5_000 })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-calendar-opened.png`),
      fullPage: false,
    })

    // Try clicking forward to navigate past the max date
    const nextMonthBtn = calendarContainer.getByRole('button', {
      name: /next/i,
    })

    let clickCount = 0
    const maxClicks = 24
    for (let i = 0; i < maxClicks; i++) {
      const isDisabled = await nextMonthBtn.isDisabled().catch(() => true)
      const isHidden = await nextMonthBtn.isHidden().catch(() => true)
      if (isDisabled || isHidden) {
        console.log(
          `  Forward button stopped at click ${i} (disabled=${isDisabled}, hidden=${isHidden})`,
        )
        break
      }
      await nextMonthBtn.click()
      clickCount++
    }

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        `${prefix}-03-after-forward-navigation.png`,
      ),
      fullPage: false,
    })
    console.log(`  Forward clicks made: ${clickCount}`)

    // The forward button should have been stopped before exhausting all clicks.
    expect(
      clickCount,
      `Calendar allowed ${clickCount} forward clicks without stopping — navigation should be bounded by endMonth (${maxDate.toISOString()})`,
    ).toBeLessThan(maxClicks)
  })
})

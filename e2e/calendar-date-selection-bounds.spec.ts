import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'calendar-date-bounds')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/** Format a Date as the data-day attribute value: M/D/YYYY */
const formatDataDay = (date: Date) =>
  `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`

/** Format a Date as a readable label for logs/assertions */
const formatReadable = (date: Date) =>
  date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

/** Add days to a date (returns new Date) */
const addDays = (date: Date, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Fetch min_date and max_date from the GraphQL API */
async function fetchDateBounds(page: import('@playwright/test').Page) {
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

/** Read the displayed month caption from the calendar (e.g., "April 2026") */
async function getCalendarMonth(calendar: import('@playwright/test').Locator) {
  const caption = calendar
    .locator(
      '[class*="caption"], [data-slot="month-caption"], .rdp-caption_label, caption',
    )
    .first()
  if ((await caption.count()) > 0) {
    return caption.textContent()
  }
  return null
}

/**
 * Navigate the calendar to the month containing targetDate.
 * Reads the displayed month caption to determine clicks needed.
 */
async function navigateToMonth(
  calendar: import('@playwright/test').Locator,
  targetDate: Date,
  direction: 'previous' | 'next',
) {
  const btn = calendar.getByRole('button', { name: new RegExp(direction, 'i') })
  await expect(btn).toBeVisible()

  const targetMonth = targetDate.getMonth()
  const targetYear = targetDate.getFullYear()

  for (let i = 0; i < 24; i++) {
    // Check if the target day button is already visible
    const dayBtn = calendar.locator(
      `button[data-day="${formatDataDay(targetDate)}"]`,
    )
    if ((await dayBtn.count()) > 0) return

    const isDisabled = await btn.isDisabled().catch(() => true)
    if (isDisabled) break

    // Also check by caption text
    const caption = await getCalendarMonth(calendar)
    if (caption) {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      const targetCaption = `${monthNames[targetMonth]} ${targetYear}`
      if (caption.includes(targetCaption)) return
    }

    await btn.click()
  }
}

/**
 * Verifies that dates outside the valid data range cannot be selected
 * in the calendar, even when they fall within a boundary month.
 *
 * Target dates are derived dynamically from the API:
 * - Future out-of-range: max_date + 1 day
 * - Past out-of-range: min_date - 1 day
 */
test.describe('Calendar date selection bounds', () => {
  test.setTimeout(60_000)

  test('Map page: day after max_date should be disabled', async ({ page }) => {
    const prefix = 'map-future'

    await page.goto('/map', { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }

    const { maxDate } = await fetchDateBounds(page)
    const futureDate = addDays(maxDate, 1)
    console.log(`  API max_date: ${maxDate.toISOString()}`)
    console.log(`  Target out-of-range date: ${formatReadable(futureDate)}`)

    // Open the calendar
    const main = page.getByRole('main')
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    const triggerTextBefore = await dateButton.textContent()
    await dateButton.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-calendar-opened.png`),
      fullPage: false,
    })

    // Navigate forward if the target month isn't visible
    await navigateToMonth(calendar, futureDate, 'next')

    const futureDayBtn = calendar.locator(
      `button[data-day="${formatDataDay(futureDate)}"]`,
    )
    await expect(futureDayBtn).toHaveCount(1)

    const ariaDisabled = await futureDayBtn.getAttribute('aria-disabled')
    const isDisabledProp = await futureDayBtn.isDisabled().catch(() => false)
    console.log(
      `  ${formatReadable(futureDate)} button: aria-disabled=${ariaDisabled}, disabled=${isDisabledProp}`,
    )

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-target-state.png`),
      fullPage: false,
    })

    // Assert the button is disabled
    expect(
      ariaDisabled === 'true' || isDisabledProp,
      `${formatReadable(futureDate)} should be disabled (after max_date)`,
    ).toBeTruthy()

    // Verify clicking doesn't change the selected date
    await futureDayBtn.click({ force: true })
    await page.waitForTimeout(500)

    const triggerTextAfter = await main
      .getByRole('button', { name: /\w+ \d+, \d{4}/ })
      .textContent()
    console.log(
      `  Trigger before: ${triggerTextBefore}, after: ${triggerTextAfter}`,
    )

    expect(
      triggerTextAfter,
      'Clicking disabled date should not change the selected date',
    ).toBe(triggerTextBefore)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-click.png`),
      fullPage: false,
    })
  })

  test('Map page: day before min_date should be disabled', async ({ page }) => {
    const prefix = 'map-past'

    await page.goto('/map', { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }

    const { minDate } = await fetchDateBounds(page)
    const pastDate = addDays(minDate, -1)
    console.log(`  API min_date: ${minDate.toISOString()}`)
    console.log(`  Target out-of-range date: ${formatReadable(pastDate)}`)

    // Open the calendar
    const main = page.getByRole('main')
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    const triggerTextBefore = await dateButton.textContent()
    await dateButton.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    // Navigate backward to the target month
    await navigateToMonth(calendar, pastDate, 'previous')

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-target-month.png`),
      fullPage: false,
    })

    const pastDayBtn = calendar.locator(
      `button[data-day="${formatDataDay(pastDate)}"]`,
    )
    await expect(pastDayBtn).toHaveCount(1)

    const ariaDisabled = await pastDayBtn.getAttribute('aria-disabled')
    const isDisabledProp = await pastDayBtn.isDisabled().catch(() => false)
    console.log(
      `  ${formatReadable(pastDate)} button: aria-disabled=${ariaDisabled}, disabled=${isDisabledProp}`,
    )

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-target-state.png`),
      fullPage: false,
    })

    // Assert the button is disabled
    expect(
      ariaDisabled === 'true' || isDisabledProp,
      `${formatReadable(pastDate)} should be disabled (before min_date)`,
    ).toBeTruthy()

    // Verify clicking doesn't change the selected date
    await pastDayBtn.click({ force: true })
    await page.waitForTimeout(500)

    const triggerTextAfter = await main
      .getByRole('button', { name: /\w+ \d+, \d{4}/ })
      .textContent()
    console.log(
      `  Trigger before: ${triggerTextBefore}, after: ${triggerTextAfter}`,
    )

    expect(
      triggerTextAfter,
      'Clicking disabled date should not change the selected date',
    ).toBe(triggerTextBefore)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-click.png`),
      fullPage: false,
    })
  })

  test('Locations page: day after max_date should be disabled in range picker', async ({
    page,
  }) => {
    const prefix = 'locations-future'

    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const { maxDate } = await fetchDateBounds(page)
    const futureDate = addDays(maxDate, 1)
    console.log(`  API max_date: ${maxDate.toISOString()}`)
    console.log(`  Target out-of-range date: ${formatReadable(futureDate)}`)

    // Open the date range picker
    const trigger = page.getByTestId('date-range-trigger')
    const triggerTextBefore = await trigger.textContent()
    await trigger.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-calendar-opened.png`),
      fullPage: false,
    })

    // Navigate forward to the target month
    await navigateToMonth(calendar, futureDate, 'next')

    const futureDayBtn = calendar.locator(
      `button[data-day="${formatDataDay(futureDate)}"]`,
    )
    await expect(futureDayBtn).toHaveCount(1)

    const ariaDisabled = await futureDayBtn.getAttribute('aria-disabled')
    const isDisabledProp = await futureDayBtn.isDisabled().catch(() => false)
    console.log(
      `  ${formatReadable(futureDate)} button: aria-disabled=${ariaDisabled}, disabled=${isDisabledProp}`,
    )

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-target-state.png`),
      fullPage: false,
    })

    // Assert the button is disabled
    expect(
      ariaDisabled === 'true' || isDisabledProp,
      `${formatReadable(futureDate)} should be disabled in range picker (after max_date)`,
    ).toBeTruthy()

    // Verify clicking doesn't change the trigger text
    await futureDayBtn.click({ force: true })
    await page.waitForTimeout(500)

    const triggerTextAfter = await trigger.textContent()
    console.log(
      `  Trigger before: ${triggerTextBefore}, after: ${triggerTextAfter}`,
    )

    expect(
      triggerTextAfter,
      'Clicking disabled date should not change the date range',
    ).toBe(triggerTextBefore)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-click.png`),
      fullPage: false,
    })
  })

  test('Locations page: day before min_date should be disabled in range picker', async ({
    page,
  }) => {
    const prefix = 'locations-past'

    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    const { minDate } = await fetchDateBounds(page)
    const pastDate = addDays(minDate, -1)
    console.log(`  API min_date: ${minDate.toISOString()}`)
    console.log(`  Target out-of-range date: ${formatReadable(pastDate)}`)

    // Open the date range picker
    const trigger = page.getByTestId('date-range-trigger')
    const triggerTextBefore = await trigger.textContent()
    await trigger.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    // Navigate backward to the target month
    await navigateToMonth(calendar, pastDate, 'previous')

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-target-month.png`),
      fullPage: false,
    })

    const pastDayBtn = calendar.locator(
      `button[data-day="${formatDataDay(pastDate)}"]`,
    )
    await expect(pastDayBtn).toHaveCount(1)

    const ariaDisabled = await pastDayBtn.getAttribute('aria-disabled')
    const isDisabledProp = await pastDayBtn.isDisabled().catch(() => false)
    console.log(
      `  ${formatReadable(pastDate)} button: aria-disabled=${ariaDisabled}, disabled=${isDisabledProp}`,
    )

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-target-state.png`),
      fullPage: false,
    })

    // Assert the button is disabled
    expect(
      ariaDisabled === 'true' || isDisabledProp,
      `${formatReadable(pastDate)} should be disabled in range picker (before min_date)`,
    ).toBeTruthy()

    // Verify clicking doesn't change the trigger text
    await pastDayBtn.click({ force: true })
    await page.waitForTimeout(500)

    const triggerTextAfter = await trigger.textContent()
    console.log(
      `  Trigger before: ${triggerTextBefore}, after: ${triggerTextAfter}`,
    )

    expect(
      triggerTextAfter,
      'Clicking disabled date should not change the date range',
    ).toBe(triggerTextBefore)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-click.png`),
      fullPage: false,
    })
  })
})

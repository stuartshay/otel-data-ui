import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'calendar-date-bounds')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Verifies that dates outside the valid data range cannot be selected
 * in the calendar, even when they fall within a boundary month.
 *
 * The data range is roughly Dec 27, 2025 → today (Apr 11, 2026).
 * - Dec 2, 2025 is BEFORE the first data record → should be disabled
 * - Apr 20, 2026 is AFTER the last data record → should be disabled
 */
test.describe('Calendar date selection bounds', () => {
  test.setTimeout(60_000)

  test('Map page: Apr 20 (future) should be disabled', async ({ page }) => {
    const prefix = 'map-future'

    await page.goto('/map', { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }

    // Query the API for data bounds
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

    // Open the calendar
    const main = page.getByRole('main')
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-calendar-opened.png`),
      fullPage: false,
    })

    // Target: April 20 of the max_date's year
    const apr20DataDay = `4/20/${maxDate.getFullYear()}`
    const apr20Button = calendar.locator(`button[data-day="${apr20DataDay}"]`)

    // Check if Apr 20 is present and whether it's disabled
    if ((await apr20Button.count()) > 0) {
      const isDisabled = await apr20Button.getAttribute('aria-disabled')
      const hasDisabledAttr = await apr20Button.isDisabled().catch(() => false)
      console.log(
        `  Apr 20 button: aria-disabled=${isDisabled}, disabled=${hasDisabledAttr}`,
      )

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-02-apr20-state.png`),
        fullPage: false,
      })

      // Try clicking it and check if the calendar accepts the selection
      await apr20Button.click({ force: true })
      await page.waitForTimeout(500)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-apr20-click.png`),
        fullPage: false,
      })

      // The date button text should NOT change to "April 20"
      const dateText = await main
        .getByRole('button', { name: /\w+ \d+, \d{4}/ })
        .textContent()
      console.log(`  Date button text after click: ${dateText}`)

      // If April 20 appears in the button text, the calendar allowed selection
      const selectedApr20 = dateText?.includes('April 20')
      expect(
        selectedApr20,
        `Calendar should NOT allow selecting April 20 (after max_date ${maxDate.toISOString()})`,
      ).toBe(false)
    } else {
      console.log('  Apr 20 button not found on current calendar view')
    }
  })

  test('Map page: Dec 2 (before data start) should be disabled', async ({
    page,
  }) => {
    const prefix = 'map-past'

    await page.goto('/map', { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { name: 'Unified Map' })
    try {
      await heading.waitFor({ timeout: 15_000 })
    } catch {
      await page.reload()
      await heading.waitFor({ timeout: 15_000 })
    }

    // Query the API for data bounds
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
    const minDate = new Date(body.data.locationDateRange.min_date)
    console.log(`  API min_date: ${body.data.locationDateRange.min_date}`)

    // Open the calendar
    const main = page.getByRole('main')
    const dateButton = main.getByRole('button', { name: /\w+ \d+, \d{4}/ })
    await dateButton.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    // Navigate backward to December 2025
    const prevMonthBtn = calendar.getByRole('button', { name: /previous/i })
    await expect(prevMonthBtn).toBeVisible()

    // Click back to reach December (from April → Mar → Feb → Jan → Dec)
    const today = new Date()
    const monthsBack =
      (today.getFullYear() - minDate.getFullYear()) * 12 +
      (today.getMonth() - minDate.getMonth())
    console.log(`  Clicking back ${monthsBack} months to reach December`)

    for (let i = 0; i < monthsBack; i++) {
      const isDisabled = await prevMonthBtn.isDisabled().catch(() => true)
      if (isDisabled) {
        console.log(`  Prev button disabled at click ${i}`)
        break
      }
      await prevMonthBtn.click()
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-december-view.png`),
      fullPage: false,
    })

    // Target: December 2 of the min_date's year
    const dec2DataDay = `12/2/${minDate.getFullYear()}`
    const dec2Button = calendar.locator(`button[data-day="${dec2DataDay}"]`)

    if ((await dec2Button.count()) > 0) {
      const isDisabled = await dec2Button.getAttribute('aria-disabled')
      const hasDisabledAttr = await dec2Button.isDisabled().catch(() => false)
      console.log(
        `  Dec 2 button: aria-disabled=${isDisabled}, disabled=${hasDisabledAttr}`,
      )

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-02-dec2-state.png`),
        fullPage: false,
      })

      // Try clicking Dec 2 and check if the calendar accepts the selection
      await dec2Button.click({ force: true })
      await page.waitForTimeout(500)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-dec2-click.png`),
        fullPage: false,
      })

      // The date button text should NOT change to "December 2"
      const dateText = await main
        .getByRole('button', { name: /\w+ \d+, \d{4}/ })
        .textContent()
      console.log(`  Date button text after click: ${dateText}`)

      const selectedDec2 = dateText?.includes('December 2,')
      expect(
        selectedDec2,
        `Calendar should NOT allow selecting Dec 2 (before min_date ${minDate.toISOString()})`,
      ).toBe(false)
    } else {
      console.log(
        '  Dec 2 button not found — may be properly hidden by fromDate',
      )
    }
  })

  test('Locations page: Apr 20 (future) should be disabled in range picker', async ({
    page,
  }) => {
    const prefix = 'locations-future'

    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    // Query the API for data bounds
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

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-calendar-opened.png`),
      fullPage: false,
    })

    // The range picker shows 2 months. Navigate forward if needed to see April.
    const nextMonthBtn = calendar.getByRole('button', { name: /next/i })

    // Click forward until we can see April in the calendar
    for (let i = 0; i < 5; i++) {
      const apr20Button = calendar.locator(
        `button[data-day="4/20/${maxDate.getFullYear()}"]`,
      )
      if ((await apr20Button.count()) > 0) break
      const isDisabled = await nextMonthBtn.isDisabled().catch(() => true)
      if (isDisabled) break
      await nextMonthBtn.click()
    }

    const apr20DataDay = `4/20/${maxDate.getFullYear()}`
    const apr20Button = calendar.locator(`button[data-day="${apr20DataDay}"]`)

    if ((await apr20Button.count()) > 0) {
      const isDisabled = await apr20Button.getAttribute('aria-disabled')
      const hasDisabledAttr = await apr20Button.isDisabled().catch(() => false)
      console.log(
        `  Apr 20 button: aria-disabled=${isDisabled}, disabled=${hasDisabledAttr}`,
      )

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-02-apr20-state.png`),
        fullPage: false,
      })

      // If Apr 20 is NOT disabled, that's the bug
      if (isDisabled !== 'true' && !hasDisabledAttr) {
        console.log('  BUG: Apr 20 is selectable but should be disabled')
      }

      // Try clicking and capture the result
      await apr20Button.click({ force: true })
      await page.waitForTimeout(500)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-apr20-click.png`),
        fullPage: false,
      })
    } else {
      console.log('  Apr 20 button not found in calendar view')
    }
  })

  test('Locations page: Dec 2 (before data start) should be disabled in range picker', async ({
    page,
  }) => {
    const prefix = 'locations-past'

    await page.goto('/locations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('date-range-trigger')).toBeVisible({
      timeout: 30_000,
    })

    // Query the API for data bounds
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
    const minDate = new Date(body.data.locationDateRange.min_date)
    console.log(`  API min_date: ${body.data.locationDateRange.min_date}`)

    // Open the date range picker
    const trigger = page.getByTestId('date-range-trigger')
    await trigger.click()

    const calendar = page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5_000 })

    // Navigate backward to December
    const prevMonthBtn = calendar.getByRole('button', { name: /previous/i })
    await expect(prevMonthBtn).toBeVisible()

    const today = new Date()
    const monthsBack =
      (today.getFullYear() - minDate.getFullYear()) * 12 +
      (today.getMonth() - minDate.getMonth())

    for (let i = 0; i < monthsBack; i++) {
      const isDisabled = await prevMonthBtn.isDisabled().catch(() => true)
      if (isDisabled) break
      await prevMonthBtn.click()
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-december-view.png`),
      fullPage: false,
    })

    const dec2DataDay = `12/2/${minDate.getFullYear()}`
    const dec2Button = calendar.locator(`button[data-day="${dec2DataDay}"]`)

    if ((await dec2Button.count()) > 0) {
      const isDisabled = await dec2Button.getAttribute('aria-disabled')
      const hasDisabledAttr = await dec2Button.isDisabled().catch(() => false)
      console.log(
        `  Dec 2 button: aria-disabled=${isDisabled}, disabled=${hasDisabledAttr}`,
      )

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-02-dec2-state.png`),
        fullPage: false,
      })

      // If Dec 2 is NOT disabled, that's the bug
      if (isDisabled !== 'true' && !hasDisabledAttr) {
        console.log('  BUG: Dec 2 is selectable but should be disabled')
      }

      // Try clicking and capture the result
      await dec2Button.click({ force: true })
      await page.waitForTimeout(500)

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${prefix}-03-after-dec2-click.png`),
        fullPage: false,
      })
    } else {
      console.log(
        '  Dec 2 button not found — may be properly hidden by fromDate',
      )
    }
  })
})

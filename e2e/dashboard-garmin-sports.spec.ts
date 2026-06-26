import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const GRAPHQL_ENDPOINT_PATTERN =
  /^https:\/\/gateway\.lab\.informationcart\.com\/(?:\?.*)?$|^http:\/\/(?:localhost|127\.0\.0\.1):4000\/(?:\?.*)?$/

const SCREENSHOT_DIR = path.join(
  'e2e',
  'screenshots',
  'dashboard-garmin-sports',
)

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

async function mockDashboardGraphql(page: Page) {
  await page.route(GRAPHQL_ENDPOINT_PATTERN, async (route) => {
    const request = route.request()
    if (request.method() !== 'POST') {
      await route.continue()
      return
    }

    const body = request.postDataJSON() as {
      operationName?: string
      variables?: Record<string, unknown>
    }
    const operationName = body.operationName

    const dataByOperation: Record<string, unknown> = {
      Health: { health: { status: 'ok', version: 'test' } },
      LocationCount: {
        locationCount: { count: 42, date: null, device_id: null },
      },
      GarminSports: {
        garminSports: [{ sport: 'cycling', activity_count: 1436 }],
      },
      GarminDeviceCounts: {
        garminDeviceCounts: [
          { label: 'Edge 500', activity_count: 1237 },
          { label: 'Edge 540 Solar', activity_count: 194 },
          { label: 'Manual', activity_count: 5 },
        ],
      },
      GarminDateRange: {
        garminDateRange: { min_date: '2010-01-01', max_date: '2026-06-24' },
      },
      DailySummary: {
        dailySummary: { items: [], total: 0, limit: 365, offset: 0 },
      },
      GarminActivityTotals: { garminActivityTotals: [] },
      GarminActivities: {
        garminActivities: { items: [], total: 0, limit: 200, offset: 0 },
      },
    }

    if (!operationName || !(operationName in dataByOperation)) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Unhandled operation' }] }),
      })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: dataByOperation[operationName] }),
    })
  })
}

test.describe('Dashboard Garmin Sports tile', () => {
  test.setTimeout(60_000)

  test('shows sport, device, and manual activity counts', async ({ page }) => {
    const prefix = `garmin-sports-${test.info().project.name}`

    await mockDashboardGraphql(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })

    const card = page.getByTestId('garmin-sports-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card.getByText('Sports', { exact: true })).toBeVisible()
    await expect(card.getByText(/^cycling$/i)).toBeVisible()
    await expect(card.getByText('Devices')).toBeVisible({ timeout: 30_000 })
    await expect
      .poll(async () => card.getByTestId('garmin-device-row').count())
      .toBeGreaterThanOrEqual(2)
    await expect(card.getByText('Edge 500')).toBeVisible()
    await expect(
      card.getByTestId('garmin-device-row').filter({ hasText: 'Edge 500' }),
    ).toContainText(/\d+/)
    await expect(card.getByText('Edge 540 Solar')).toBeVisible()
    await expect(
      card
        .getByTestId('garmin-device-row')
        .filter({ hasText: 'Edge 540 Solar' }),
    ).toContainText(/\d+/)
    await expect(card.getByTestId('garmin-manual-row')).toContainText('Manual')
    await expect(card.getByTestId('garmin-manual-row')).toContainText(/\d+/)

    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-card.png`),
    })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-dashboard.png`),
      fullPage: true,
    })
  })
})

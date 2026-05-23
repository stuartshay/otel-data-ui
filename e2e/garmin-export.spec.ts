import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * Validates the Garmin Activity Detail export buttons.
 *
 * The page renders two export buttons — "Export CSV" and "Export
 * GeoJSON". Clicking one of them must only "activate" (show the
 * spinner) for the clicked button; the *other* button should be
 * disabled to prevent overlapping exports but must NOT render a
 * spinner of its own.
 *
 * Default activity 9965963574 (~2 425 track points) can be overridden
 * with the PLAYWRIGHT_GARMIN_ACTIVITY_ID environment variable.
 */
const ACTIVITY_ID = process.env.PLAYWRIGHT_GARMIN_ACTIVITY_ID ?? '9965963574'
const GRAPHQL_ENDPOINT_PATTERN =
  /^https:\/\/gateway\.lab\.informationcart\.com\/(?:\?.*)?$|^http:\/\/(?:localhost|127\.0\.0\.1):4000\/(?:\?.*)?$/

function isGarminExportOperation(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { operationName?: string }
    return payload.operationName === 'GarminExportPoints'
  } catch {
    return body.includes('GarminExportPoints')
  }
}

/**
 * Intercept the GraphQL `GarminExportPoints` query, delay the response,
 * and return a deterministic export payload. This keeps the in-flight
 * loading state observable for assertions and avoids relying on a
 * specific activity having exportable points in the live backend.
 */
async function mockExportQuery(page: Page, delayMs: number) {
  let requestCount = 0

  await page.route(GRAPHQL_ENDPOINT_PATTERN, async (route: Route) => {
    const request = route.request()
    if (request.method() !== 'POST') {
      return route.continue()
    }
    const body = request.postData() ?? ''
    if (isGarminExportOperation(body)) {
      requestCount += 1
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            garminTrackPoints: {
              total: 1,
              items: [
                {
                  id: 1,
                  activity_id: ACTIVITY_ID,
                  timestamp: '2026-03-14T09:00:00Z',
                  latitude: 40.715,
                  longitude: -74.017,
                  altitude: 12.4,
                  distance_from_start_km: 0,
                  speed_kmh: 24.5,
                  heart_rate: 135,
                  cadence: 80,
                  temperature_c: 18,
                  address: {
                    display_address: 'Pier 13, Hoboken, NJ',
                    street: 'Sinatra Drive',
                    housenumber: '1301',
                    neighbourhood: 'Waterfront',
                    locality: 'Hoboken',
                    region: 'New Jersey',
                    country: 'United States',
                    postalcode: '07030',
                    confidence: 0.92,
                    waypoint_kind: 'start',
                    status: 'success',
                    geocoded_at: '2026-02-12T08:10:55Z',
                  },
                },
              ],
            },
          },
        }),
      })
    }
    return route.continue()
  })

  return {
    getRequestCount: () => requestCount,
  }
}

test.describe('Garmin Activity Export Buttons', () => {
  test.setTimeout(60_000)

  test('both export buttons render in their idle state by default', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const csvButton = page.getByTestId('export-csv-button')
    const geojsonButton = page.getByTestId('export-geojson-button')

    await expect(csvButton).toBeVisible({ timeout: 20_000 })
    await expect(geojsonButton).toBeVisible({ timeout: 20_000 })

    // Neither button should be disabled before the user interacts.
    await expect(csvButton).toBeEnabled()
    await expect(geojsonButton).toBeEnabled()

    // Neither spinner should be present in the idle state.
    await expect(page.getByTestId('export-csv-spinner')).toHaveCount(0)
    await expect(page.getByTestId('export-geojson-spinner')).toHaveCount(0)
  })

  test('clicking Export CSV only activates the CSV button, GeoJSON stays idle but disabled', async ({
    page,
  }) => {
    await mockExportQuery(page, 1_500)
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const csvButton = page.getByTestId('export-csv-button')
    const geojsonButton = page.getByTestId('export-geojson-button')
    await expect(csvButton).toBeVisible({ timeout: 20_000 })

    // Kick off the download but don't await it yet — we want to observe
    // the mid-flight loading state before the response resolves.
    const downloadPromise = page.waitForEvent('download')
    await csvButton.click()

    // Only the CSV spinner should be visible while the export is in flight.
    await expect(page.getByTestId('export-csv-spinner')).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByTestId('export-geojson-spinner')).toHaveCount(0)

    // Both buttons must be disabled — preventing the user from clicking
    // GeoJSON mid-export — but only the CSV one is "activated".
    await expect(csvButton).toBeDisabled()
    await expect(geojsonButton).toBeDisabled()

    // Finish: the download fires with the expected filename, and the
    // page returns to its idle state.
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(
      `garmin_activity_${ACTIVITY_ID}_points.csv`,
    )

    await expect(page.getByTestId('export-csv-spinner')).toHaveCount(0, {
      timeout: 10_000,
    })
    await expect(csvButton).toBeEnabled()
    await expect(geojsonButton).toBeEnabled()
  })

  test('clicking Export GeoJSON only activates the GeoJSON button, CSV stays idle but disabled', async ({
    page,
  }) => {
    await mockExportQuery(page, 1_500)
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const csvButton = page.getByTestId('export-csv-button')
    const geojsonButton = page.getByTestId('export-geojson-button')
    await expect(geojsonButton).toBeVisible({ timeout: 20_000 })

    const downloadPromise = page.waitForEvent('download')
    await geojsonButton.click()

    // Only the GeoJSON spinner should be visible — this is the
    // regression we are guarding against.
    await expect(page.getByTestId('export-geojson-spinner')).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.getByTestId('export-csv-spinner')).toHaveCount(0)

    await expect(csvButton).toBeDisabled()
    await expect(geojsonButton).toBeDisabled()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(
      `garmin_activity_${ACTIVITY_ID}_points.geojson`,
    )

    await expect(page.getByTestId('export-geojson-spinner')).toHaveCount(0, {
      timeout: 10_000,
    })
    await expect(csvButton).toBeEnabled()
    await expect(geojsonButton).toBeEnabled()
  })

  test('a second click on the other button during an in-flight export is ignored', async ({
    page,
  }) => {
    const exportMock = await mockExportQuery(page, 1_500)
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    const csvButton = page.getByTestId('export-csv-button')
    const geojsonButton = page.getByTestId('export-geojson-button')
    await expect(csvButton).toBeVisible({ timeout: 20_000 })

    const downloadPromise = page.waitForEvent('download')
    await csvButton.click()

    // While CSV is exporting, dispatch a DOM click event directly on
    // the GeoJSON button. Native disabled buttons will not fire normal
    // Playwright clicks, so this exercises the handler-level guard
    // instead of only the disabled HTML attribute.
    await expect(geojsonButton).toBeDisabled({ timeout: 5_000 })
    await geojsonButton.dispatchEvent('click')
    await expect(page.getByTestId('export-geojson-spinner')).toHaveCount(0)

    // The original CSV download still completes successfully.
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(
      `garmin_activity_${ACTIVITY_ID}_points.csv`,
    )
    expect(exportMock.getRequestCount()).toBe(1)
  })
})

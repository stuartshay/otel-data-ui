import { expect, test } from '@playwright/test'

test.describe('Garmin segment route map', () => {
  test('renders the source activity points for the saved segment route', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'))
    const chartDataResponse = page.waitForResponse(async (response) => {
      if (response.request().method() !== 'POST') return false

      const body = response.request().postData() ?? ''
      return body.includes('GarminChartData')
    })

    await page.goto('/garmin/segments/6')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(
      page.getByRole('heading', { name: 'Central Park 2' }),
    ).toBeVisible({ timeout: 15_000 })

    await chartDataResponse

    const map = page.getByTestId('segment-map')
    await expect(map).toBeVisible()

    const pointAddress = page.getByTestId('segment-point-address')
    const addressValue = page.getByTestId('segment-point-address-value')
    await expect(pointAddress.getByText('Start point address')).toBeVisible()
    await expect(addressValue).not.toHaveText('Resolving…', {
      timeout: 10_000,
    })
    await expect(addressValue).not.toHaveText('—')
    await expect(addressValue).not.toHaveText('Unavailable')
    const startAddress = await addressValue.textContent()
    if (!startAddress) throw new Error('Segment start address unavailable')

    const routePaths = map.locator(
      '.leaflet-overlay-pane svg path[fill="none"]',
    )
    await expect(async () => {
      expect(await routePaths.count()).toBeGreaterThan(10)
    }).toPass({ timeout: 10_000 })

    const strokeColors = await routePaths.evaluateAll((paths) =>
      Array.from(
        new Set(
          paths
            .map((path) => path.getAttribute('stroke'))
            .filter((stroke): stroke is string => stroke != null),
        ),
      ),
    )
    expect(strokeColors.length).toBeGreaterThan(1)

    const elevationProfile = page.getByTestId('segment-elevation-profile')
    await expect(elevationProfile).toBeVisible()
    await expect(
      elevationProfile.getByRole('heading', { name: 'Elevation' }),
    ).toBeVisible()
    await expect(
      elevationProfile.getByRole('img', {
        name: /elevation profile from .* at the segment start/i,
      }),
    ).toBeVisible()
    await expect(elevationProfile.getByText('Start to finish')).toBeVisible()

    const elevationChart = elevationProfile.locator(
      '.recharts-responsive-container',
    )
    await elevationChart.scrollIntoViewIfNeeded()
    const chartBox = await elevationChart.boundingBox()
    if (!chartBox) throw new Error('Segment elevation chart unavailable')
    const selectedAddressResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        (response.request().postData() ?? '').includes('ReverseGeocodePoint') &&
        response.status() === 200,
    )
    await page.mouse.move(
      chartBox.x + chartBox.width / 2,
      chartBox.y + chartBox.height / 2,
    )

    const hoverMarker = map.locator(
      '.leaflet-overlay-pane svg path.segment-hover-marker',
    )
    await expect(hoverMarker).toHaveCount(1, { timeout: 5_000 })
    await expect(
      elevationProfile.locator('.recharts-tooltip-cursor'),
    ).toHaveCount(1, { timeout: 5_000 })
    await expect(pointAddress.getByText('Selected point address')).toBeVisible()
    const selectedResponse = await selectedAddressResponse
    const selectedResponseBody = (await selectedResponse.json()) as {
      data?: {
        reverseGeocodePoint?: {
          status?: string
          resolution_source?: string
        }
      }
    }
    expect(selectedResponseBody.data?.reverseGeocodePoint?.status).toBe(
      'success',
    )
    expect(['database', 'pelias']).toContain(
      selectedResponseBody.data?.reverseGeocodePoint?.resolution_source,
    )
    await expect(addressValue).not.toHaveText('Resolving…', {
      timeout: 10_000,
    })
    await expect(addressValue).not.toHaveText('Unavailable')

    await page.mouse.move(0, 0)
    await expect(hoverMarker).toHaveCount(0, { timeout: 5_000 })
    await expect(pointAddress.getByText('Start point address')).toBeVisible()
    await expect(addressValue).toHaveText(startAddress)
  })
})

import { expect, test } from '@playwright/test'

test.describe('Garmin segment route map', () => {
  test('renders the source activity points for the saved segment route', async ({
    page,
  }) => {
    const chartDataResponse = page.waitForResponse(async (response) => {
      if (response.request().method() !== 'POST') return false

      const body = response.request().postData() ?? ''
      return body.includes('GarminChartData')
    })

    await page.goto('/garmin/segments/6')
    await expect(
      page.getByRole('heading', { name: 'Central Park 2' }),
    ).toBeVisible({ timeout: 15_000 })

    await chartDataResponse

    const map = page.getByTestId('segment-map')
    await expect(map).toBeVisible()

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
  })
})

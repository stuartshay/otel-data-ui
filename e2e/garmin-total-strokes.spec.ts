import { test, expect } from '@playwright/test'

const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_CADENCE_ACTIVITY_ID ?? '23321402669'

test.describe('Garmin cadence statistics', () => {
  test('shows cadence and total strokes for an activity', async ({ page }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.getByRole('tab', { name: 'Stats' }).click()

    await expect(page.getByText('Cadence', { exact: true })).toBeVisible({
      timeout: 20_000,
    })

    const averageCadenceRow = page
      .getByText('Avg Cadence', { exact: true })
      .locator('..')
    const maximumCadenceRow = page
      .getByText('Max Cadence', { exact: true })
      .locator('..')
    const totalStrokesRow = page
      .getByText('Total Strokes', { exact: true })
      .locator('..')
    const formattedTotalStrokes = await page.evaluate(() =>
      (1793).toLocaleString(),
    )

    await expect(averageCadenceRow).toContainText('61 rpm')
    await expect(maximumCadenceRow).toContainText('94 rpm')
    await expect(totalStrokesRow).toContainText(formattedTotalStrokes)
  })
})

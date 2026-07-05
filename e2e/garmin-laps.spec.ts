import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-laps')
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_LAPS_ACTIVITY_ID ?? '9965963574'

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Garmin Activity Laps', () => {
  test('renders laps table, selection, summary, and existing tabs', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)

    await expect(page.getByTestId('garmin-detail-tabs')).toBeVisible({
      timeout: 20_000,
    })
    await page.getByTestId('garmin-tab-laps').click()

    const table = page.getByTestId('activity-laps-table')
    await expect(table).toBeVisible({ timeout: 20_000 })
    await expect(table.getByText('Summary')).toBeVisible()

    const firstLap = page.getByTestId('lap-row-1')
    await expect(firstLap).toBeVisible()
    await firstLap.click()
    await expect(firstLap).toHaveAttribute('data-selected', 'true')
    await expect(firstLap.getByRole('button', { name: '1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByTestId('activity-lap-details-panel')).toBeVisible()
    await expect(page.getByText('Timer Time')).toBeVisible()
    await expect(page.getByText('Distance')).toBeVisible()
    await expect(
      page
        .getByTestId('activity-route-map')
        .or(page.getByTestId('activity-lap-route-empty')),
    ).toBeVisible()

    const secondLapButton = page
      .getByTestId('lap-row-2')
      .getByRole('button', { name: '2' })
    await secondLapButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('lap-row-2')).toHaveAttribute(
      'data-selected',
      'true',
    )

    await table.screenshot({
      path: path.join(SCREENSHOT_DIR, 'laps-table-selected.png'),
    })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'laps-page.png'),
      fullPage: true,
    })

    await page.getByTestId('garmin-tab-stats').click()
    await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByText('Heart Rate Zones')).toBeVisible()

    await page.getByTestId('garmin-tab-charts').click()
    await expect(page.getByTestId('chart-elevation')).toBeVisible({
      timeout: 20_000,
    })

    await page.getByTestId('garmin-tab-climbs').click()
    await expect(page.getByTestId('garmin-tab-climbs')).toBeVisible()
  })
})

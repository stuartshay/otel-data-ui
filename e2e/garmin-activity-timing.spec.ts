import { test, expect, type Page } from '@playwright/test'

// Regression test for a Garmin Edge 540 Solar device bug where the FIT
// session `timestamp` field was equal to `start_time` instead of the true
// end of the activity, causing every activity on that device to show an
// End Time identical to its Start Time. Backfilled in
// homelab-database-migrations #000031_backfill_garmin_end_time.
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_TIMING_ACTIVITY_ID ?? '23636261871'
const START_TIME_ISO = '2026-07-17T20:58:17Z'
const END_TIME_ISO = '2026-07-18T00:22:56.807Z'

// Formats in the browser (not the Node test runner) so the expectation uses
// the same Intl implementation and timezone as the UI under test.
function expectedTimeOfDay(page: Page, iso: string): Promise<string> {
  return page.evaluate(
    (value) =>
      new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
    iso,
  )
}

test.describe('Garmin activity timing statistics', () => {
  test('shows a distinct End Time consistent with Start Time + Elapsed Time', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.getByTestId('garmin-tab-stats').click()

    await expect(page.getByText('Timing', { exact: true })).toBeVisible({
      timeout: 20_000,
    })

    const startTimeRow = page
      .getByText('Start Time', { exact: true })
      .locator('..')
    const endTimeRow = page.getByText('End Time', { exact: true }).locator('..')
    const elapsedTimeRow = page
      .getByText('Elapsed Time', { exact: true })
      .locator('..')

    await expect(startTimeRow).toContainText(
      await expectedTimeOfDay(page, START_TIME_ISO),
    )
    await expect(endTimeRow).toContainText(
      await expectedTimeOfDay(page, END_TIME_ISO),
    )
    await expect(elapsedTimeRow).toContainText('3:24:39')

    const startText = await startTimeRow.innerText()
    const endText = await endTimeRow.innerText()
    expect(startText).not.toBe(endText)
  })
})

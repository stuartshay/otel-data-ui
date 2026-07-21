import { test, expect } from '@playwright/test'

// All of this user's recent cycling activities were recorded on a Garmin
// Edge 540 Solar (see garmin-activity-timing.spec.ts for the same activity),
// so once the historical sensor backfill has run, this activity's Sensors
// panel should show at least the primary recording device.
const ACTIVITY_ID =
  process.env.PLAYWRIGHT_GARMIN_SENSORS_ACTIVITY_ID ?? '23636261871'

test.describe('Garmin activity sensors', () => {
  test('shows the primary recording device on the Stats tab', async ({
    page,
  }) => {
    await page.goto(`/garmin/${ACTIVITY_ID}`)
    await page.getByTestId('garmin-tab-stats').click()

    const sensorsPanel = page.getByTestId('sensors-panel')
    await expect(sensorsPanel).toBeVisible({ timeout: 20_000 })
    // The activity's FIT device_info records can include a non-primary
    // component that shares the head unit's product name, so assert on the
    // panel's text as a whole rather than a specific (possibly duplicated)
    // element -- order- and count-independent.
    await expect(sensorsPanel).toContainText('Edge 540 Solar', {
      timeout: 20_000,
    })
    await expect(sensorsPanel.getByRole('listitem')).not.toHaveCount(0)
  })
})

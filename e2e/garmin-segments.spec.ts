import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'garmin-segments')
const SEGMENT_ID = process.env.PLAYWRIGHT_GARMIN_SEGMENT_ID ?? '1'

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Garmin Segments', () => {
  test.setTimeout(60_000)

  test('segments list renders a card and links to detail', async ({ page }) => {
    await page.goto('/garmin/segments')

    await expect(
      page.getByRole('heading', { name: 'Saved Segments' }),
    ).toBeVisible({ timeout: 20_000 })

    const card = page.getByTestId('segment-card').first()
    await expect(card).toBeVisible({ timeout: 20_000 })

    const miniMaps = page.getByTestId('segment-mini-map')
    await expect(miniMaps.first()).toBeVisible({ timeout: 20_000 })
    const cardCount = await page.getByTestId('segment-card').count()
    await expect(miniMaps).toHaveCount(cardCount)

    const firstMapBox = await miniMaps.first().boundingBox()
    expect(firstMapBox?.width).toBeGreaterThan(100)
    expect(firstMapBox?.height).toBeGreaterThan(80)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'segments-list.png'),
      fullPage: true,
    })
  })

  test('segment detail renders map and efforts leaderboard with PR', async ({
    page,
  }) => {
    await page.goto(`/garmin/segments/${SEGMENT_ID}`)

    await expect(page.getByTestId('segment-map')).toBeVisible({
      timeout: 20_000,
    })

    const rows = page.getByTestId('segment-effort-row')
    await expect(rows.first()).toBeVisible({ timeout: 20_000 })

    // The fastest effort carries the PR badge.
    await expect(page.getByTestId('segment-effort-pr').first()).toBeVisible()

    // Sort controls re-render the leaderboard.
    await page.getByRole('button', { name: 'Top speed' }).click()
    await expect(rows.first()).toBeVisible()

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'segment-detail.png'),
      fullPage: true,
    })
  })
})

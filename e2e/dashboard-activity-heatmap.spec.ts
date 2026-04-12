import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', 'dashboard-heatmap')

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Validates that the Dashboard page renders the Garmin Activity
 * calendar heatmap component with activity data and a legend.
 *
 * Takes screenshots of the full dashboard and the heatmap component
 * for visual verification.
 */
test.describe('Dashboard Activity Heatmap', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Wait for dashboard stats to confirm page is loaded
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('renders Garmin Activity heatmap card', async ({ page }) => {
    const prefix = `heatmap-${test.info().project.name}`

    // The heatmap card header should be visible
    await expect(page.getByText('Garmin Activity')).toBeVisible({
      timeout: 15_000,
    })

    // Screenshot: full dashboard with heatmap
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-full-dashboard.png`),
      fullPage: true,
    })
  })

  test('heatmap SVG and legend are rendered', async ({ page }) => {
    const prefix = `heatmap-${test.info().project.name}`

    // Wait for heatmap to finish loading (legend text appears after data loads)
    await expect(page.getByText('Less')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('More')).toBeVisible()

    // The calendar heatmap renders an SVG via react-calendar-heatmap
    const heatmapContainer = page.locator('.garmin-heatmap')
    await expect(heatmapContainer).toBeVisible()

    const svg = heatmapContainer.locator('svg')
    await expect(svg).toBeVisible()

    // Should have day rectangles rendered
    const rects = svg.locator('rect')
    const rectCount = await rects.count()
    expect(rectCount).toBeGreaterThan(50) // ~365 days of squares

    // Screenshot: zoomed-in heatmap component
    await heatmapContainer.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-heatmap-component.png`),
    })
  })

  test('heatmap displays activity summary stats', async ({ page }) => {
    // The summary line should show activity count and active days
    const summary = page.locator('text=/\\d+ activities over \\d+ days/')
    await expect(summary).toBeVisible({ timeout: 15_000 })
  })

  test('year dropdown changes the heatmap date range', async ({ page }) => {
    // Wait for heatmap to load
    await expect(page.getByText('Less')).toBeVisible({ timeout: 15_000 })

    // The year dropdown should be visible with the current year
    const heatmapCard = page.locator('[data-testid="garmin-heatmap-card"]')
    const trigger = heatmapCard.getByRole('combobox')
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveText(String(new Date().getFullYear()))

    // Select an earlier year
    await trigger.click()
    await page.getByRole('option', { name: '2020' }).click()
    await expect(trigger).toHaveText('2020')

    // Heatmap should still render with rects
    const svg = page.locator('.garmin-heatmap svg')
    await expect(svg).toBeVisible({ timeout: 15_000 })
    const rects = await svg.locator('rect').count()
    expect(rects).toBeGreaterThan(50)
  })

  test('heatmap squares have valid color classes applied', async ({ page }) => {
    const prefix = `heatmap-${test.info().project.name}`

    // Wait for data to load
    await expect(page.getByText('Less')).toBeVisible({ timeout: 15_000 })

    const heatmapContainer = page.locator('.garmin-heatmap')
    const svg = heatmapContainer.locator('svg')

    // Every rect should have a valid class from classForValue
    const validClasses = [
      'color-empty',
      'color-scale-1',
      'color-scale-2',
      'color-scale-3',
      'color-scale-4',
    ]
    const invalidCount = await svg.evaluate((el, classes) => {
      const rects = el.querySelectorAll('rect')
      return [...rects].filter(
        (r) => !classes.includes(r.getAttribute('class') ?? ''),
      ).length
    }, validClasses)
    expect(invalidCount).toBe(0)

    // At least some rects should exist and all have one of the valid classes
    const totalRects = await svg.locator('rect').count()
    expect(totalRects).toBeGreaterThan(50)

    // Screenshot: full page final state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-colored-squares.png`),
      fullPage: true,
    })
  })
})

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join(
  'e2e',
  'screenshots',
  'heatmap-weekday-alignment',
)

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

/**
 * Regression test for the Garmin Activity heatmap weekday labels.
 *
 * Bug: `react-calendar-heatmap` pins each weekday-label <text> baseline at
 * the BOTTOM of its row (`y = (dayIndex + 1) * SQUARE_SIZE + dayIndex *
 * gutterSize`). Combined with our 8px font and the 2px row gutter, that
 * made the "Mon" label's visible glyphs spill into the Tuesday row — so a
 * Monday rect (top row under the month labels) appeared to line up with
 * the "Mon" label one row below it.
 *
 * Fix: a CSS `translateY(-3px)` nudge on
 * `.react-calendar-heatmap-weekday-label` in `src/index.css` so each
 * weekday label sits vertically centered on its own row.
 *
 * This test guards the fix by asserting the visible vertical center of
 * each rendered weekday label (`Mon`, `Wed`, `Fri`) lies within its row's
 * rect bounds (i.e. NOT drifting into the next row's bounds).
 */
test.describe('Dashboard Heatmap Weekday Label Alignment', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('Less')).toBeVisible({ timeout: 30_000 })
  })

  test('weekday labels align with their own row, not the row below', async ({
    page,
  }) => {
    const prefix = `heatmap-weekday-${test.info().project.name}`

    // Grab the weekday label <text> elements (there are 3: Mon, Wed, Fri).
    const labels = await page.$$eval(
      '.garmin-heatmap text.react-calendar-heatmap-weekday-label',
      (els) =>
        els
          .map((el) => {
            const text = (el.textContent ?? '').trim()
            const bounds = el.getBoundingClientRect()
            return {
              text,
              top: bounds.top,
              bottom: bounds.bottom,
              center: bounds.top + bounds.height / 2,
            }
          })
          .filter((l) => l.text.length > 0),
    )

    expect(labels.map((l) => l.text)).toEqual(['Mon', 'Wed', 'Fri'])

    // Find a column with a full 7-row stack of rects so we can identify each
    // weekday row by index (Sun=0, Mon=1, ..., Sat=6). We bucket rects by
    // their x coordinate (rounded) and pick the first column that has 7
    // vertically-sorted rects.
    const sevenRowColumn = await page.$$eval(
      '.garmin-heatmap svg rect',
      (rects) => {
        const byCol = new Map<
          number,
          Array<{ top: number; bottom: number; center: number }>
        >()
        for (const el of rects) {
          const bounds = el.getBoundingClientRect()
          const col = Math.round(bounds.left)
          const row = {
            top: bounds.top,
            bottom: bounds.bottom,
            center: bounds.top + bounds.height / 2,
          }
          const bucket = byCol.get(col)
          if (bucket) {
            bucket.push(row)
          } else {
            byCol.set(col, [row])
          }
        }
        for (const rows of byCol.values()) {
          if (rows.length === 7) {
            return rows.sort((a, b) => a.top - b.top)
          }
        }
        return null
      },
    )

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-heatmap.png`),
      fullPage: false,
      clip: await page
        .locator('[data-testid="garmin-heatmap-card"]')
        .boundingBox()
        .then((b) => b ?? undefined),
    })

    expect(
      sevenRowColumn,
      'expected a heatmap column with all 7 weekday rows',
    ).not.toBeNull()

    const rows = sevenRowColumn!
    // Library: index 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday.
    const monRow = rows[1]
    const wedRow = rows[3]
    const friRow = rows[5]

    const monLabel = labels.find((l) => l.text === 'Mon')!
    const wedLabel = labels.find((l) => l.text === 'Wed')!
    const friLabel = labels.find((l) => l.text === 'Fri')!

    // Each label's visual center must fall within its own row's vertical
    // bounds — i.e. not drift into the adjacent row. We add no slack:
    // `top <= center <= bottom` is what "aligned" means visually.
    expect(
      monLabel.center,
      `Mon label center (${monLabel.center}) must be within Monday row bounds ` +
        `[${monRow.top}, ${monRow.bottom}]`,
    ).toBeGreaterThanOrEqual(monRow.top)
    expect(monLabel.center).toBeLessThanOrEqual(monRow.bottom)

    expect(
      wedLabel.center,
      `Wed label center (${wedLabel.center}) must be within Wednesday row bounds ` +
        `[${wedRow.top}, ${wedRow.bottom}]`,
    ).toBeGreaterThanOrEqual(wedRow.top)
    expect(wedLabel.center).toBeLessThanOrEqual(wedRow.bottom)

    expect(
      friLabel.center,
      `Fri label center (${friLabel.center}) must be within Friday row bounds ` +
        `[${friRow.top}, ${friRow.bottom}]`,
    ).toBeGreaterThanOrEqual(friRow.top)
    expect(friLabel.center).toBeLessThanOrEqual(friRow.bottom)

    // Tighter check: the label center should be within 2px of the row center.
    // This catches subtle drift that bounds-only checks might miss.
    const ROW_CENTER_TOLERANCE_PX = 2
    expect(Math.abs(monLabel.center - monRow.center)).toBeLessThanOrEqual(
      ROW_CENTER_TOLERANCE_PX,
    )
    expect(Math.abs(wedLabel.center - wedRow.center)).toBeLessThanOrEqual(
      ROW_CENTER_TOLERANCE_PX,
    )
    expect(Math.abs(friLabel.center - friRow.center)).toBeLessThanOrEqual(
      ROW_CENTER_TOLERANCE_PX,
    )
  })
})

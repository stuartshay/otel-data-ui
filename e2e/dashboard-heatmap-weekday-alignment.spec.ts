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
 * Regression test for the Garmin Activity heatmap weekday rows.
 *
 * Library contract (`react-calendar-heatmap@1.10.0`,
 * `getWeekdayLabelCoordinates`): every column is a vertical stack of 7 rects
 * with `dayIndex 0 = Sunday` at the TOP and `dayIndex 6 = Saturday` at the
 * bottom. Clicking the top rect of any full-week column must therefore open
 * the day popover with a "Sun, ..." header.
 *
 * Bug observed: clicking the top rect of a column opened the popover with a
 * "Mon, ..." header instead of "Sun, ..." — meaning the rendered rows or the
 * label nudge had pushed days out of sync.
 *
 * These tests are DOM-anchored:
 *   - row-index inside a column (the `react-calendar-heatmap` always renders
 *     7 rects per full week, top-to-bottom = Sun..Sat),
 *   - the date encoded in the rect's `<title>` (only emitted for cells with
 *     activity, which are also the only cells that fire the popover), and
 *   - the popover header text (`format(date, 'EEE, MMM d, yyyy')`).
 *
 * They do NOT rely on text bounding-box math — text bbox includes font
 * descender padding and produces a misleading "drift" reading.
 */

interface RectInfo {
  /** Date from `<title>` (`"YYYY-MM-DD"`) or empty string for cells with no activity. */
  date: string
  hasActivity: boolean
  top: number
  left: number
  width: number
  height: number
}

test.describe('Dashboard Heatmap Weekday Alignment', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('Less')).toBeVisible({ timeout: 30_000 })
  })

  test('every clickable rect sits on the row matching its weekday', async ({
    page,
  }) => {
    const columns = await fullWeekColumns(page)
    expect(
      columns.length,
      'expected at least one full-week column with 7 rects',
    ).toBeGreaterThan(0)

    const mismatches: Array<{
      date: string
      rowIndex: number
      weekday: number
    }> = []
    let checked = 0
    for (const col of columns) {
      for (let i = 0; i < col.length; i++) {
        const r = col[i]
        if (!r.date) continue
        checked++
        const wd = weekdayFromIsoDate(r.date)
        if (wd !== i)
          mismatches.push({ date: r.date, rowIndex: i, weekday: wd })
      }
    }

    expect(
      checked,
      'expected at least one rect with a date in <title>',
    ).toBeGreaterThan(0)
    expect(
      mismatches,
      `rects whose row-index in the column does not match their weekday ` +
        `(0=Sun..6=Sat): ${JSON.stringify(mismatches.slice(0, 10))}`,
    ).toEqual([])
  })

  test('clicking the top rect of a column opens the Sunday popover', async ({
    page,
  }) => {
    const prefix = `heatmap-weekday-${test.info().project.name}`

    const sundayColumn = await findSundayClickableColumn(page)
    if (!sundayColumn) {
      test.info().annotations.push({
        type: 'skip',
        description:
          'No full-week column has a Sunday with activity in the current ' +
          'year — cannot validate the popover click path. The row-index ' +
          'assertion above still guards the underlying weekday mapping.',
      })
      test.skip()
      return
    }

    const { columnRects, sundayRect } = sundayColumn

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-before-click.png`),
      fullPage: false,
      clip: await page
        .locator('[data-testid="garmin-heatmap-card"]')
        .boundingBox()
        .then((b) => b ?? undefined),
    })

    // Sanity: the rect we are about to click is genuinely a Sunday.
    expect(weekdayFromIsoDate(sundayRect.date)).toBe(0)
    // And it really is the top of its column.
    expect(sundayRect.top).toBe(columnRects[0].top)

    await page.mouse.click(
      sundayRect.left + sundayRect.width / 2,
      sundayRect.top + sundayRect.height / 2,
    )

    const popover = page.getByTestId('garmin-day-popover')
    await expect(popover).toBeVisible({ timeout: 10_000 })

    // Popover header is `format(date, 'EEE, MMM d, yyyy')` — Sunday short
    // form is "Sun".
    const headerText = (await popover.locator('p').first().textContent()) ?? ''
    expect(
      headerText,
      `popover header "${headerText}" must start with "Sun, " for ` +
        `clicked date ${sundayRect.date}`,
    ).toMatch(/^Sun,\s/)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-popover.png`),
      fullPage: false,
      clip: await page
        .locator('[data-testid="garmin-heatmap-card"]')
        .boundingBox()
        .then((b) => b ?? undefined),
    })
  })
})

/**
 * Reads every rect in the heatmap and groups them into columns (buckets by
 * rounded x). Returns only columns that have all 7 weekday rows, each
 * sorted top-to-bottom.
 */
async function fullWeekColumns(
  page: import('@playwright/test').Page,
): Promise<RectInfo[][]> {
  return page.$$eval('.garmin-heatmap svg rect', (rects) => {
    const dateRe = /(\d{4}-\d{2}-\d{2})/
    const activityRe = /color-scale-\d/
    const byCol = new Map<
      number,
      Array<{
        date: string
        hasActivity: boolean
        top: number
        left: number
        width: number
        height: number
      }>
    >()
    for (const el of rects) {
      const titleEl = el.querySelector('title')
      const titleText = (titleEl?.textContent ?? '').trim()
      const m = dateRe.exec(titleText)
      const bounds = el.getBoundingClientRect()
      const col = Math.round(bounds.left)
      const entry = {
        date: m ? m[1] : '',
        hasActivity: activityRe.test(el.getAttribute('class') ?? ''),
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      }
      const bucket = byCol.get(col)
      if (bucket) bucket.push(entry)
      else byCol.set(col, [entry])
    }
    const out: typeof byCol extends Map<number, infer V> ? V[] : never[] = []
    for (const rows of byCol.values()) {
      if (rows.length === 7) out.push(rows.sort((a, b) => a.top - b.top))
    }
    return out
  })
}

/**
 * Finds the first full-week column whose top rect (Sunday) has a colored
 * class — only those trigger the popover via the heatmap's `onClick`
 * (`if (!value.count) return`).
 */
async function findSundayClickableColumn(
  page: import('@playwright/test').Page,
): Promise<{ columnRects: RectInfo[]; sundayRect: RectInfo } | null> {
  const columns = await fullWeekColumns(page)
  for (const col of columns) {
    const top = col[0]
    if (top.hasActivity && top.date) {
      return { columnRects: col, sundayRect: top }
    }
  }
  return null
}

/** Returns 0..6 for Sun..Sat using a UTC-anchored date to avoid TZ skew. */
function weekdayFromIsoDate(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay()
}

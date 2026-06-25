import { expect, test, type Page } from '@playwright/test'

const GRAPHQL_ENDPOINT_PATTERN = '**/*'

const CYCLING_ACTIVITIES = [
  {
    activity_id: 'ride-thu',
    sport: 'cycling',
    sub_sport: null,
    start_time: '2026-06-18T08:00:00',
    end_time: '2026-06-18T09:00:00',
    distance_km: 50,
    duration_seconds: 3600,
    avg_heart_rate: null,
    max_heart_rate: null,
    avg_cadence: null,
    max_cadence: null,
    total_strokes: null,
    calories: null,
    avg_speed_kmh: null,
    max_speed_kmh: null,
    total_ascent_m: null,
    total_descent_m: null,
    total_distance: null,
    avg_pace: null,
    device_manufacturer: null,
    created_at: null,
    uploaded_at: null,
    track_point_count: null,
  },
  {
    activity_id: 'ride-sun',
    sport: 'cycling',
    sub_sport: null,
    start_time: '2026-06-21T08:00:00',
    end_time: '2026-06-21T09:30:00',
    distance_km: 75,
    duration_seconds: 5400,
    avg_heart_rate: null,
    max_heart_rate: null,
    avg_cadence: null,
    max_cadence: null,
    total_strokes: null,
    calories: null,
    avg_speed_kmh: null,
    max_speed_kmh: null,
    total_ascent_m: null,
    total_descent_m: null,
    total_distance: null,
    avg_pace: null,
    device_manufacturer: null,
    created_at: null,
    uploaded_at: null,
    track_point_count: null,
  },
]

async function mockDashboardGraphql(page: Page) {
  await page.route(GRAPHQL_ENDPOINT_PATTERN, async (route) => {
    const request = route.request()
    const url = request.url()
    if (request.method() !== 'POST' || !url.includes('gateway')) {
      await route.continue()
      return
    }

    const body = request.postDataJSON() as {
      operationName?: string
      variables?: Record<string, unknown>
    }
    const operationName = body.operationName

    const dataByOperation: Record<string, unknown> = {
      Health: { health: { status: 'ok', version: 'test' } },
      LocationCount: {
        locationCount: { count: 42, date: null, device_id: null },
      },
      GarminSports: {
        garminSports: [{ sport: 'cycling', activity_count: 2 }],
      },
      GarminDateRange: {
        garminDateRange: { min_date: '2026-01-01', max_date: '2026-06-24' },
      },
      DailySummary: {
        dailySummary: { items: [], total: 0, limit: 365, offset: 0 },
      },
      GarminActivityTotals: { garminActivityTotals: [] },
    }

    if (operationName === 'GarminActivities') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            garminActivities: {
              items: CYCLING_ACTIVITIES,
              total: CYCLING_ACTIVITIES.length,
              limit: body.variables?.limit ?? 200,
              offset: body.variables?.offset ?? 0,
            },
          },
        }),
      })
      return
    }

    if (!operationName || !(operationName in dataByOperation)) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Unhandled operation' }] }),
      })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: dataByOperation[operationName] }),
    })
  })
}

test.describe('Dashboard Cycling in Focus tooltip', () => {
  test('maps duplicate one-letter weekday ticks to the correct dates', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-06-24T12:00:00Z'))
    await mockDashboardGraphql(page)

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const card = page.getByTestId('cycling-in-focus-card')
    await expect(card.getByTestId('in-focus-week-range')).toHaveText(
      '· Jun 18 – Jun 24',
    )

    await expect
      .poll(async () =>
        card
          .getByTestId('cycling-week-chart')
          .locator('svg text')
          .evaluateAll((ticks) => ticks.map((tick) => tick.textContent)),
      )
      .toEqual(['T', 'F', 'S', 'S', 'M', 'T', 'W'])

    const bars = card
      .getByTestId('cycling-week-chart')
      .locator('.recharts-bar-rectangle path, .recharts-bar-rectangle rect')
    await expect(bars).toHaveCount(2)

    await bars.nth(0).hover()
    await expect(page.getByText('Thu, Jun 18, 2026')).toBeVisible()

    await bars.nth(1).hover()
    await expect(page.getByText('Sun, Jun 21, 2026')).toBeVisible()
  })
})

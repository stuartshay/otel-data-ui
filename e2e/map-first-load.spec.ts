import { test, expect } from '@playwright/test'

/**
 * Regression test for the "blank map on first visit" bug.
 *
 * Before the fix, navigating directly to /map rendered an empty container
 * because Leaflet initialized before the container had its final layout
 * dimensions, so no tiles were loaded until the user navigated away and back.
 *
 * These tests verify that on a fresh first load:
 *   - The Leaflet container is present and has non-zero dimensions.
 *   - Tile <img> elements are rendered inside the tile pane.
 *   - Data markers (CircleMarker SVG paths) are drawn for the current day.
 */
test.describe('Unified Map first-load rendering', () => {
  test('map renders tiles on direct navigation to /map', async ({ page }) => {
    await page.goto('/map')

    const heading = page.getByRole('heading', { name: 'Unified Map' })
    await heading.waitFor({ timeout: 15_000 })

    // Wait for the GraphQL query to resolve — the map div is only mounted
    // after the loading state unmounts, so the leaflet container cannot
    // exist until the point-count summary renders.
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 20_000,
    })

    const mapContainer = page.getByTestId('unified-map-container')
    await expect(mapContainer).toBeVisible()

    // Container must have non-zero dimensions before Leaflet can render tiles.
    const box = await mapContainer.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)

    // Leaflet adds the .leaflet-container class to the container element itself
    // (the div we passed to L.map()), not as a descendant.
    await expect(mapContainer).toHaveClass(/leaflet-container/, {
      timeout: 20_000,
    })

    // Tile images must be loaded inside the tile pane. This is what was
    // missing on first load before the invalidateSize() fix.
    const tileImages = mapContainer.locator(
      '.leaflet-tile-pane img.leaflet-tile',
    )
    await expect(tileImages.first()).toBeVisible({ timeout: 15_000 })
    const tileCount = await tileImages.count()
    expect(tileCount).toBeGreaterThan(0)

    // At least one tile should be fully loaded (class "leaflet-tile-loaded").
    await expect(
      mapContainer
        .locator('.leaflet-tile-pane img.leaflet-tile-loaded')
        .first(),
    ).toBeVisible({ timeout: 20_000 })
  })

  test('map renders data point markers on first load', async ({ page }) => {
    await page.goto('/map')

    await page.getByRole('heading', { name: 'Unified Map' }).waitFor({
      timeout: 15_000,
    })

    // Wait for the point-count summary to confirm the GraphQL query resolved.
    await expect(page.getByText(/[\d,]+ of [\d,]+ points/)).toBeVisible({
      timeout: 20_000,
    })

    const displayedText = await page
      .getByText(/[\d,]+ of [\d,]+ points/)
      .textContent()
    const displayed = parseInt(
      displayedText?.match(/^([\d,]+) of/)?.[1]?.replace(/,/g, '') ?? '0',
      10,
    )

    // Only assert markers are drawn when the API returned data for today.
    test.skip(
      displayed === 0,
      'No points available for current date; skipping marker assertion.',
    )

    // CircleMarker renders as an SVG <path> inside the overlay pane.
    const markers = page
      .getByTestId('unified-map-container')
      .locator('.leaflet-overlay-pane svg path')
    await expect(markers.first()).toBeVisible({ timeout: 15_000 })
    expect(await markers.count()).toBeGreaterThan(0)
  })

  test('map remains rendered after navigating away and back', async ({
    page,
  }) => {
    await page.goto('/map')
    await page.getByRole('heading', { name: 'Unified Map' }).waitFor({
      timeout: 15_000,
    })
    await expect(
      page
        .getByTestId('unified-map-container')
        .locator('.leaflet-tile-pane img.leaflet-tile')
        .first(),
    ).toBeVisible({ timeout: 15_000 })

    // Navigate to a different page, then back to /map.
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await page.getByRole('link', { name: 'Map' }).click()

    const mapContainer = page.getByTestId('unified-map-container')
    await expect(mapContainer).toBeVisible()
    await expect(
      mapContainer.locator('.leaflet-tile-pane img.leaflet-tile').first(),
    ).toBeVisible({ timeout: 15_000 })
  })
})

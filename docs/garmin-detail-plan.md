## Plan: Garmin Activity Detail Page Redesign

Redesign the Garmin activity detail page (`/garmin/:activityId`) to match the
Garmin Connect professional interface: route map with speed-colored polyline,
elevation/speed/HR/temperature charts (Recharts), stat summary bar, and detailed
stats panel — all using data already flowing through the stack.

The work spans 3 repos (otel-data-api, otel-data-gateway, otel-data-ui) with
the vast majority of effort in the frontend. All charting (recharts ^3.7.0) and
mapping (leaflet ^1.9.4) packages are already installed. Track points already
return altitude, speed_kmh, heart_rate, cadence, temperature_c, and
distance_from_start_km — the detail page simply doesn't use them yet (fetches
only 5 points for a count display).

Imperial units (mi, mph, ft, °F) match the Garmin Connect screenshots. Backend
exposes 5 additional DB columns (avg/min/max_temperature_c,
total_elapsed_time, total_timer_time) for the stats panel.

**Steps**

### Phase 1 — Backend (otel-data-api) `develop` branch

1. Add 5 fields to `GarminActivity` Pydantic model in
   `app/models/garmin.py`: `avg_temperature_c` (int|None),
   `min_temperature_c` (int|None), `max_temperature_c` (int|None),
   `total_elapsed_time` (float|None), `total_timer_time` (float|None).

2. Update SQL SELECT in `get_activity()` and `list_activities()` in
   `app/routers/garmin.py` to include the 5 new columns from the
   `garmin_activities` table.

3. Bump track points max limit from `le=5000` to `le=10000` in
   `list_track_points()` to support larger activities.

### Phase 2 — Gateway (otel-data-gateway) `develop` branch

4. Add 5 new fields to `GarminActivity` GraphQL type in
   `src/schema/typeDefs.ts`: `avg_temperature_c: Int`,
   `min_temperature_c: Int`, `max_temperature_c: Int`,
   `total_elapsed_time: Float`, `total_timer_time: Float`. No resolver
   changes needed (passthrough).

### Phase 3 — Frontend (otel-data-ui) `develop` branch

5. Create `src/lib/units.ts` — Unit conversion helpers:
   `kmToMi()`, `kmhToMph()`, `metersToFeet()`, `celsiusToFahrenheit()`,
   `formatDuration()` (moved from page), `formatPace()`. These are pure
   functions, all stateless.

6. Update `src/graphql/garmin.ts` — Add the 5 new fields to
   `GARMIN_ACTIVITY_QUERY`. No changes to `GARMIN_TRACK_POINTS_QUERY`
   (already returns all needed fields).

7. Create `src/components/garmin/ActivityHeader.tsx` — Sport icon
   (lucide-react: Bike, Footprints, Dumbbell, etc.), activity date/time,
   device manufacturer badge, sub_sport badge, back button to `/garmin`.

8. Create `src/components/garmin/ActivityStatsBar.tsx` — 4 large
   highlighted stat cards in a horizontal row: Distance (mi), Time
   (h:mm:ss), Avg Speed (mph), Elevation Gain (ft). Uses existing
   `Card` component with larger typography.

9. Create `src/components/garmin/ActivityRouteMap.tsx` — Leaflet map
   using the raw `L.map()` + `useRef` pattern from `MapPage.tsx`.
   Renders track points as a `L.polyline` with speed-based color
   segments (blue→green→yellow→red gradient). Includes a speed color
   legend. Start/end markers. Auto-fits bounds. Height: ~400px.

10. Create `src/components/garmin/ActivityCharts.tsx` — Recharts
    `AreaChart` components for Elevation, Speed, Heart Rate, and
    Temperature. X-axis is `distance_from_start_km` (converted to mi).
    Includes a Time/Distance toggle button group. Downsamples to ~800
    points for performance using nth-point sampling. Each chart is a
    separate card with consistent styling.

11. Create `src/components/garmin/ActivityStatsPanel.tsx` — Detailed
    stats grid inspired by Garmin Connect's tabbed panels. Sections:
    Distance (total distance mi, total distance km), Timing (elapsed
    time, timer time, moving time), Elevation (ascent ft, descent ft),
    Speed (avg mph, max mph, avg km/h, max km/h), Heart Rate (avg bpm,
    max bpm), Cadence (avg rpm, max rpm), Temperature (avg/min/max °F),
    Calories. Placeholder sections with "—" for unavailable metrics
    (Training Effect, VO2 Max, etc.).

12. Rewrite `src/pages/GarminDetailPage.tsx` — Compose all 5 components.
    Fetch activity detail + track points (limit: 5000). Pass data down
    as props. Loading/error states. Layout: Header → StatsBar → Map →
    Charts → StatsPanel (vertical stack).

### Phase 4 — Quality & Deploy

13. Run `npm run lint:all` and `npm run type-check` in otel-data-ui.
    Run `pre-commit run -a` in otel-data-api and otel-data-gateway.

14. Build Docker images and push to registries. Verify locally with
    `npm run build` (otel-data-ui), `make dev` (otel-data-api),
    `npm run build` (otel-data-gateway).

15. Commit to `develop` branches, create PRs, merge to production
    branches (master/main). Argo CD auto-syncs the k8s deployments.

16. Verify live at `https://data-ui.lab.informationcart.com/garmin/{id}`.

**Verification**

- `npm run build` passes with no errors (otel-data-ui)
- `npm run lint:all` and `npm run type-check` clean (otel-data-ui)
- `pre-commit run -a` clean (otel-data-api, otel-data-gateway)
- Navigate to `/garmin/{id}` — map renders with colored polyline
- Charts show elevation/speed/HR/temperature profiles
- Stats panel shows all available metrics in imperial units
- Responsive layout works on mobile widths
- Loading and error states display correctly

**Decisions**

- Imperial units (mi/mph/ft/°F) to match Garmin Connect screenshots
- Raw Leaflet (`L.map`) pattern, NOT react-leaflet components (matches MapPage.tsx)
- Recharts AreaChart (not LineChart) for filled chart appearance
- Speed-colored polyline: blue (slow) → green → yellow → red (fast)
- Track points downsampled to ~800 for charts, full set for map polyline
- Placeholder "—" for unavailable metrics rather than hiding sections
- 5 backend fields added for stats panel completeness (temperature summary, elapsed/timer time)
- No new npm packages needed — all dependencies already installed

**Files Modified (existing)**

| File | Repo | Change |
|------|------|--------|
| `app/models/garmin.py` | otel-data-api | +5 fields |
| `app/routers/garmin.py` | otel-data-api | SQL SELECT + limit bump |
| `src/schema/typeDefs.ts` | otel-data-gateway | +5 GarminActivity fields |
| `src/graphql/garmin.ts` | otel-data-ui | +5 fields in query |
| `src/pages/GarminDetailPage.tsx` | otel-data-ui | Full rewrite |

**Files Created (new)**

| File | Repo | Purpose |
|------|------|---------|
| `src/lib/units.ts` | otel-data-ui | Unit conversion helpers |
| `src/components/garmin/ActivityHeader.tsx` | otel-data-ui | Sport + date header |
| `src/components/garmin/ActivityStatsBar.tsx` | otel-data-ui | 4 key stat cards |
| `src/components/garmin/ActivityRouteMap.tsx` | otel-data-ui | Leaflet route map |
| `src/components/garmin/ActivityCharts.tsx` | otel-data-ui | Recharts elevation/speed/HR/temp |
| `src/components/garmin/ActivityStatsPanel.tsx` | otel-data-ui | Detailed stats grid |

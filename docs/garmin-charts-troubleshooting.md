# Garmin Charts Fix — Troubleshooting & Local Testing Report

**Date**: 2026-02-19
**Issue**: Garmin activity detail charts (Elevation, Speed) crash the page
**Affected Services**: otel-data-ui, otel-data-api
**Activity Used for Testing**: `21100373038` (50.6 km cycling)

---

## Problem Summary

After deploying otel-data-ui v1.0.42 and otel-data-api v1.0.58, the Garmin
activity detail page crashed when rendering Elevation and Speed charts. The
entire React app unmounted, leaving only a Recharts measurement span (`"0.5"`)
on screen. Playwright E2E tests failed against the deployed version.

## Root Cause Analysis

Two independent issues combined to cause the crash:

### 1. Duplicate Track Point Data (Backend)

Activity `21100373038` had **two imports** with identical timestamps and
coordinates but different row IDs:

| Import     | Row IDs  | Sensor Data                         |
| ---------- | -------- | ----------------------------------- |
| Old import | 1–7,453  | `altitude`, `speed_kmh` = NULL      |
| New import | 166,392+ | `altitude`, `speed_kmh` = populated |

The **simplified** query path (used for maps) already had `ROW_NUMBER`
deduplication (added in PR #22). However, the **non-simplified** query path
(used for charts) had no deduplication — it returned all **14,906 rows** with
null and non-null data interleaved.

### 2. Null Value Crash in Recharts Formatters (Frontend)

Recharts passes raw data values to `tickFormatter`, `formatter`, and
`labelFormatter` callbacks. When the chart data contained `null` values (from
the duplicate rows), these callbacks called `.toFixed()` on `null`:

```text
TypeError: Cannot read properties of null (reading 'toFixed')
```

This unhandled error crashed the entire React component tree, leaving only
`<div id="root"></div>` in the DOM.

## Diagnostic Process

### Step 1 — Identify the JavaScript Error

Ran a Playwright diagnostic script that captured page errors:

```text
PAGE ERRORS: Cannot read properties of null (reading 'toFixed')
BODY HTML: <div id="root"></div><span id="recharts_measurement_span">0.5</span>
```

### Step 2 — Query the API Directly

```bash
curl 'http://192.168.1.100/api/v1/garmin/activities/21100373038/track-points?limit=5' \
  | python3 -m json.tool
```

Found `total: 14906` but the activity only has ~7,453 unique timestamps. Rows
with even IDs (old import) had null sensor data; rows with odd IDs (new import)
had real data.

### Step 3 — Confirm Dedup Gap

The simplified path (with `simplify` parameter) already used:

```sql
ROW_NUMBER() OVER (PARTITION BY latitude, longitude
                   ORDER BY (altitude IS NOT NULL) DESC, id DESC)
```

The non-simplified path (no `simplify` parameter) had no such deduplication —
it was a plain `SELECT ... WHERE activity_id = $1`.

## Fixes Applied

### Backend Fix (otel-data-api) — PR #23

**File**: `app/routers/garmin.py`

1. **Deduplication**: Added `ROW_NUMBER` CTE to the non-simplified query path:

   ```sql
   WITH ranked AS (
     SELECT ...,
       ROW_NUMBER() OVER (
         PARTITION BY timestamp
         ORDER BY (altitude IS NOT NULL) DESC, id DESC
       ) AS rn
     FROM public.garmin_track_points
     WHERE activity_id = $1
   )
   SELECT ... FROM ranked WHERE rn = 1 ORDER BY ...
   ```

2. **Accurate count**: Changed `COUNT(*)` to `COUNT(DISTINCT timestamp)` so
   pagination metadata reflects the deduplicated total (7,453 vs 14,906).

### Frontend Fix (otel-data-ui) — PR #15

**File**: `src/components/garmin/ActivityCharts.tsx`

Added null guards to all four Recharts formatter callbacks:

| Formatter                | Before                       | After                             |
| ------------------------ | ---------------------------- | --------------------------------- |
| XAxis `tickFormatter`    | `v.toFixed(...)`             | `v != null ? v.toFixed(...) : ''` |
| YAxis `tickFormatter`    | `v.toFixed(0)`               | `v != null ? v.toFixed(0) : ''`   |
| Tooltip `formatter`      | `Number(value).toFixed(1)`   | `value != null ? ... : '—'`       |
| Tooltip `labelFormatter` | `Number(label).toFixed(...)` | `label != null ? ... : ''`        |

## Local Full-Stack Testing Procedure

### Architecture

```text
Browser (localhost:5173)
  → otel-data-ui (Vite dev server)
    → otel-data-gateway (Apollo Server, localhost:4000)
      → otel-data-api (FastAPI, localhost:8080)
        → PostgreSQL via PgBouncer (192.168.1.175:6432)
```

### Step 1 — Start the API

```bash
cd otel-data-api
source venv/bin/activate
make dev
# Verify: curl http://localhost:8080/health
```

### Step 2 — Start the Gateway

**Important**: The gateway has no `dotenv` package. You must source the `.env`
file manually:

```bash
cd otel-data-gateway
# Edit .env to point to local API:
#   OTEL_DATA_API_URL=http://localhost:8080
set -a; . ./.env; set +a
npm run dev
# Verify: curl http://localhost:4000 (GraphQL playground)
```

### Step 3 — Start the UI

```bash
cd otel-data-ui
# Edit .env.local to point to local gateway:
#   VITE_GRAPHQL_URL=http://localhost:4000
npm run dev
# Verify: open http://localhost:5173
```

### Step 4 — Run E2E Tests Against Local Stack

```bash
cd otel-data-ui
BASE_URL=http://localhost:5173 npx playwright test garmin-charts --reporter=list
```

### Step 5 — Restore Environment Files

After testing, restore `.env` / `.env.local` files to point back to deployed
services before committing.

## Test Results

### Local Stack (all passing)

```text
✓ Garmin Activity Charts › page loads with activity data (2.3s)
✓ Garmin Activity Charts › renders Elevation chart card (2.7s)
✓ Garmin Activity Charts › renders Speed chart card (2.6s)
✓ Garmin Activity Charts › toggle buttons switch X-axis (3.1s)
✓ Garmin Activity Charts › X-axis switches between distance and time (3.4s)

5 passed (14.1s)
```

### Deployed (pre-fix, failing)

All 5 tests failed with empty page — React app crashed before rendering charts.

## Improvements & Lessons Learned

### 1. Add a Data Integrity Check Migration

Create a migration or periodic job that detects duplicate track points (same
`activity_id` + `timestamp`) and removes the older import rows. This prevents
the issue at the data layer rather than relying on query-time deduplication.

### 2. Gateway Needs dotenv Support

The gateway requires manually sourcing `.env` (`set -a; . ./.env; set +a`)
before running `npm run dev`. Adding a `dotenv` package or a wrapper script
would simplify local development:

```bash
# Option A: Add dotenv package
npm install dotenv
# Then in src/index.ts: import 'dotenv/config'

# Option B: Create a dev script in package.json
"scripts": {
  "dev:local": "set -a && . ./.env && set +a && tsx watch src/index.ts"
}
```

### 3. Local Full-Stack Testing Script

Create a `scripts/local-stack.sh` that starts all three services with the
correct environment overrides, waits for health checks, and runs E2E tests:

```bash
#!/bin/bash
# Start API, Gateway, UI with local config
# Run playwright tests with BASE_URL=http://localhost:5173
# Tear down all services on exit
```

### 4. Null-Safe Formatter Pattern

Establish a project convention: all Recharts formatter callbacks must guard
against null/undefined values. Consider creating a shared utility:

```typescript
// src/lib/chart-utils.ts
export const safeFixed = (v: unknown, digits = 1): string =>
  v != null ? Number(v).toFixed(digits) : '—'
```

### 5. Backend Dedup as Default Behavior

Consider always applying `ROW_NUMBER`-based deduplication in all track point
queries, not just the simplified path. If duplicate imports are possible, every
query path should handle them consistently.

### 6. E2E Tests Against Staging Before Production

Run Playwright E2E tests as a CI gate before deploying to production. The
current flow deploys first and tests after — catching issues earlier would
prevent broken deployments from reaching users.

## Related PRs

| PR  | Repo          | Description                     | Status |
| --- | ------------- | ------------------------------- | ------ |
| #15 | otel-data-ui  | Null guards on chart formatters | Open   |
| #23 | otel-data-api | Dedup non-simplified query path | Open   |
| #22 | otel-data-api | Dedup simplified query path     | Merged |
| #14 | otel-data-ui  | data-testid selectors for E2E   | Merged |
| #13 | otel-data-ui  | Playwright E2E test suite       | Merged |

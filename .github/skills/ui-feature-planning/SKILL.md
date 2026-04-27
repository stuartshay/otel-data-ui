---
name: ui-feature-planning
description: 'Plan UI component enhancements from annotated screenshots. Use when: a screenshot shows visual annotation notes, when adding controls to existing dashboard components, when a chart or card needs new filter/selector behavior, when Playwright e2e tests with screenshot output are required as part of feature delivery. Covers: screenshot analysis, codebase exploration, requirements clarification, phased implementation plan with Playwright spec and unit test steps.'
---

# UI Feature Planning from Screenshot

## When to Use

Load this skill when:

- A user attaches a screenshot with annotation notes describing desired changes to a UI component
- You need to plan enhancements to existing React dashboard cards (charts, filters, toggles, selectors)
- The task requires a Playwright e2e test with screenshot output as part of deliverables
- You need to produce an actionable, phased plan before implementation begins

## Workflow

## Completion Gate (Mandatory)

Before declaring any UI feature task complete, you must do both:

1. Run the relevant Playwright spec(s) for the changed feature.
2. Produce screenshot artifact(s) for examination in `e2e/screenshots/<feature>/`.

Do not mark the task as complete if Playwright was not run or if screenshots were not generated.

### Phase 1 — Screenshot Analysis

Read the screenshot annotations carefully:

1. Identify the **component name** from the screenshot title or card header
2. List each annotation as a discrete requirement (label, control, behavior, data range)
3. Note which behaviors are conditional (e.g. "only show when X tab is active")
4. Note any deferred items explicitly called out ("will be different", "future")

### Phase 2 — Codebase Discovery

Launch an _Explore_ subagent (or parallel subagents for multi-area tasks) targeting `src/components/dashboard/` and related files. Request:

1. Exact file path of the component and its key exported function/symbol
2. How existing toggles/controls are implemented (state, component type)
3. What GraphQL query/hook drives the component and its variable shape
4. Whether a similar selector pattern already exists in another component (to reuse)
5. Existing Playwright test files in `e2e/` that cover this page — note the screenshot pattern used
6. Generated types in `src/__generated__/graphql.ts` for the relevant query

Key reference files in otel-data-ui:

- `src/components/dashboard/GarminActivityHeatmap.tsx` — canonical year-select + compact header Select pattern
- `e2e/dashboard-activity-heatmap.spec.ts` — canonical Playwright pattern: `mkdirSync` screenshot dir at top, `test.setTimeout(60_000)`, `beforeEach` page load wait, `element.screenshot()` + `page.screenshot()` for named PNGs
- `playwright.config.ts` — base URL (`https://data-ui.lab.informationcart.com`), chromium only, screenshots on failure

### Phase 3 — Requirements Clarification

Use `vscode_askQuestions` to resolve ambiguities before planning. Typical questions for dashboard chart enhancements:

1. **Mode behavior**: When control X is active, what exactly should the chart show? (one bar per year? rolling window? all history?)
2. **Control placement**: Where in the card header should the new control appear? (next to which existing control?)
3. **Data range source**: Should range bounds be fixed values or derived from the API's min/max dates?
4. **Chart labeling**: What should x-axis labels and any subtitle/header text say to communicate the selected context?
5. **Scope boundary**: Which existing tabs/modes should stay unchanged for this change?

### Phase 4 — Plan Construction

Build a phased plan with these standard sections:

#### Required Steps (always include)

1. **Data semantics** — confirm query variable shape and expected API response for new mode. Identify any backend changes needed.
2. **UI state + controls** — add state variables, conditional rendering of new controls, defaults.
3. **Data fetching** — derive dynamic parameters (date bounds, year range) from API or computed values; include fallback behavior.
4. **Chart labels + context** — update axis labels, tooltips, titles to communicate the selected context.
5. **Non-regressing modes** — explicitly preserve all other tab/mode behaviors.
6. **Unit tests** — cover: new default state, user interaction updating query vars, regression on unchanged modes.
7. **Playwright e2e spec** — `e2e/dashboard-<feature>.spec.ts` with screenshots to `e2e/screenshots/<feature>/`. Must cover:
   - New control visible in correct mode, default value correct; full-card screenshot
   - Control change re-renders chart; element-level screenshot of chart card
   - Other tabs/modes do not show the new control; element screenshot per tab
   - Metric or secondary toggle still works in new mode; screenshot
8. **Validation** — `npm run lint:all`, `npm run type-check`, `npm run test:run`, `npx playwright test e2e/dashboard-<feature>.spec.ts`; review screenshots.
9. **Completion gate check** — confirm Playwright run passed (or document failures with evidence) and confirm screenshot files exist in `e2e/screenshots/<feature>/` before final handoff.

#### Playwright Spec Template

```typescript
import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join('e2e', 'screenshots', '<feature-name>')
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('<Component> — <Feature>', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Total Locations')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('default state renders correctly', async ({ page }) => {
    const prefix = `<feature>-${test.info().project.name}`
    // assert default control value
    // full dashboard screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-01-default.png`),
      fullPage: true,
    })
  })

  test('control change updates chart', async ({ page }) => {
    const prefix = `<feature>-${test.info().project.name}`
    // interact with control
    // assert chart update
    // element screenshot
    const card = page.locator('[data-testid="<card-testid>"]')
    await card.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-02-after-change.png`),
    })
  })

  test('other tabs do not show new control', async ({ page }) => {
    const prefix = `<feature>-${test.info().project.name}`
    // click other tab
    // assert new control not visible
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${prefix}-03-other-tab.png`),
    })
  })
})
```

#### Scope Boundary Template

Always document explicitly:

- **Included**: what this plan changes
- **Excluded**: what is deliberately deferred (note as follow-up)

### Phase 5 — Plan Review & Save

1. Save the complete plan to `/memories/session/plan.md` via the `memory` tool
2. Present the plan to the user (the memory file is for persistence only — always show it)
3. Iterate on feedback before handing off to implementation

## Component Patterns Quick Reference

### Conditional control rendering (only show on one tab)

```tsx
{period === 'month' && (
  <Select value={...} onValueChange={...}>
    ...
  </Select>
)}
```

### Compact header Select (matches heatmap style)

```tsx
<Select value={String(selected)} onValueChange={(v) => setSelected(Number(v))}>
  <SelectTrigger className="h-7 w-24 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {OPTIONS.map((opt) => (
      <SelectItem key={opt.value} value={String(opt.value)}>
        {opt.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### API-derived year range (matches heatmap pattern)

```typescript
const OLDEST_YEAR = minDateYear // from garminDateRange query
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - OLDEST_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i,
)
```

### Monthly-by-year date range computation

```typescript
// First day of selected month across all available years
const date_from = format(new Date(minYear, selectedMonth, 1), 'yyyy-MM-dd')
// Last day of selected month in current/max year
const date_to = format(
  endOfMonth(new Date(maxYear, selectedMonth, 1)),
  'yyyy-MM-dd',
)
```

## Verification Checklist

Before marking a plan ready for implementation, confirm:

- [ ] Every screenshot annotation maps to at least one plan step
- [ ] Component file and key symbols are identified (not just directory)
- [ ] GraphQL query variable shapes are confirmed against `__generated__/graphql.ts`
- [ ] Playwright spec file name follows `e2e/dashboard-<feature>.spec.ts` convention
- [ ] Screenshot output path follows `e2e/screenshots/<feature>/` convention
- [ ] Playwright spec was actually executed for the feature before completion
- [ ] Screenshot artifacts were generated and available for examination
- [ ] Excluded/deferred items are explicitly noted in scope decisions
- [ ] Plan saved to `/memories/session/plan.md`

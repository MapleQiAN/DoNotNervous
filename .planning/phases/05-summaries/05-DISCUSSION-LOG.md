# Phase 5: Summaries & Insights - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 05-Summaries
**Areas discussed:** Pre-computation strategy, Summary content & layout, Mood chart design, Weekly insights logic

---

## Pre-computation Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Materialized table | New Dexie tables dailySummaries + weeklySummaries, schema v4 | ✓ |
| Compute on demand | No new table, useLiveQuery aggregation each render | |
| In-memory cache | Zustand store, recompute on source data change, lost on reload | |

**User's choice:** Materialized table
**Notes:** Schema v4 with two new tables. Eager refresh selected — recompute immediately on every data change. Both daily AND weekly rows stored separately (user chose daily + weekly rows over daily-only).

---

## Summary Content & Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked cards | Single scrollable page: daily card + chart + weekly insights | |
| Tabbed sections | Tabs within 数据复盘: 日总结 / 周总结 / 心情趋势 | ✓ |
| Dashboard grid | 2x2 or 3-column grid of stat cards + chart | |

**User's choice:** Tabbed sections
**Notes:** 3 tabs. Daily tab = full detail view (stats + task list + mood entries + point transactions). Arrow navigation between days. Weekly tab = stats + best day highlight + mood trajectory mini chart.

---

## Mood Chart Design

| Option | Description | Selected |
|--------|-------------|----------|
| Area chart | Smooth area with mood score Y-axis, color-filled trajectory | ✓ |
| Line chart | Dots at data points, emoji labels on hover | |
| Bar chart | Mood emoji distribution count per mood | |

**User's choice:** Area chart
**Notes:** Numeric mood score mapping (😊🥳=5, 😌💪=4, 😐=3, 😔=2, 😰😡=1). Time range selector: 7/14/30 days. Dominant mood per day as Y-value.

---

## Weekly Insights Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Most tasks completed | Ties broken by points | |
| Best mood score | Well-being over productivity | |
| Composite score | tasks×0.4 + mood×0.3 + points×0.3 | ✓ |

**User's choice:** Composite score, with user override
**Notes:** User wants system to suggest best day via composite formula, but also allow user to manually select a different best day. "Suggest + override" approach selected.

---

## Claude's Discretion

- Mood score mapping exact values
- Daily summary section ordering and spacing
- Weekly summary card visual design
- Area chart color gradient (warm palette)
- Best day highlight card animation/style
- Arrow navigation styling and animation
- Tab transition animation
- Composite score formula weights
- Recharts chart styling
- Empty state messaging

## Deferred Ideas

None — discussion stayed within phase scope

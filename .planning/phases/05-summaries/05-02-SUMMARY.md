---
phase: 05-summaries
plan: 02
subsystem: hooks
tags: [react-hooks, useLiveQuery, dexie, summary, eager-refresh, recharts]

# Dependency graph
requires:
  - phase: 05-summaries-plan-01
    provides: "DailySummary, WeeklySummary types, computeDailySummary, computeWeeklySummary, getWeekRange, MOOD_SCORE, Dexie v4 schema"

provides:
  - "refreshDailySummary and refreshWeeklySummary functions for materialized summary storage"
  - "refreshDailySummaryForToday convenience helper"
  - "useDailySummary reactive hook reading db.dailySummaries via useLiveQuery"
  - "useWeeklySummary reactive hook reading db.weeklySummaries via useLiveQuery"
  - "useMoodChartDays reactive hook returning {date, moodScore} array for Recharts (D-08, D-10)"
  - "Eager refresh triggers wired into completeTask, createMoodEntry, redeemReward (D-02)"

affects: [05-summaries-plan-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [eager-refresh-triggers, materialized-summary-hooks, mood-chart-data]

key-files:
  created:
    - src/hooks/useSummary.ts
  modified:
    - src/hooks/__tests__/useSummary.test.ts
    - src/hooks/useTaskActions.ts
    - src/hooks/useMoodEntries.ts
    - src/hooks/useRewards.ts

key-decisions:
  - "refreshDailySummary also triggers weekly summary refresh eagerly (cascade refresh per D-02)"
  - "useMoodChartDays uses dominantMoodScore from dailySummaries table, not raw mood entries"
  - "All refresh triggers are fire-and-forget with .catch to avoid breaking callers"

patterns-established:
  - "Eager refresh pattern: action functions call refreshDailySummaryForToday().catch() after DB writes"
  - "Materialized read pattern: hooks use useLiveQuery on summary tables for reactive UI updates"

requirements-completed: [SUMM-02, SUMM-04]

# Metrics
duration: 6min
completed: 2026-05-05
---

# Phase 5 Plan 02: Summary Hooks & Eager Refresh Summary

**Reactive summary hooks (useDailySummary, useWeeklySummary, useMoodChartDays) with eager refresh triggers wired into completeTask, createMoodEntry, and redeemReward per D-02**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-05T04:08:00Z
- **Completed:** 2026-05-05T04:14:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created useSummary.ts with 3 reactive hooks and 3 refresh functions
- useDailySummary reads db.dailySummaries reactively via useLiveQuery
- useWeeklySummary reads db.weeklySummaries reactively via useLiveQuery
- useMoodChartDays returns {date, moodScore} array for 7/14/30-day Recharts charts
- refreshDailySummary computes and upserts to db.dailySummaries, cascades to weekly
- refreshWeeklySummary computes and upserts to db.weeklySummaries
- refreshDailySummaryForToday convenience helper using toDayKey(new Date())
- Wired eager refresh into completeTask (after transaction, before celebration)
- Wired eager refresh into createMoodEntry (after DB write, before return)
- Wired eager refresh into redeemReward (after transaction, before return)
- All 187 tests pass, TypeScript compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create summary hooks with eager refresh** - `a88f698` (feat)
2. **Task 2: Wire refresh triggers into existing actions** - `9a57084` (feat)

_Note: Task 1 followed TDD approach - RED tests written first, then GREEN implementation._

## Files Created/Modified
- `src/hooks/useSummary.ts` - Reactive hooks (useDailySummary, useWeeklySummary, useMoodChartDays) and refresh functions
- `src/hooks/__tests__/useSummary.test.ts` - 6 new tests added (24 total) covering refresh and chart data
- `src/hooks/useTaskActions.ts` - Added refreshDailySummaryForToday trigger after completeTask transaction
- `src/hooks/useMoodEntries.ts` - Added refreshDailySummaryForToday trigger after createMoodEntry DB write
- `src/hooks/useRewards.ts` - Added refreshDailySummaryForToday trigger after redeemReward transaction

## Decisions Made
- **Cascade weekly refresh**: refreshDailySummary also calls refreshWeeklySummary for the containing week. This ensures weekly summaries are always consistent with daily data without requiring a separate trigger.
- **Mood chart reads from summaries**: useMoodChartDays reads dominantMoodScore from the materialized dailySummaries table rather than querying raw mood entries. This is more efficient and consistent with the materialized view pattern.
- **Non-blocking triggers**: All refresh calls use .catch(() => {}) to ensure the caller (e.g., completeTask) never fails if the summary refresh encounters an error.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Summary hooks ready for UI components in Plan 03 (daily summary card, weekly summary card, mood chart)
- Eager refresh triggers ensure summaries are always up-to-date after any data change
- useMoodChartDays provides data directly consumable by Recharts area chart

---
*Phase: 05-summaries*
*Completed: 2026-05-05*

## Self-Check: PASSED

- [x] src/hooks/useSummary.ts - FOUND
- [x] src/hooks/__tests__/useSummary.test.ts - FOUND
- [x] src/hooks/useTaskActions.ts - FOUND
- [x] src/hooks/useMoodEntries.ts - FOUND
- [x] src/hooks/useRewards.ts - FOUND
- [x] .planning/phases/05-summaries/05-02-SUMMARY.md - FOUND
- [x] Commit a88f698 - FOUND
- [x] Commit 9a57084 - FOUND

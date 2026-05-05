---
phase: 07-fix-mood-consistency
plan: 01
status: complete
requirements_completed:
  - MOOD-04
---

# Plan 07-01: Fix MoodCalendar Divergent Mood Scores and Remove Hardcoded Data

## Summary

Fixed MoodCalendar to use canonical `MOOD_SCORE` from `domain/summary.ts` and removed all hardcoded fallback/demo data. Three emoji scores were wrong in the local copy (happy=4→5, calm=3→4, neutral=2→3). All fake trend data, records, stats, and insights replaced with real-data-driven display or proper empty states.

## Changes

### Single File Modified

- `src/components/mood/MoodCalendar.tsx` — replaced divergent local `moodScore` with canonical import; removed `fallbackTrend`, `fallbackRecords`; fixed SVG chart to use real dates and dynamic scaling; replaced hardcoded stats/insights with computed or empty-state values

## Verification

- TypeScript compilation: passed (0 errors)
- Test suite: 187/187 passed
- All 12 acceptance criteria grep checks pass
- `MOOD_SCORE` imported from `domain/summary` and used in 3 locations

## Key Decisions

- Stats not derivable from mood data (task count, reward amount, focus period) show `--` with `暂无数据` rather than fabricated values
- Chart scales dynamically to actual number of data points instead of assuming exactly 7
- Empty states use descriptive Chinese text matching app's existing tone

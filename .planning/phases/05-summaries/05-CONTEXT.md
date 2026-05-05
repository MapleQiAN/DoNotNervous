# Phase 5: Summaries & Insights - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Aggregated views of all user data: daily summaries (tasks done, points earned, mood entries, point transactions), weekly summaries (trends, best day highlight, mood trajectory), mood trend chart (area chart over 7/14/30 days). Pre-computed via materialized Dexie tables for instant loading. Requirements SUMM-01~04. The existing "数据复盘" nav tab (Header.tsx) gets its own dedicated page replacing the current MoodCalendar shared view.

</domain>

<decisions>
## Implementation Decisions

### Pre-computation Strategy
- **D-01:** Materialized summary tables in Dexie (schema v4). Two new tables: `dailySummaries` and `weeklySummaries`. Each stores pre-aggregated data for instant reads.
- **D-02:** Eager refresh — recompute summary row immediately after every data change (task complete, mood log, point earn, reward redemption). Always up-to-date.
- **D-03:** Both daily and weekly summary rows stored separately. Daily = one row per day. Weekly = one row per week. Weekly reads are single-row lookups.

### Summary Content & Layout
- **D-04:** Tabbed layout within 数据复盘 page: 3 tabs — 日总结 (Daily) / 周总结 (Weekly) / 心情趋势 (Mood Trend).
- **D-05:** Daily summary = full detail view: (1) stats row (task count, points earned, dominant mood emoji), (2) completed task list for that day, (3) all mood entries for that day, (4) point transaction list for that day.
- **D-06:** Arrow navigation for daily summary — left/right arrow buttons to go prev/next day. Current date displayed between arrows.
- **D-07:** Weekly summary = stats row (total tasks, total points, avg mood, streak days) + best day highlight card + mood trajectory mini chart (7-day area). Scrollable.

### Mood Chart Design
- **D-08:** Recharts area chart. Mood score on Y-axis (1-5 numeric scale), days on X-axis. Color-filled area shows mood trajectory.
- **D-09:** Mood emoji mapped to numeric score: 😊=5, 🥳=5, 😌=4, 💪=4, 😐=3, 😔=2, 😰=1, 😡=1. Dominant mood per day used as Y-value.
- **D-10:** Time range selector: 7 days (default) / 14 days / 30 days. User switches via button group or segmented control.

### Weekly Insights Logic
- **D-11:** "Best day" determined by composite score: tasks × 0.4 + mood score × 0.3 + points × 0.3. Ties broken by task count.
- **D-12:** User can override best day — system suggests best day, user can tap "pick your own" to select any day as their best day. Shows emoji/reason on their choice.
- **D-13:** Completion rate = tasks completed / tasks created that week. Shown as percentage in weekly stats.

### Claude's Discretion
- Mood score mapping exact values (current: positive moods 4-5, neutral 3, negative 1-2)
- Daily summary section ordering and spacing
- Weekly summary card visual design (colors, layout)
- Area chart color gradient (warm palette consistent with app theme)
- Best day highlight card animation/style
- Arrow navigation styling and animation
- Tab transition animation
- Composite score formula weights (current: 0.4/0.3/0.3)
- Recharts chart styling (tooltip, grid, axes)
- Empty state messaging when no data exists for a day/week

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Outputs (integration points)
- `.planning/phases/04-mascot-animations/04-CONTEXT.md` — Phase 4 decisions (mascot, confetti, responsive, nav tabs)
- `.planning/phases/03-mood-rewards/03-CONTEXT.md` — Phase 3 decisions (mood picker, mood calendar, reward shop)
- `.planning/phases/02-gamification-core-points-streaks/02-CONTEXT.md` — Phase 2 decisions (point values, ledger, streaks)

### Requirements
- `.planning/REQUIREMENTS.md` — SUMM-01~04 requirement definitions

### Project Decisions
- `.planning/STATE.md` — Key decisions (event-sourced ledger, Dexie storage, anti-anxiety principles)

### Source Code (aggregation data sources)
- `src/domain/types.ts` — All type definitions (Task, PointLedgerEntry, StreakRecord, MoodEntry, Reward, Redemption)
- `src/domain/mood.ts` — Mood emoji set and labels
- `src/hooks/useMoodEntries.ts` — Mood queries including useMoodEntriesForDate
- `src/hooks/usePoints.ts` — Point balance and transaction queries
- `src/hooks/useStreaks.ts` — Streak data hooks
- `src/hooks/useTaskCount.ts` — Task count hooks
- `src/db/index.ts` — Dexie database schema (currently v3, Phase 5 adds v4)
- `src/lib/date-utils.ts` — Date utility functions (toDayKey, daysAgo)
- `src/components/layout/AppShell.tsx` — Page routing (data tab at line 81)
- `src/components/layout/Header.tsx` — Nav tabs (数据复盘 at line 16)
- `src/components/mood/MoodCalendar.tsx` — Current data tab component (will be replaced/extended)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/index.ts` — Dexie database. Schema v4 needed: add `dailySummaries` and `weeklySummaries` tables.
- `src/domain/types.ts` — Type definition pattern. New types: DailySummary, WeeklySummary.
- `src/hooks/useMoodEntries.ts` — `useMoodEntriesForDate(dayKey)` already filters mood entries by day. Reuse for daily summary mood section.
- `src/hooks/usePoints.ts` — `useRecentTransactions()` fetches recent point ledger entries. Pattern reference for filtering by date range.
- `src/hooks/useStreaks.ts` — Streak data. Weekly summary needs streak days count.
- `src/hooks/useTaskCount.ts` — Task counting hooks. Reuse pattern for daily/weekly task aggregation.
- `src/lib/date-utils.ts` — `toDayKey()`, `daysAgo()` for date normalization. Core utility for summary date handling.
- `src/components/mood/MoodCalendar.tsx` — Currently handles both 'mood' and 'data' tabs (AppShell.tsx:81). Phase 5 replaces data tab with dedicated summary page.
- `src/components/layout/Header.tsx` — 5-tab nav already includes 数据复盘 tab. No nav changes needed.

### Established Patterns
- Dexie table registration: `this.version(N).stores({ tableName: 'key, indexedFields' })`
- Dexie hooks: `useLiveQuery` for reactive DB reads
- Zustand store: `create<StoreType>()((set) => ({ ... }))` for summary UI state
- Component pattern: TypeScript interface props, Tailwind v4 utility classes, Framer Motion for animations
- ID generation: `generateId()` from `src/lib/id.ts`
- Event-sourced ledger: point transactions are immutable records (summary aggregates these)

### Integration Points
- `db.tasks` — aggregate completed tasks per day (where completedAt within day range, status='completed')
- `db.pointLedger` — aggregate points per day (where createdAt within day range)
- `db.moodEntries` — aggregate mood entries per day (where createdAt within day range)
- `db.streakRecords` — streak days count for weekly summary
- `db.redemptions` — include in daily/weekly point transaction detail
- `completeTask()` in `useTaskActions.ts` — trigger daily summary refresh
- `createMoodEntry()` in `useMoodEntries.ts` — trigger daily summary refresh
- Point ledger writes — trigger daily summary refresh
- `AppShell.tsx:81` — change data tab routing from MoodCalendar to new SummaryPage component
- `Header.tsx:16` — 数据复盘 tab already exists, no change needed

</code_context>

<specifics>
## Specific Ideas

- User wants "best day" to be customizable — system suggests via composite score, but user can override and pick their own best day. Personal touch fits anti-anxiety theme.
- Full detail daily view — not just stats cards, but actual lists of tasks, moods, and transactions for that day. Richer than typical summary screens.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-Summaries*
*Context gathered: 2026-05-05*

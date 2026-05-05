# Phase 9: Advanced Streak Features - Research

**Researched:** 2026-05-05
**Domain:** Streak recovery mechanics, calendar visualization, Dexie schema evolution
**Confidence:** HIGH

## Summary

Phase 9 adds two v2 streak features to the existing anti-anxiety streak system: (1) **STRK-06 "Earn back" streak recovery** -- an opportunity-based mechanic where users can recover a broken streak by completing an extra task within 24 hours, and (2) **STRK-07 Streak calendar view** -- a monthly grid showing completion patterns with positive visual framing. Both features extend the existing `StreakRecord` model and the `useStreaks` hook infrastructure built in Phase 2.

The existing streak system uses period records (one `StreakRecord` per day in IndexedDB via Dexie v4), walks backward to compute streak length, and auto-applies up to 2 streak freezes for gap days. The "earn back" feature adds a third recovery layer: after freezes are exhausted and the streak breaks, the user has a 24-hour window to complete an extra task and restore continuity. The calendar view reuses the same `streakRecords` table as its data source and follows the established `MoodCalendar` component pattern for layout.

**Primary recommendation:** Extend `StreakRecord` with new fields (`recoveredFrom`, `recoveryTaskId`) rather than creating a new table. Use Dexie v5 schema (bumping from v4) with a `Version.upgrade()` callback to backfill defaults. Build the calendar using `date-fns` utilities already in the project. Keep the data layer, hook logic, and UI in separate waves matching the established 3-wave pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STRK-06 | "Earn back" streak recovery -- complete extra task to recover within 24h | StreakRecord schema extension, recovery detection logic, earn-back window calculation, interaction with freeze system |
| STRK-07 | Streak calendar view showing monthly completion patterns | date-fns calendar grid utilities, StreakRecord query by month range, MoodCalendar component pattern for layout reuse |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Streak recovery detection | API / Domain | -- | Business logic: detect broken streak, validate 24h window, apply recovery |
| Recovery task tracking | API / Domain | Database / Storage | Modify StreakRecord, write recovery metadata |
| Streak calendar data query | API / Domain | Database / Storage | Query streakRecords by date range, derive day states |
| Calendar grid rendering | Browser / Client | -- | Pure UI: date-fns grid generation, CSS grid, visual state per cell |
| Calendar navigation | Browser / Client | -- | Month prev/next, state management |
| Recovery prompt UI | Browser / Client | -- | Toast/banner when earn-back is available |
| Schema migration | Database / Storage | -- | Dexie version upgrade, backfill defaults |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | ^4.4.2 (latest: 4.4.2) | IndexedDB wrapper, schema versioning | Already in project; v5 schema upgrade needed for new fields |
| dexie-react-hooks | ^4.4.0 (latest: 4.4.0) | `useLiveQuery` for reactive queries | Already in project; used by all existing hooks |
| date-fns | ^4.1.0 (latest: 4.1.0) | Calendar grid: `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `getDay`, `format` | Already in project; used by MoodCalendar, useStreaks |
| vitest | ^4.1.5 | Test framework | Already configured; all streak tests use it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^4.3.6 | Schema validation for new domain types | Validate recovery-related inputs |
| lucide-react | ^1.12.0 | Calendar icons, recovery icons | UI consistency with existing components |
| framer-motion | ^12.38.0 | Calendar cell animations, recovery celebration | Micro-interactions, consistent with project patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending StreakRecord | New RecoveryEvent table | New table adds complexity; extending existing record is simpler and co-locates all day data. New table only makes sense if recovery events are many-to-one with days, but they are one-to-one. |
| date-fns calendar helpers | Custom date math | date-fns is already installed and handles edge cases (leap years, timezone). No reason to hand-roll. |
| Full separate calendar page | Calendar within existing page | Could embed in data/summary page; but a dedicated view is cleaner for STRK-07's scope. |

**Installation:**
No new packages needed. All dependencies are already installed.

**Version verification:**
```bash
npm view dexie version     # 4.4.2 (current)
npm view date-fns version  # 4.1.0 (current)
npm view vitest version    # 4.1.5 (current)
```

## Architecture Patterns

### System Architecture Diagram

```
[User completes task]
       |
       v
[completeTask] --> [computeCurrentStreak] --> [StreakDisplay]
       |                    |
       v                    v
[StreakRecord upsert]  [checkStreakMilestone]
       |
       v
[checkAndApplyFreezes]  (on AppShell mount)
       |
       v
[StreakRecord: freezeUsed?]

--- NEW FLOW (STRK-06) ---

[App loads / task completes]
       |
       v
[detectEarnBackOpportunity]  <-- reads last 2 days of streakRecords
       |
       v
[recoveryAvailable?]
   YES --> [show recovery prompt in UI]
   |              |
   |              v
   |    [User completes extra task]
   |              |
   |              v
   |    [applyEarnBackRecovery]
   |              |
   |              v
   |    [StreakRecord for gap day: {freezeUsed: false, recoveredFrom: true, recoveryTaskId}]
   |
   NO --> normal flow

--- NEW FLOW (STRK-07) ---

[User navigates to streak calendar]
       |
       v
[useStreakCalendarMonth(year, month)]
       |
       v
[db.streakRecords.where('date').between(startOfMonth, endOfMonth)]
       |
       v
[date-fns: eachDayOfInterval(startOfWeek(monthStart), endOfWeek(monthEnd))]
       |
       v
[Map each day --> {date, state: 'active'|'frozen'|'recovered'|'missed'|'future'}]
       |
       v
[StreakCalendar grid rendering]
```

### Recommended Project Structure
```
src/
+-- domain/
|   +-- streaks.ts           # (existing) Add EARN_BACK_WINDOW_HOURS, recovery types
|   +-- types.ts             # (existing) Extend StreakRecord with recovery fields
+-- hooks/
|   +-- useStreaks.ts        # (existing) Add detectEarnBackOpportunity, applyEarnBackRecovery, useStreakCalendarMonth
|   +-- useTaskActions.ts    # (existing) Wire earn-back check into completeTask
+-- components/
|   +-- gamification/
|   |   +-- StreakDisplay.tsx     # (existing) Add recovery banner when applicable
|   |   +-- StreakCalendar.tsx    # (NEW) Monthly streak calendar grid
|   +-- layout/
|   |   +-- AppShell.tsx          # (existing) Route to StreakCalendar
+-- db/
|   +-- index.ts              # (existing) Bump to version(5), add upgrade callback
```

### Pattern 1: StreakRecord Extension for Recovery

**What:** Add optional recovery fields to the existing StreakRecord type. A gap day record created by earn-back gets `recoveredFrom: true` and `recoveryTaskId` pointing to the task that earned it back.

**When to use:** Any day that was missed but recovered via earn-back mechanic.

**Example:**
```typescript
// In src/domain/types.ts -- extend existing StreakRecord
export interface StreakRecord {
  date: string // YYYY-MM-DD format, primary key
  completedTaskIds: string[]
  freezeUsed: boolean
  freezeCountRemaining: number
  createdAt: Date
  // NEW: Earn-back recovery fields
  recoveredFrom: boolean       // true if this gap day was recovered via earn-back
  recoveryTaskId: string | null // taskId of the extra task that triggered recovery
}
```

### Pattern 2: Earn-Back Detection and Window

**What:** After `checkAndApplyFreezes` runs, check if the streak is broken (gap > 2 days). If so, determine if the break was within 24 hours and a recovery opportunity exists.

**When to use:** On app load (AppShell mount) and after each task completion.

**Example:**
```typescript
// In src/hooks/useStreaks.ts or src/domain/streaks.ts
const EARN_BACK_WINDOW_HOURS = 24

interface EarnBackOpportunity {
  available: boolean
  brokenStreakLength: number   // how long the streak was before it broke
  gapDay: string               // the first missed day (YYYY-MM-DD)
  deadline: Date               // when the 24h window expires
}

function detectEarnBackOpportunity(now: Date = new Date()): EarnBackOpportunity | null {
  // 1. Get all streakRecords ordered by date desc
  // 2. Walk backward: count consecutive days (streak length before break)
  // 3. Find the gap -- first day with no record and no freeze
  // 4. If gap exists and gap < EARN_BACK_WINDOW_HOURS from now, opportunity is available
  // 5. Return the opportunity details (or null if no opportunity)
}
```

### Pattern 3: Calendar Grid Generation with date-fns

**What:** Generate a 6-row x 7-column grid for any given month, using date-fns utilities.

**When to use:** StreakCalendar component rendering.

**Example:**
```typescript
// In src/hooks/useStreaks.ts
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, getDay, format, isSameMonth, isToday
} from 'date-fns'

type CalendarDayState = 'active' | 'frozen' | 'recovered' | 'missed' | 'empty' | 'future'

interface StreakCalendarDay {
  date: Date
  dayKey: string
  isCurrentMonth: boolean
  isToday: boolean
  state: CalendarDayState
  taskCount: number
}

function useStreakCalendarMonth(year: number, month: number): StreakCalendarDay[] {
  // Uses useLiveQuery to reactively fetch streakRecords for the visible month range
  // Then maps each day in the grid to its state
}
```
Source: date-fns calendar pattern [VERIFIED: date-fns documentation, GitHub Gist calendar matrix]

### Pattern 4: Dexie Schema Version Upgrade

**What:** Bump Dexie schema from v4 to v5, adding default values for new fields on existing records.

**When to use:** Once, when deploying Phase 9.

**Example:**
```typescript
// In src/db/index.ts
this.version(4).stores({
  dailySummaries: 'date, computedAt',
  weeklySummaries: 'weekStart, weekEnd, computedAt',
})

// NEW: Version 5 -- add recovery fields to streakRecords
this.version(5).stores({
  streakRecords: 'date', // No new indexed fields needed; non-indexed fields just work
}).upgrade(tx => {
  // Backfill default values for existing records
  return tx.table('streakRecords').toCollection().modify(record => {
    if (record.recoveredFrom === undefined) record.recoveredFrom = false
    if (record.recoveryTaskId === undefined) record.recoveryTaskId = null
  })
})
```
Source: [CITED: dexie.org/docs/Version/Version.upgrade()] -- Dexie uses schemaless non-indexed fields by default, so new fields on existing records just need a `.modify()` backfill for defaults.

### Anti-Patterns to Avoid

- **Anti-pattern: Creating a separate RecoveryEvent table.** Why bad: Recovery is a one-to-one relationship with a gap day. A separate table adds join complexity with no benefit. Instead: extend StreakRecord with `recoveredFrom` and `recoveryTaskId`.
- **Anti-pattern: Modifying `computeCurrentStreak` to handle recovery inline.** Why bad: `computeCurrentStreak` is a pure backward walk. Adding recovery logic makes it impure and harder to test. Instead: `detectEarnBackOpportunity` runs separately and creates the recovery record before `computeCurrentStreak` is called.
- **Anti-pattern: Using recovery as a "penalty" mechanic.** Why bad: Anti-anxiety design principle -- never frame anything as a cost or punishment. Instead: "You have a chance to earn back your streak!" not "Complete 2 extra tasks as penalty."
- **Anti-pattern: Making the calendar show failure states prominently.** Why bad: Anti-anxiety design -- calendar should celebrate patterns. Instead: missed days are neutral/empty, active days are highlighted warmly, recovered days show a special positive badge.
- **Anti-pattern: Hardcoding calendar locale strings.** Why bad: The app has Chinese UI text. Instead: Follow existing pattern (hardcoded Chinese strings like MoodCalendar does) or use date-fns locale if i18n is planned.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar grid generation | Custom date math for month grid | date-fns `startOfMonth` + `endOfMonth` + `startOfWeek` + `endOfWeek` + `eachDayOfInterval` | Edge cases: leap years, month boundaries, varying week start days |
| Dexie schema migration | Manual IndexedDB objectStore manipulation | `this.version(N).stores().upgrade()` | Dexie handles upgrade paths from any prior version automatically |
| Reactive data binding | Manual re-fetch after mutation | `useLiveQuery` from `dexie-react-hooks` | Already used everywhere; auto-updates when Dexie tables change |
| Date normalization | Custom YYYY-MM-DD formatting | `toDayKey()` from `src/lib/date-utils.ts` | Already handles `startOfDay` + `format` consistently |
| Streak milestone detection | Inline check in recovery logic | `getStreakMilestone()` from `src/domain/streaks.ts` | Already handles 7/14/30 day checks |

**Key insight:** The existing infrastructure is well-suited for extension. The period-record model (one row per day) naturally accommodates recovery metadata. The `useLiveQuery` pattern means the calendar auto-updates when records change. No fundamental architectural changes needed.

## Common Pitfalls

### Pitfall 1: Earn-Back vs Freeze Ordering Confusion

**What goes wrong:** Earn-back and freeze both "fill a gap day." If the logic doesn't clearly define priority, a user with remaining freezes might see a recovery prompt unnecessarily.
**Why it happens:** Freeze applies automatically on app load; earn-back is a user action. They operate at different times.
**How to avoid:** Freeze ALWAYS takes priority. `checkAndApplyFreezes` runs first on mount. `detectEarnBackOpportunity` only activates when freezes are exhausted (gap > 2 days). The hierarchy is: (1) active day, (2) frozen day, (3) recovered day, (4) broken streak.
**Warning signs:** Recovery prompt showing when user still has freezes remaining.

### Pitfall 2: 24-Hour Window Starting Point

**What goes wrong:** Ambiguity about when the 24-hour window starts. From the first missed day? From when the user opens the app? From midnight?
**Why it happens:** The requirement says "within 24h" but doesn't specify the anchor point.
**How to avoid:** Anchor the window to the END of the first missed day (midnight of the missed day + 24h). This is the most generous and least anxiety-inducing interpretation. Example: user missed Tuesday, window expires end of Wednesday. This gives the user the full next day to recover.
**Warning signs:** Window expiring mid-day while user is actively using the app.

### Pitfall 3: Calendar Date Range Query Edge Case

**What goes wrong:** The calendar grid shows days from adjacent months (to fill complete weeks). If the query only fetches records for the target month, days from the previous/next month show as "missed" when they might have records.
**Why it happens:** `eachDayOfInterval` generates days outside the target month to complete the grid rows.
**How to avoid:** Query streakRecords for the full visible range (start of first week to end of last week), not just the month itself. Filter `isCurrentMonth` for visual styling only, not for data queries.
**Warning signs:** Days from previous/next month showing as "missed" in the calendar grid.

### Pitfall 4: Dexie Version Upgrade Must Be Sequential

**What goes wrong:** Removing or reordering existing `version(N)` declarations breaks the upgrade path for users on older schemas.
**Why it happens:** Dexie requires ALL version declarations to remain in code for the upgrade chain to work.
**How to avoid:** Only ADD `version(5)` after existing `version(4)`. Never modify or remove earlier version declarations.
**Warning signs:** Users with v1-v3 databases getting errors on upgrade.

### Pitfall 5: Recovery Record Not Counted as Streak Day

**What goes wrong:** `computeCurrentStreak` walks backward looking for any record. A recovery record for the gap day would naturally be counted. But if the recovery record is created incorrectly (wrong date key), the streak won't connect.
**Why it happens:** The gap day's date key must be computed the same way as `toDayKey()` computes it.
**How to avoid:** Always use `toDayKey()` for date computation. The recovery record's `date` field must exactly match what `computeCurrentStreak` expects.
**Warning signs:** Streak length not increasing after earn-back recovery.

### Pitfall 6: Multiple Earn-Back Attempts for Same Gap

**What goes wrong:** User triggers earn-back twice for the same gap day, creating duplicate records or awarding points twice.
**Why it happens:** No guard against re-triggering recovery for an already-recovered day.
**How to avoid:** Check if the gap day already has a recovery record before showing the prompt. Use `recoveredFrom === true` as the guard.
**Warning signs:** Extra point ledger entries, duplicate streak records.

## Code Examples

### Earn-Back Opportunity Detection

```typescript
// Source: derived from existing computeCurrentStreak and checkAndApplyFreezes patterns
import { db } from '../db'
import { toDayKey } from '../lib/date-utils'
import { differenceInHours, differenceInCalendarDays } from 'date-fns'

const EARN_BACK_WINDOW_HOURS = 24

export interface EarnBackOpportunity {
  available: boolean
  previousStreakLength: number
  gapDay: string
  deadline: Date
}

export async function detectEarnBackOpportunity(
  now: Date = new Date()
): Promise<EarnBackOpportunity | null> {
  const todayKey = toDayKey(now)
  const todayRecord = await db.streakRecords.get(todayKey)

  // If today already has a record (active or recovered), no earn-back needed
  if (todayRecord) return null

  const allRecords = await db.streakRecords.orderBy('date').reverse().toArray()
  if (allRecords.length === 0) return null

  // Find the most recent record and compute gap
  const lastRecord = allRecords[0]
  const gap = differenceInCalendarDays(now, new Date(lastRecord.date + 'T12:00:00'))

  // Gap of exactly 1 day = yesterday was missed, today is still in progress
  // Gap > 2 = freezes should have been applied; check if they were exhausted
  if (gap <= 1) return null

  // Count how many gap days have freeze records
  let frozenDays = 0
  for (let i = 1; i < gap; i++) {
    const gapDayKey = toDayKey(new Date(new Date(lastRecord.date + 'T12:00:00').getTime() + i * 86400000))
    if (gapDayKey === todayKey) continue // today is still in progress
    const gapRecord = await db.streakRecords.get(gapDayKey)
    if (gapRecord?.freezeUsed) frozenDays++
    else if (gapRecord?.recoveredFrom) { /* already recovered */ }
  }

  // The first unfrozen, unrecovered gap day is the break point
  // Check if we're within the earn-back window of that day
  // For simplicity: if gap <= 2 (1 gap day after freeze) and today hasn't been filled,
  // the user can earn back by completing a task today
  const firstUnfrozenGap = gap - frozenDays - 1 // days that are truly "missed"
  if (firstUnfrozenGap < 1) return null

  // The break happened at the first unfrozen gap day
  const breakDayDate = new Date(new Date(lastRecord.date + 'T12:00:00').getTime() + (frozenDays + 1) * 86400000)
  const hoursSinceBreak = differenceInHours(now, breakDayDate)

  if (hoursSinceBreak > EARN_BACK_WINDOW_HOURS) return null

  // Count previous streak length
  let previousStreakLength = 0
  for (const record of allRecords) {
    if (differenceInCalendarDays(now, new Date(record.date + 'T12:00:00')) <= gap) {
      previousStreakLength++
    } else {
      break
    }
  }

  const deadline = new Date(breakDayDate.getTime() + EARN_BACK_WINDOW_HOURS * 3600000)

  return {
    available: true,
    previousStreakLength,
    gapDay: toDayKey(breakDayDate),
    deadline,
  }
}
```

### Applying Earn-Back Recovery

```typescript
// Source: follows completeTask atomic transaction pattern from useTaskActions.ts
export async function applyEarnBackRecovery(
  recoveryTaskId: string,
  gapDayKey: string,
): Promise<void> {
  const now = new Date()

  await db.transaction('rw', [db.streakRecords, db.pointLedger], async () => {
    // Check if already recovered
    const existing = await db.streakRecords.get(gapDayKey)
    if (existing?.recoveredFrom) return // guard against double recovery

    // Create or update the gap day record with recovery data
    await db.streakRecords.put({
      date: gapDayKey,
      completedTaskIds: existing ? [...existing.completedTaskIds, recoveryTaskId] : [recoveryTaskId],
      freezeUsed: existing?.freezeUsed ?? false,
      freezeCountRemaining: existing?.freezeCountRemaining ?? 0,
      createdAt: existing?.createdAt ?? now,
      recoveredFrom: true,
      recoveryTaskId,
    })
  })
}
```

### Streak Calendar Hook

```typescript
// Source: follows useLiveQuery pattern from existing hooks, date-fns calendar pattern
import { useLiveQuery } from 'dexie-react-hooks'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format
} from 'date-fns'

export type StreakDayState = 'active' | 'frozen' | 'recovered' | 'missed' | 'empty' | 'future'

export interface StreakCalendarDay {
  date: Date
  dayKey: string
  isCurrentMonth: boolean
  isToday: boolean
  state: StreakDayState
  taskCount: number
}

export function useStreakCalendarMonth(year: number, month: number): StreakCalendarDay[] {
  const monthDate = new Date(year, month, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const startKey = format(calendarStart, 'yyyy-MM-dd')
  const endKey = format(calendarEnd, 'yyyy-MM-dd')

  const records = useLiveQuery(
    async () => {
      return db.streakRecords
        .where('date')
        .between(startKey, endKey, true, true)
        .toArray()
    },
    [startKey, endKey]
  )

  if (!records) return []

  const recordMap = new Map(records.map(r => [r.date, r]))
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const now = new Date()

  return days.map(date => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const record = recordMap.get(dayKey)
    const isFuture = date > now && !isToday(date)

    let state: StreakDayState = 'empty'
    let taskCount = 0

    if (isFuture) {
      state = 'future'
    } else if (record?.recoveredFrom) {
      state = 'recovered'
      taskCount = record.completedTaskIds.length
    } else if (record?.freezeUsed) {
      state = 'frozen'
    } else if (record && record.completedTaskIds.length > 0) {
      state = 'active'
      taskCount = record.completedTaskIds.length
    } else if (!isFuture && isSameMonth(date, monthDate)) {
      state = 'missed'
    }

    return {
      date,
      dayKey,
      isCurrentMonth: isSameMonth(date, monthDate),
      isToday: isToday(date),
      state,
      taskCount,
    }
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Streak counter (single number) | Period records (one row per day) | Phase 2 (2026-04-29) | Earn-back and calendar both leverage the period record model |
| Freeze as penalty mitigation | Freeze as built-in grace | Phase 2 design | Earn-back extends the "grace" philosophy with a user-actionable recovery |
| Dexie v1 schema | Dexie v4 schema (4 versions) | Phase 1-5 | Phase 9 bumps to v5; all prior version declarations must be preserved |

**Deprecated/outdated:**
- Nothing in current streak infrastructure is deprecated for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Earn-back window starts from end of first missed day (most generous interpretation) | Architecture Patterns / Pitfall 2 | If user expects window from "when they last opened the app," the window might feel shorter or longer than expected |
| A2 | Only 1 extra task is needed for earn-back (not variable based on streak length) | Architecture Patterns | If the design calls for 2+ tasks for longer streaks, the recovery logic becomes more complex |
| A3 | Recovery does NOT award additional points -- it only restores streak continuity | Architecture Patterns | If recovery should also give a point bonus, additional point ledger logic is needed |
| A4 | Calendar uses Monday as week start (matching MoodCalendar convention) | Code Examples | If the app targets audiences that expect Sunday start, `{ weekStartsOn: 0 }` would be needed |
| A5 | Earn-back opportunity is available once per break (not once per gap day) | Architecture Patterns | If multiple gap days can each be independently recovered, the UI and logic become more complex |
| A6 | The streak calendar page will be a new route/page in the existing navigation system | Architecture Patterns | If it should be embedded within the existing data/summary page, routing changes are different |

## Open Questions

1. **Earn-back task count: 1 or variable?**
   - What we know: STRK-06 says "complete extra task" (singular)
   - What's unclear: Does "extra" mean "1 more than usual" or "an additional task beyond what was already done today"?
   - Recommendation: Implement as "complete at least 1 task on the day after the break." This is the simplest and most generous interpretation.

2. **Should the calendar be a new page or a tab within an existing page?**
   - What we know: The app has 5 bottom nav tabs (home, tasks, rewards, mood, data). Adding a 6th would break mobile layout.
   - What's unclear: Whether the calendar should live inside the existing "data" page as a sub-tab, or be accessible from the StreakDisplay component in the topbar.
   - Recommendation: Add as a sub-section of the data/summary page, or make StreakDisplay clickable to expand a calendar modal/drawer. This avoids mobile nav issues.

3. **What happens to the recovery opportunity when the user completes a regular task?**
   - What we know: `completeTask` already creates a streak record for today. If today was the gap day, that would naturally "fill" the gap.
   - What's unclear: Whether the user needs to explicitly "choose" recovery, or if any task completion during the window auto-recovers.
   - Recommendation: Auto-recovery on any task completion during the window. Simpler UX, less cognitive load. The user just needs to do what they normally do.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Dexie | Schema upgrade, queries | Available | 4.4.2 | -- |
| date-fns | Calendar grid generation | Available | 4.1.0 | -- |
| vitest | Tests | Available | 4.1.5 | -- |
| IndexedDB | Data storage | Available (browser) | -- | -- |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/domain/__tests__/streaks.test.ts src/hooks/__tests__/useStreaks.test.ts -t "earn" -t "recovery" -t "calendar"` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRK-06 | detectEarnBackOpportunity returns null when streak is active | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "detectEarnBack"` | Wave 0 |
| STRK-06 | detectEarnBackOpportunity returns opportunity when gap exists within 24h | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "detectEarnBack"` | Wave 0 |
| STRK-06 | detectEarnBackOpportunity returns null after 24h window expires | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "detectEarnBack"` | Wave 0 |
| STRK-06 | detectEarnBackOpportunity returns null when freezes still available | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "detectEarnBack"` | Wave 0 |
| STRK-06 | applyEarnBackRecovery creates record with recoveredFrom=true | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "applyEarnBack"` | Wave 0 |
| STRK-06 | applyEarnBackRecovery is idempotent (no double recovery) | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "applyEarnBack"` | Wave 0 |
| STRK-06 | computeCurrentStreak counts recovered days as part of streak | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "computeCurrentStreak"` | Existing |
| STRK-06 | Earn-back toast uses positive messaging (no "broke", "lost", "failed") | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "messaging"` | Wave 0 |
| STRK-07 | useStreakCalendarMonth returns correct grid (42 days for full month) | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "calendar"` | Wave 0 |
| STRK-07 | Calendar day states: active, frozen, recovered, missed, future | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "calendar"` | Wave 0 |
| STRK-07 | Calendar handles month boundaries correctly | unit | `npx vitest run src/hooks/__tests__/useStreaks.test.ts -t "calendar"` | Wave 0 |
| STRK-07 | Dexie v5 upgrade backfills recovery fields on existing records | unit | `npx vitest run src/db/__tests__/database.test.ts -t "version 5"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/domain/__tests__/streaks.test.ts src/hooks/__tests__/useStreaks.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Extend `src/hooks/__tests__/useStreaks.test.ts` with detectEarnBack, applyEarnBack, calendar test suites
- [ ] Extend `src/db/__tests__/database.test.ts` with v5 schema migration test
- [ ] No framework install needed -- vitest already configured

## Security Domain

> Security enforcement is enabled in config. This phase touches data persistence and schema migration.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth system (local-only app) |
| V3 Session Management | no | No sessions (local-only app) |
| V4 Access Control | no | No multi-user access |
| V5 Input Validation | yes | Zod schemas for recovery-related inputs (already pattern established) |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for React + Dexie (Local-First)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IndexedDB data manipulation via DevTools | Tampering | Acceptable for local-only app; no sensitive data at stake |
| Schema migration failure | Denial of Service | Dexie handles migration atomically; test upgrade paths |
| XSS via calendar day rendering | Tampering | Sanitize any user-generated content in calendar cells; use React's built-in escaping |

## Project Constraints (from CLAUDE.md)

- **OpenWolf protocol:** Check `.wolf/anatomy.md` before reading files. Update `.wolf/memory.md` and `.wolf/anatomy.md` after file changes.
- **Anti-anxiety design:** No punitive messaging anywhere. All streak messaging must be positive framing.
- **Immutability:** Always create new objects, never mutate. Use spread operator for updates.
- **File organization:** Many small files > few large files. 200-400 lines typical, 800 max.
- **Input validation:** Zod for all schema validation.
- **No console.log** in production code.
- **Testing:** 80% minimum coverage. TDD workflow.

## Sources

### Primary (HIGH confidence)
- Project source code: `src/domain/types.ts`, `src/hooks/useStreaks.ts`, `src/hooks/useTaskActions.ts`, `src/db/index.ts`, `src/components/gamification/StreakDisplay.tsx`, `src/components/mood/MoodCalendar.tsx`, `src/components/layout/AppShell.tsx`
- Existing test suites: `src/hooks/__tests__/useStreaks.test.ts`, `src/domain/__tests__/streaks.test.ts`

### Secondary (MEDIUM confidence)
- [Dexie.js Version.upgrade() docs](https://dexie.org/docs/Version/Version.upgrade()) -- schema migration pattern [CITED]
- [date-fns calendar matrix pattern](https://gist.github.com/miljan-aleksic/bd70452a3f0cd6a11545db9f6ab57df6) -- `startOfMonth` + `eachDayOfInterval` approach [CITED]
- [Stack Overflow: Dexie extend existing table with new fields](https://stackoverflow.com/questions/48525343/dexie-extend-existing-table-with-new-fields) -- confirmed non-indexed fields don't need schema string changes [CITED]

### Tertiary (LOW confidence)
- None -- all findings verified against project source or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already in project, versions verified against npm registry
- Architecture: HIGH -- extends existing patterns (period records, useLiveQuery, completeTask transaction)
- Pitfalls: HIGH -- derived from direct analysis of existing code and its edge cases

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (stable domain, no fast-moving dependencies)

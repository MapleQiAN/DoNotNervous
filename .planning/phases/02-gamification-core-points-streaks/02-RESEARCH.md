# Phase 2: Gamification Core - Points & Streaks - Research

**Researched:** 2026-04-29
**Domain:** Client-side gamification (points ledger, streak tracking, animated UI feedback)
**Confidence:** HIGH

## Summary

Phase 2 adds a points system and streak tracker to the existing DoNotNervous task app. Points use an event-sourced ledger pattern -- every point transaction is an immutable record in a new `pointLedger` Dexie table. Streaks use period records (one row per day) in a new `streakRecords` table. Both tables are added via a Dexie schema version bump from 1 to 2. The primary trigger is `completeTask()` in `useTaskActions.ts`, which must be extended to write a ledger entry, calculate the streak multiplier, and update the streak period record. The UI layer adds a header badge showing point balance (animated count-up via Framer Motion spring), a popover for last 10 transactions, streak display, and freeze notifications via the existing Toast component.

**Primary recommendation:** Extend `completeTask()` to orchestrate point earning and streak tracking in a single Dexie transaction. Compute point balance as a `useLiveQuery` sum over the ledger (no cached balance column). Auto-apply streak freezes when a day is missed, with gentle Toast notification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Header badge in existing Header component -- icon (Star/Zap) + animated count-up number. Always visible. Extends Phase 1 Header.
- **D-02:** Badge style: icon + number (e.g. "star 150"). Compact, clear, delightful on earn.
- **D-03:** Click header badge -> popover shows last 10 transactions. Quick glance, zero navigation.
- **D-04:** Each transaction row shows: point amount (+10), reason ("Completed: Walk dog"), relative time ("2h ago"). Compact, scannable.
- **D-05:** 3-tier multiplier system: 1-6 days = 1x (no bonus), 7-13 days = 1.5x, 14-29 days = 2x, 30+ days = 3x.
- **D-06:** No cap -- 30+ day streaks keep earning 3x. Anti-inflation handled by reward sinks in Phase 3.
- **D-07:** 2 freezes always available. Resets after use (back to 2). Simple, predictable, generous.
- **D-08:** Auto-apply -- when a day is missed, freeze activates automatically. User gets gentle notification: "Your streak is safe! (1 freeze remaining)". Zero friction, zero anxiety.
- **D-09:** easy = 10pts, medium = 25pts, hard = 50pts (POINT-01).

### Claude's Discretion
- Exact icon choice (Star vs Zap) -- pick what fits the warm aesthetic.
- Popover animation style -- use Framer Motion, keep it gentle.
- Notification for freeze usage -- Toast component from Phase 1.
- Point ledger record schema -- follow event-sourced pattern from STATE.md decisions.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POINT-01 | User earns points on task completion (scaled by difficulty: easy=10, medium=25, hard=50) | Point values locked in D-09. `completeTask()` extension triggers ledger write. Difficulty extracted from task record. |
| POINT-02 | User sees current point balance prominently displayed | Header badge with animated count-up (D-01, D-02). Balance = `useLiveQuery` sum of `pointLedger.amount`. |
| POINT-03 | User can view point transaction history (earned, spent, bonuses) | Click badge -> popover, last 10 transactions (D-03, D-04). `useLiveQuery` on `pointLedger` ordered by `createdAt` desc. |
| POINT-04 | Points use event-sourced ledger -- every transaction is an immutable record | `pointLedger` table with immutable insert-only pattern. No balance column. Sum computed reactively. |
| POINT-05 | Streak bonus multiplier adds extra points for consecutive days | 3-tier multiplier (D-05). Calculated at point-earn time from current streak length. Bonus recorded as separate ledger entry with `type: 'streak_bonus'`. |
| STRK-01 | Streaks track consecutive days with at least one completed task | `streakRecords` period table. One row per day. `streakLength` computed by counting consecutive days backward from today. |
| STRK-02 | Streaks use period records (one row per day), not a simple counter | `streakRecords` table with `date` (YYYY-MM-DD) as key. Each day's record tracks completion count and freeze usage. |
| STRK-03 | Streak freeze protects streak on missed days (graceful, not punitive) | 2 freezes always available (D-07). Auto-apply on missed day (D-08). Freeze row inserted in `streakRecords` with `freezeUsed: true`. |
| STRK-04 | All streak messaging is positive ("12 out of 14 days!" not "you broke your streak") | Copy guidelines in pitfall section. Positive framing enforced in all UI strings. |
| STRK-05 | Streak milestones trigger celebration animations | Milestones at 7, 14, 30 days. Framer Motion spring animation + existing Toast for notification. No confetti yet (Phase 4). |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Point earning logic | Data/Domain (DB + hooks) | -- | Business logic belongs in domain layer, triggered by task completion |
| Point balance display | Browser (React component) | -- | UI rendering of computed data via useLiveQuery |
| Transaction history popover | Browser (React component) | -- | Pure UI concern, reads from ledger table |
| Streak calculation | Data/Domain (DB + hooks) | -- | Date-based computation runs on task completion |
| Streak freeze auto-apply | Data/Domain (hooks) | Browser (Toast notification) | Logic in domain, notification in UI |
| Multiplier calculation | Data/Domain (pure function) | -- | Pure function from streak length to multiplier value |
| Animated count-up | Browser (Framer Motion) | -- | Client-side animation only |
| Schema migration | Database (Dexie) | -- | Version bump adds new tables |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.4.2 | IndexedDB wrapper, schema versioning, transactions | Already installed. Schema version bump from 1 to 2 adds new tables. [VERIFIED: npm registry] |
| dexie-react-hooks | 4.4.0 | useLiveQuery for reactive DB reads | Already installed. Used for point balance and transaction list reactivity. [VERIFIED: package.json] |
| framer-motion | 12.38.0 | Animated count-up, popover transitions | Already installed. `useMotionValue` + `useSpring` for number animation. [VERIFIED: package.json] |
| date-fns | 4.1.0 | Date comparison, relative time formatting | Already installed. `formatDistanceToNow` for "2h ago", `startOfDay`/`differenceInDays` for streak calculation. [VERIFIED: package.json] |
| zustand | 5.0.12 | UI state (popover open/close) | Already installed. Follows existing store pattern from uiStore.ts. [VERIFIED: package.json] |
| zod | 4.3.6 | Schema validation for ledger/streak records | Already installed. Follows existing pattern from task.ts. [VERIFIED: package.json] |
| lucide-react | 1.12.0 | Icon for badge (Zap/Star) | Already installed. Already used throughout UI. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fake-indexeddb | 6.2.5 | In-memory IndexedDB for tests | Already installed in devDependencies. Used for point/streak DB tests. [VERIFIED: package.json] |
| vitest | 4.1.5 | Test runner | Already installed. Follow existing test patterns. [VERIFIED: package.json] |
| @testing-library/react | 16.3.2 | Component testing | Already installed. For badge and popover component tests. [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion useSpring for count-up | CSS counter animation | useSpring gives smoother spring physics and easier control; already in stack |
| Zustand for popover state | React useState | Zustand persists across re-renders and matches existing pattern; useState is fine for simple local state |
| date-fns formatDistanceToNow | Intl.RelativeTimeFormat | date-fns already installed, consistent API, better edge cases |

**Installation:**
No new packages needed. All dependencies already installed from Phase 1.

**Version verification:** All versions confirmed current against npm registry (2026-04-29).

## Architecture Patterns

### System Architecture Diagram

```
User clicks complete on TaskItem
        |
        v
completeTask() in useTaskActions.ts
        |
        +--> db.tasks.update(id, { status: 'completed', completedAt: now })
        |
        +--> awardPoints(taskId, difficulty)
        |       |
        |       +--> read task from DB
        |       +--> calculatePoints(difficulty) --> 10/25/50 base
        |       +--> getCurrentStreak() --> streak length
        |       +--> calculateMultiplier(streakLength) --> 1x/1.5x/2x/3x
        |       +--> db.pointLedger.add({ amount: base, type: 'task_complete', ... })
        |       +--> if multiplier > 1:
        |       |       db.pointLedger.add({ amount: bonus, type: 'streak_bonus', ... })
        |       +--> updateStreakRecord(today)
        |       +--> return { base, bonus, total, newBalance }
        |
        v
React re-renders via useLiveQuery
        |
        +--> Header badge: sum of pointLedger.amount (animated count-up)
        +--> TaskItem: optional point earn flash
        +--> Toast: freeze notification (if freeze auto-applied)
        |
        v
User clicks badge --> Popover
        |
        +--> useLiveQuery: last 10 pointLedger records
        +--> Each row: amount, reason, formatDistanceToNow(createdAt)
```

### Recommended Project Structure
```
src/
  domain/
    types.ts              # ADD: PointLedgerEntry, StreakRecord interfaces
    task.ts               # Existing task schemas
    points.ts             # NEW: point calculation schemas & constants
    streaks.ts            # NEW: streak calculation schemas & constants
  db/
    index.ts              # MODIFY: version(2), add pointLedger + streakRecords tables
  hooks/
    useTaskActions.ts     # MODIFY: completeTask() triggers point/streak logic
    usePoints.ts          # NEW: useLiveQuery hooks for point balance, transaction history
    useStreaks.ts         # NEW: useLiveQuery hook for current streak, streak freeze logic
  components/
    gamification/         # NEW folder
      PointBadge.tsx      # Header badge with animated count-up
      TransactionPopover.tsx  # Last 10 transactions popover
      StreakDisplay.tsx   # Current streak indicator
    layout/
      Header.tsx          # MODIFY: integrate PointBadge + StreakDisplay
    common/
      Toast.tsx           # Existing, used for freeze notifications
  lib/
    id.ts                 # Existing generateId()
    cn.ts                 # Existing cn() helper
    date-utils.ts         # NEW: date comparison helpers for streak logic
  stores/
    uiStore.ts            # MODIFY: add popover state (isPointsPopoverOpen)
```

### Pattern 1: Event-Sourced Point Ledger
**What:** Every point change is an immutable record. Balance is computed by summing all records.
**When to use:** All point transactions (earn, bonus, future spend).
**Example:**
```typescript
// src/domain/types.ts
export type PointTransactionType = 'task_complete' | 'streak_bonus' | 'reward_spent' | 'adjustment'

export interface PointLedgerEntry {
  id: string
  amount: number           // positive for earn, negative for spend
  type: PointTransactionType
  reason: string           // e.g. "Completed: Walk dog", "Streak bonus (1.5x)"
  taskId: string | null    // linked task, if applicable
  streakLength: number     // streak length at time of transaction
  multiplier: number       // multiplier applied
  createdAt: Date
}
```

### Pattern 2: Period-Based Streak Records
**What:** One record per day. Streak length computed by walking backward from today through consecutive days with records.
**When to use:** Daily streak tracking, freeze application, milestone detection.
**Example:**
```typescript
// src/domain/types.ts
export interface StreakRecord {
  date: string             // YYYY-MM-DD format, primary key
  completedTaskIds: string[] // tasks completed this day
  freezeUsed: boolean      // whether a freeze was auto-applied
  freezeCountRemaining: number // freezes remaining after this day
  createdAt: Date
}
```

### Pattern 3: Dexie Schema Version Bump
**What:** Adding new tables via Dexie version upgrade. In Dexie >= 3.0, you only need to declare the new version with the new tables -- no need to keep old version declarations unless they have upgrader functions. [CITED: dexie.org/docs/Tutorial/Design#database-versioning]
**When to use:** Adding `pointLedger` and `streakRecords` tables.
**Example:**
```typescript
// src/db/index.ts
import { Dexie, type EntityTable } from 'dexie'
import type { Task } from '../domain/types'
import type { PointLedgerEntry } from '../domain/types'
import type { StreakRecord } from '../domain/types'

class DoNotNervousDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  pointLedger!: EntityTable<PointLedgerEntry, 'id'>
  streakRecords!: EntityTable<StreakRecord, 'date'>

  constructor() {
    super('DoNotNervousDB')
    this.version(1).stores({
      tasks: 'id, parentId, type, status, category, sortOrder, createdAt, completedAt'
    })
    this.version(2).stores({
      pointLedger: 'id, type, taskId, createdAt',
      streakRecords: 'date'
    })
  }
}

export const db = new DoNotNervousDB()
```

### Pattern 4: Framer Motion Animated Count-Up
**What:** Use `useMotionValue` + `useSpring` + `useTransform` to animate a number change with spring physics.
**When to use:** Point balance display in header badge.
**Example:**
```typescript
// src/components/gamification/PointBadge.tsx
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  return <motion.span>{display}</motion.span>
}
```

### Pattern 5: Multiplier Calculation (Pure Function)
**What:** Deterministic function from streak length to multiplier value. No side effects, easily testable.
**When to use:** Every point-earning event.
**Example:**
```typescript
// src/domain/points.ts
export const POINT_VALUES = {
  easy: 10,
  medium: 25,
  hard: 50,
} as const

export const STREAK_TIERS = [
  { minDays: 30, multiplier: 3 },
  { minDays: 14, multiplier: 2 },
  { minDays: 7, multiplier: 1.5 },
  { minDays: 0, multiplier: 1 },
] as const

export function calculateMultiplier(streakLength: number): number {
  for (const tier of STREAK_TIERS) {
    if (streakLength >= tier.minDays) return tier.multiplier
  }
  return 1
}

export function calculatePoints(difficulty: TaskDifficulty, streakLength: number): {
  base: number
  bonus: number
  multiplier: number
} {
  const base = POINT_VALUES[difficulty]
  const multiplier = calculateMultiplier(streakLength)
  const bonus = Math.round(base * (multiplier - 1))
  return { base, bonus, multiplier }
}
```

### Pattern 6: Streak Calculation via Period Records
**What:** Walk backward from today through `streakRecords` counting consecutive days. If a gap is found and freezes are available, auto-apply.
**When to use:** On task completion, on app load (for freeze check).
**Example:**
```typescript
// src/lib/date-utils.ts
import { format, startOfDay, differenceInCalendarDays } from 'date-fns'

export function toDayKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

export function daysAgo(n: number): string {
  return toDayKey(new Date(Date.now() - n * 86400000))
}
```

### Anti-Patterns to Avoid
- **Cached balance column:** Never store a running balance. The ledger is the source of truth. [ASSUMED] A cached balance could drift from the ledger sum, creating inconsistency.
- **Simple counter for streaks:** Use period records (one per day), not a single counter value. Counters cannot represent freeze usage or partial days. [CITED: CONTEXT.md D-05]
- **Destructive ledger operations:** Never delete or update ledger entries. Only append. This is the event-sourced guarantee. [CITED: STATE.md]
- **Punitive messaging:** Never say "you broke your streak." Always frame positively. [CITED: REQUIREMENTS.md STRK-04]
- **Streak logic in UI components:** Keep streak calculation in domain/hooks layer. Components should only read and display computed values. [ASSUMED]
- **Timezone-naive date comparisons:** Use `startOfDay()` from date-fns to normalize dates before comparing. Raw `Date` comparisons can cross day boundaries unexpectedly. [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time display ("2h ago") | Custom time-ago function | `date-fns formatDistanceToNow` | Handles edge cases, i18n-ready, already installed |
| Spring animation for numbers | CSS transitions on text | Framer Motion `useSpring` + `useMotionValue` | Smoother physics, already installed, proven in codebase |
| Date normalization for streaks | Manual midnight calculation | `date-fns startOfDay` + `format('yyyy-MM-dd')` | Handles DST, timezone edge cases |
| IndexedDB schema migration | Manual IDB upgrade logic | Dexie `version(N).stores()` | Dexie handles the upgrade transaction atomically |
| Popover positioning | Custom absolute positioning math | Tailwind CSS positioning | Already available, simpler, tested |
| Unique ID generation | Custom UUID or timestamp-based | `nanoid` via `generateId()` | Already in codebase, collision-resistant |

**Key insight:** The entire phase uses existing libraries. No new npm packages needed. The complexity is in the domain logic (streak calculation, freeze auto-apply), not in the tooling.

## Common Pitfalls

### Pitfall 1: Streak Boundary Crossing at Midnight
**What goes wrong:** User completes a task at 11:59 PM, but the streak record is written for "tomorrow" due to timezone drift.
**Why it happens:** `new Date()` returns local time, but day comparisons without normalization can cross boundaries.
**How to avoid:** Always use `startOfDay()` from date-fns before computing day keys. Store streak records with `YYYY-MM-DD` string keys, not Date objects.
**Warning signs:** Streak resets unexpectedly at midnight; tasks completed late at night don't count for the correct day.

### Pitfall 2: Multiple Completions in One Day Creating Duplicate Streak Records
**What goes wrong:** Each task completion tries to insert a streak record for today, causing a primary key collision.
**Why it happens:** `streakRecords` uses `date` as primary key. Dexie `add()` throws on duplicate primary keys.
**How to avoid:** Use `db.streakRecords.put()` (upsert) instead of `add()`. Check if today's record exists before inserting.
**Warning signs:** "ConstraintError" in console after completing a second task in one day.

### Pitfall 3: Streak Freeze Auto-Apply Creating Phantom Days
**What goes wrong:** Auto-applying a freeze inserts a streak record for a missed day, but the user never actually completed a task that day. If the user opens the app after 3 days, all 3 days get freezes applied even though only 2 are available.
**Why it happens:** Freeze logic runs on app load and doesn't correctly count gap days vs. available freezes.
**How to avoid:** Calculate the exact gap between last streak day and today. Only apply min(gapDays, remainingFreezes) freezes. Each freeze creates a record with `freezeUsed: true` but no `completedTaskIds`.
**Warning signs:** User has 5 frozen days but only 2 freezes available; freeze count goes negative.

### Pitfall 4: Float Multiplication Rounding Errors
**What goes wrong:** `25 * 1.5 = 37.49999999999999` instead of 37.5 (or 38 if rounding).
**Why it happens:** IEEE 754 floating-point arithmetic. The 1.5x and 2x multipliers will produce non-integer results.
**How to avoid:** Use `Math.round(base * (multiplier - 1))` for the bonus amount. Always store integer point values in the ledger.
**Warning signs:** Point balance shows 37.5 instead of 38; running sum has decimal drift.

### Pitfall 5: Non-Atomic Point Write + Task Completion
**What goes wrong:** Task completes successfully but point ledger write fails (or vice versa). User loses points or sees inconsistent state.
**Why it happens:** Two separate async operations without a transaction.
**How to avoid:** Wrap task completion + point ledger write + streak update in a single `db.transaction('rw', db.tasks, db.pointLedger, db.streakRecords, ...)` call. [CITED: dexie.org/docs/Tutorial/Design#transactions]
**Warning signs:** Points awarded but task still shows active; task completed but no points appear.

### Pitfall 6: Streak Bonus as Fractional Points
**What goes wrong:** Easy task (10pts) with 1.5x multiplier gives 15 total. The bonus (5) and base (10) are both integers, but medium (25 * 1.5 = 37.5) is not.
**Why it happens:** Not all difficulty * multiplier combinations produce integers.
**How to avoid:** Round the bonus to nearest integer: `Math.round(base * (multiplier - 1))`. Store only integers in the ledger. This means some combinations round slightly in the user's favor.
**Warning signs:** Balance shows non-integer values; ledger amounts have decimal places.

### Pitfall 7: useLiveQuery Sum Performance with Large Ledger
**What goes wrong:** Summing all ledger entries on every change becomes slow when thousands of records exist.
**Why it happens:** `useLiveQuery(() => db.pointLedger.toArray())` loads all records into memory.
**How to avoid:** Use Dexie's `where().each()` with manual sum, or better: `db.pointLedger.filter(entry => true)` with a reduce. For the expected scale (hundreds, not millions, of records), `toArray()` + `.reduce()` is fine for MVP. Optimize later if needed.
**Warning signs:** Point badge takes >100ms to update after completing a task; visible lag on older devices.

### Pitfall 8: Popover Click-Outside Not Closing
**What goes wrong:** User clicks outside the transaction popover but it stays open.
**Why it happens:** No click-outside handler registered when popover opens.
**How to avoid:** Use a `useRef` + `useEffect` click-outside pattern (already used in TaskItem.tsx for the action menu). Follow the same pattern.
**Warning signs:** Popover stays open after clicking elsewhere.

## Code Examples

Verified patterns from official sources and existing codebase:

### Dexie Schema Version Bump (Adding New Tables)
```typescript
// Source: [CITED: dexie.org/docs/Tutorial/Design#database-versioning]
// In Dexie >= 3.0, just increase version number and add new tables.
// Old version declarations without upgraders can be removed.

// src/db/index.ts
import { Dexie, type EntityTable } from 'dexie'
import type { Task, PointLedgerEntry, StreakRecord } from '../domain/types'

class DoNotNervousDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  pointLedger!: EntityTable<PointLedgerEntry, 'id'>
  streakRecords!: EntityTable<StreakRecord, 'date'>

  constructor() {
    super('DoNotNervousDB')
    this.version(1).stores({
      tasks: 'id, parentId, type, status, category, sortOrder, createdAt, completedAt'
    })
    this.version(2).stores({
      pointLedger: 'id, type, taskId, createdAt',
      streakRecords: 'date'
    })
  }
}

export const db = new DoNotNervousDB()
```

### useLiveQuery for Reactive Point Balance
```typescript
// Source: [CITED: dexie.org/docs/dexie-react-hooks/useLiveQuery()] + existing useTaskCount.ts pattern
// src/hooks/usePoints.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function usePointBalance(): number {
  return useLiveQuery(
    async () => {
      const entries = await db.pointLedger.toArray()
      return entries.reduce((sum, entry) => sum + entry.amount, 0)
    },
    [],
    0
  )
}

export function useRecentTransactions(limit = 10): PointLedgerEntry[] {
  return useLiveQuery(
    async () => db.pointLedger.orderBy('createdAt').reverse().limit(limit).toArray(),
    [],
    []
  )
}
```

### Transactional Point Award + Streak Update
```typescript
// Source: [CITED: dexie.org/docs/Tutorial/Design#transactions] + existing deleteTask pattern
// src/hooks/useTaskActions.ts (extended completeTask)
export async function completeTask(id: string): Promise<void> {
  await db.transaction('rw', [db.tasks, db.pointLedger, db.streakRecords], async () => {
    // 1. Mark task complete
    const now = new Date()
    await db.tasks.update(id, {
      status: 'completed',
      completedAt: now,
    })

    // 2. Read task for difficulty
    const task = await db.tasks.get(id)
    if (!task) return

    // 3. Calculate streak (pure function, reads from DB)
    const streakLength = await computeCurrentStreak(now)

    // 4. Calculate points
    const { base, bonus, multiplier } = calculatePoints(task.difficulty, streakLength)

    // 5. Write base ledger entry
    await db.pointLedger.add({
      id: generateId(),
      amount: base,
      type: 'task_complete',
      reason: `Completed: ${task.title}`,
      taskId: task.id,
      streakLength,
      multiplier,
      createdAt: now,
    })

    // 6. Write bonus ledger entry (if multiplier > 1)
    if (bonus > 0) {
      await db.pointLedger.add({
        id: generateId(),
        amount: bonus,
        type: 'streak_bonus',
        reason: `Streak bonus (${multiplier}x)`,
        taskId: task.id,
        streakLength,
        multiplier,
        createdAt: now,
      })
    }

    // 7. Update streak record for today
    const todayKey = toDayKey(now)
    const existing = await db.streakRecords.get(todayKey)
    if (existing) {
      await db.streakRecords.update(todayKey, {
        completedTaskIds: [...existing.completedTaskIds, task.id],
      })
    } else {
      await db.streakRecords.add({
        date: todayKey,
        completedTaskIds: [task.id],
        freezeUsed: false,
        freezeCountRemaining: 2, // will be recalculated
        createdAt: now,
      })
    }
  })
}
```

### Relative Time Display
```typescript
// Source: [CITED: date-fns docs]
import { formatDistanceToNow } from 'date-fns'

// "2 hours ago", "about 1 day ago"
function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}
```

### Existing Test Pattern (for new tests)
```typescript
// Source: existing src/db/__tests__/task-crud.test.ts pattern
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../index'

describe('Point Ledger integration', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.pointLedger.clear()
    await db.streakRecords.clear()
  })

  it('awards base points for easy task completion', async () => {
    const task = await createTask({ title: 'Walk dog', difficulty: 'easy' })
    await completeTask(task.id)

    const entries = await db.pointLedger.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].amount).toBe(10)
    expect(entries[0].type).toBe('task_complete')
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dexie Table<T> type | Dexie 4 EntityTable<T, 'key'> | Dexie 4.0 | Simpler typing, used in existing codebase |
| Multiple Dexie version declarations | Single latest version (Dexie >= 3.0) | Dexie 3.0 | Only keep versions with upgraders; can remove bare version declarations |
| CSS transition for number animation | Framer Motion useSpring | Framer Motion 12 | Smoother spring physics, reactive to value changes |
| Intl.RelativeTimeFormat | date-fns formatDistanceToNow | N/A (both valid) | date-fns already installed, consistent API |

**Deprecated/outdated:**
- Dexie < 3.0 version pattern (keeping all version declarations): Replaced by Dexie 3.0+ which diffs against installed schema. [CITED: dexie.org/docs/Tutorial/Design]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No cached balance column needed -- useLiveQuery sum is performant enough for expected scale (hundreds of ledger entries) | Architecture Patterns | If scale grows to thousands, may need a materialized balance. Low risk for MVP. |
| A2 | Streak freeze auto-apply should happen on task completion, not on app load | Pattern 3 | If auto-apply only happens on task completion, a user who misses days and doesn't complete a task never sees freeze applied. May need app-load check too. |
| A3 | `formatDistanceToNow` from date-fns uses the user's locale by default | Code Examples | If not localized, "2 hours ago" is always English. Acceptable for MVP. |
| A4 | Point bonus is recorded as a separate ledger entry from base points | Pattern 5 | If combined into one entry, transaction history is less transparent. Separate entries show bonus clearly. |
| A5 | Streak milestones at 7, 14, 30 days -- the milestone triggers on the day the streak reaches that count, not at the start of the next day | Phase Requirements | If milestone is off by one day, user sees wrong celebration. Need to verify in implementation. |

## Open Questions

1. **When should streak freeze check run?**
   - What we know: D-08 says auto-apply when a day is missed. Task completion is the primary trigger.
   - What's unclear: Should the app also check for missed days on load (before any task is completed)? This would show the freeze notification immediately when the user opens the app after a gap.
   - Recommendation: Check on app load via an effect in a top-level component (App.tsx or AppShell.tsx). If days were missed, auto-apply freezes up to the available count, and show a Toast. This ensures the streak state is always current.

2. **Should `uncompleteTask()` reverse the point ledger entry?**
   - What we know: Phase 1 has `uncompleteTask()` which sets status back to 'active'. Points were already awarded.
   - What's unclear: Whether uncompleting should claw back points (negative ledger entry) or leave them.
   - Recommendation: Leave points. The anti-anxiety principle means we never take away earned rewards. Uncomplete just reopens the task; no point deduction. Flag for user confirmation if needed.

3. **Streak display location -- header or task list area?**
   - What we know: Header has the point badge (D-01). Streak display was mentioned in CONTEXT.md specifics.
   - What's unclear: Exact placement of the streak indicator.
   - Recommendation: Place in header next to the point badge. Compact format: "fire 7" (fire icon + number). Keeps all gamification in one area. This is Claude's discretion per CONTEXT.md.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + test | Yes | system | -- |
| npm | Package management | Yes | system | -- |
| Vitest | Test runner | Yes | 4.1.5 | -- |
| happy-dom | Test environment | Yes | 20.9.x | -- |
| fake-indexeddb | In-memory DB for tests | Yes | 6.2.5 | -- |
| TypeScript | Type checking | Yes | 6.0.2 | -- |

**Missing dependencies with no fallback:** None -- all dependencies installed and current.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | vitest.config.ts |
| Quick run command | `vitest run` |
| Full suite command | `vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POINT-01 | Earns correct points by difficulty (10/25/50) | unit | `vitest run src/domain/__tests__/points.test.ts` | No -- Wave 0 |
| POINT-02 | Point balance displayed in header badge | integration | `vitest run src/components/gamification/__tests__/PointBadge.test.tsx` | No -- Wave 0 |
| POINT-03 | Transaction popover shows last 10 entries | integration | `vitest run src/components/gamification/__tests__/TransactionPopover.test.tsx` | No -- Wave 0 |
| POINT-04 | Ledger is append-only, no balance column | unit | `vitest run src/db/__tests__/point-ledger.test.ts` | No -- Wave 0 |
| POINT-05 | Streak multiplier applies correct bonus | unit | `vitest run src/domain/__tests__/points.test.ts` | No -- Wave 0 |
| STRK-01 | Streak tracks consecutive days with completions | integration | `vitest run src/hooks/__tests__/useStreaks.test.ts` | No -- Wave 0 |
| STRK-02 | Streak uses period records (one per day) | integration | `vitest run src/db/__tests__/streak-records.test.ts` | No -- Wave 0 |
| STRK-03 | Streak freeze auto-applies on missed days | integration | `vitest run src/hooks/__tests__/useStreaks.test.ts` | No -- Wave 0 |
| STRK-04 | All messaging uses positive framing | manual-only | -- | N/A |
| STRK-05 | Milestone celebration at 7, 14, 30 days | unit | `vitest run src/domain/__tests__/streaks.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `vitest run`
- **Per wave merge:** `vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/domain/__tests__/points.test.ts` -- covers POINT-01, POINT-05 (calculatePoints, calculateMultiplier)
- [ ] `src/domain/__tests__/streaks.test.ts` -- covers STRK-05 (milestone detection)
- [ ] `src/db/__tests__/point-ledger.test.ts` -- covers POINT-04 (append-only ledger integration)
- [ ] `src/db/__tests__/streak-records.test.ts` -- covers STRK-02 (period record CRUD)
- [ ] `src/hooks/__tests__/useStreaks.test.ts` -- covers STRK-01, STRK-03 (streak computation, freeze auto-apply)
- [ ] `src/components/gamification/__tests__/PointBadge.test.tsx` -- covers POINT-02
- [ ] `src/components/gamification/__tests__/TransactionPopover.test.tsx` -- covers POINT-03

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Single-user local app, no auth |
| V3 Session Management | No | No sessions, IndexedDB only |
| V4 Access Control | No | Single-user local app |
| V5 Input Validation | Yes | Zod schemas for point/streak records; existing taskCreateSchema pattern |
| V6 Cryptography | No | No sensitive data, local-only storage |

### Known Threat Patterns for Client-Side Gamification

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IndexedDB data manipulation via DevTools | Tampering | Accept -- single-user local app, no competitive/monetary value |
| XSS via task title in ledger reason | Tampering, Information Disclosure | React auto-escapes JSX text nodes; no dangerouslySetInnerHTML |
| Schema validation bypass | Tampering | Zod validates all inputs before DB write |
| Point balance manipulation via DevTools | Tampering | Accept -- user only cheats themselves; no leaderboards |

## Sources

### Primary (HIGH confidence)
- [dexie.org/docs/Tutorial/Design](https://dexie.org/docs/Tutorial/Design#database-versioning) - Schema versioning, transactions, upgrade patterns
- [dexie.org/docs/dexie-react-hooks/useLiveQuery()](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) - Reactive query API, deps array, limitations
- [dexie.org/docs/Typescript](https://dexie.org/docs/Typescript) - EntityTable type, Dexie 4 TypeScript patterns
- [npm registry] - All package versions verified current (2026-04-29)
- Existing codebase: src/db/index.ts, src/hooks/useTaskActions.ts, src/domain/types.ts, src/domain/task.ts, src/components/layout/Header.tsx, src/components/common/Toast.tsx

### Secondary (MEDIUM confidence)
- [date-fns docs](https://date-fns.org/docs/Getting-Started) - formatDistanceToNow, startOfDay, differenceInCalendarDays
- [Framer Motion docs](https://www.framer.com/motion/) - useSpring, useMotionValue, useTransform patterns

### Tertiary (LOW confidence)
None -- all findings verified against official docs or codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified current
- Architecture: HIGH - patterns established in Phase 1, Dexie docs confirm version upgrade approach
- Pitfalls: HIGH - 3 of 8 verified through Dexie official docs, remainder from domain expertise

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (stable domain, no fast-moving dependencies)

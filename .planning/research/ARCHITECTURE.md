# Architecture Patterns

**Domain:** Local-first anti-anxiety goal tracking web app with gamification
**Researched:** 2026-04-28

## Recommended Architecture

**Layered local-first architecture** with four horizontal layers and seven vertical domain modules. The local IndexedDB database is the single source of truth. There is no server.

```
+------------------------------------------------------------------+
|                        Presentation Layer                         |
|  React Components + Framer Motion (UI transitions)               |
|  + Lottie (mascot animations)                                    |
+------------------------------------------------------------------+
|                        State Layer                                |
|  Zustand stores (UI state, transient state)                      |
|  + Dexie useLiveQuery (persistent data, reactive queries)        |
+------------------------------------------------------------------+
|                        Domain Logic Layer                         |
|  Pure functions: points calculation, streak evaluation,          |
|  mood aggregation, summary generation                            |
+------------------------------------------------------------------+
|                        Data Access Layer                          |
|  Dexie.js (IndexedDB wrapper) -- schema, migrations, queries     |
+------------------------------------------------------------------+
```

### Why This Layering

1. **Dexie.js as the data layer** -- Not raw IndexedDB, not RxDB, not Zustand-persist-to-IndexedDB. Dexie provides a typed, migratable schema with `useLiveQuery` for reactive React bindings. It is purpose-built for IndexedDB and handles schema versioning, transactions, and complex queries far better than wrapping IndexedDB manually or using a generic state manager's persistence middleware.

2. **Zustand for UI/transient state only** -- UI theme, selected filters, modal open/closed state, current animation state. NOT for persistent business data. The database owns persistent data; Zustand owns ephemeral UI state. This avoids the dual-write problem (state manager and DB both trying to be source of truth).

3. **Domain logic as pure functions** -- Points calculation, streak evaluation, summary generation, and mood aggregation are all pure functions that take data in and return results. No side effects, no DB access, no React dependencies. This makes them trivially testable and reusable from any layer.

4. **React + Framer Motion + Lottie for presentation** -- Framer Motion handles layout transitions, list animations, mount/unmount animations, and gesture-driven interactions. Lottie handles pre-rendered mascot animations (celebration, encouragement, idle states). These two libraries cover different animation needs and complement each other; they are not competing alternatives.

### Vertical Domain Modules

The app decomposes into seven domain modules. Each owns its data, its domain logic, and its UI surface. Modules communicate through well-defined interfaces, not by reaching into each other's internals.

```
+-------------------+    +------------------+    +-------------------+
|     Tasks         |    |     Points       |    |     Rewards       |
| Simple/Category/  |    | Earn, spend,     |    | User-defined      |
| Project hierarchy |    | balance, history |    | rewards, redeem   |
+-------------------+    +------------------+    +-------------------+
          |                       |                       |
          |  completion event     |  points awarded       |
          v                       v                       v
+------------------------------------------------------------------+
|                       Event Bus (application-level)              |
+------------------------------------------------------------------+
          |                       |                       |
          v                       v                       v
+-------------------+    +------------------+    +-------------------+
|     Moods         |    |     Streaks      |    |     Mascot        |
| Emoji tags,       |    | Daily streaks,   |    | Animation state,  |
| journal entries   |    | freeze, history  |    | reaction triggers |
+-------------------+    +------------------+    +-------------------+
          |
          v
+-------------------+
|    Summaries      |
| Daily/weekly      |
| aggregation       |
+-------------------+
```

## Component Boundaries

### Component 1: Data Access Layer (Dexie.js)

**Responsibility:** Define the IndexedDB schema, handle migrations, provide typed query functions, and expose reactive hooks via `useLiveQuery`.

**Communicates with:** Domain Logic Layer (provides data), State Layer (feeds `useLiveQuery` results to React).

| Table | Primary Key | Key Indexes | Purpose |
|-------|-------------|-------------|---------|
| `tasks` | `++id` | `parentId, type, status, createdAt, completedAt` | All task types (simple, category, project) |
| `pointEvents` | `++id` | `taskId, type, awardedAt, [type+awardedAt]` | Append-only ledger of all point transactions |
| `rewards` | `++id` | `status, createdAt` | User-defined rewards with cost |
| `moodEntries` | `++id` | `taskId, createdAt, mood` | Mood tags and journal text per completion |
| `streakPeriods` | `++id` | `date, outcome` | Daily streak period records |
| `summaries` | `++id` | `type, periodStart, periodEnd, [type+periodStart]` | Pre-computed daily/weekly summaries |
| `userSettings` | `key` | (none) | Single-row settings: timezone, preferences |
| `mascotState` | `key` | (none) | Mascot mood, current animation, unlocked expressions |

**Key design decisions:**

- Tasks use a single table with a `type` discriminator (`simple | category | project`) and a `parentId` self-reference for hierarchy. This avoids three separate tables and makes querying simpler. A project has `type: 'project'`. Its milestones are tasks with `parentId: projectId` and `type: 'milestone'`. A milestone's tasks are tasks with `parentId: milestoneId` and `type: 'task'`.

- Points use an **event-sourced ledger** (`pointEvents`), not a balance column. The balance is always computed as `SUM(amount) WHERE type = 'earned' - SUM(amount) WHERE type = 'spent'`. This is inspired by the Trophy.so data model where every award traces back to an originating event. It makes auditing, undo, and history display trivial.

- Streaks use **period records**, not a counter. Each day gets a row with an outcome (`completed | missed | frozen`). This is the correct model because streak logic requires timezone-aware calendar evaluation, not 24-hour arithmetic. A streak's current length is the count of consecutive `completed` days ending at today.

- Summaries are **pre-computed and stored**, not computed on demand. When a task is completed, the daily summary for that day is recalculated and upserted. Weekly summaries are recalculated when any day in that week changes. This makes summary views instant (single row lookup) rather than requiring aggregation over potentially hundreds of entries.

### Component 2: State Layer (Zustand)

**Responsibility:** Manage ephemeral UI state that does not belong in the database.

**Communicates with:** Presentation Layer (provides state), Data Access Layer (reads from `useLiveQuery`).

| Store | Contents | Why Zustand not DB |
|-------|----------|-------------------|
| `uiStore` | Active view, selected task, modals open, sidebar collapsed | Transient session state |
| `animationStore` | Currently playing animation, animation queue, mascot mood override | Runtime animation state |
| `filterStore` | Active filters, sort order, date range for views | View preferences (could persist to localStorage via Zustand persist for convenience) |

**Pattern for combining Dexie and Zustand:**

```typescript
// Component reads persistent data from Dexie (reactive)
const tasks = useLiveQuery(() => db.tasks.where('status').equals('active').toArray())

// Component reads UI state from Zustand
const selectedTaskId = useUiStore(s => s.selectedTaskId)

// User action triggers domain logic, which writes to Dexie.
// useLiveQuery automatically re-runs and the UI updates.
async function handleCompleteTask(taskId: string) {
  const result = completeTask(taskId)  // domain logic, pure function
  await db.transaction('rw', db.tasks, db.pointEvents, db.streakPeriods, async () => {
    await db.tasks.update(taskId, { status: 'completed', completedAt: new Date() })
    await db.pointEvents.bulkAdd(result.pointEvents)
    await updateStreakPeriod(db, new Date())
  })
  // useLiveQuery in consuming components fires automatically
}
```

### Component 3: Domain Logic Layer

**Responsibility:** Pure functions that implement business rules. No DB access, no React, no side effects.

**Communicates with:** Data Access Layer (receives data as arguments), State Layer (called from action handlers).

| Module | Key Functions | Input | Output |
|--------|--------------|-------|--------|
| `taskDomain` | `validateTask`, `computeTaskPoints`, `getTaskHierarchy` | Task data | Validated task, point value, tree structure |
| `pointsDomain` | `calculatePointsEarned`, `calculateBalance`, `canAffordReward` | Point events, reward | Points amount, balance boolean |
| `streakDomain` | `evaluateStreak`, `calculateStreakBonus`, `shouldResetStreak` | Period records, timezone config | Streak length, bonus multiplier |
| `moodDomain` | `validateMoodEntry`, `aggregateMoodsForPeriod` | Mood entries, date range | Validated entry, mood statistics |
| `summaryDomain` | `generateDailySummary`, `generateWeeklySummary` | Tasks, moods, points for period | Summary object (ready to persist) |
| `mascotDomain` | `selectMascotReaction`, `getMascotState` | Event type, current state | Animation name, mascot mood |

**Why pure functions matter here:**

The domain logic is where the "anti-anxiety" design philosophy lives. Streaks should be forgiving (freeze mechanics, not punishment). Points should feel generous, not stingy. The mascot should celebrate small wins. These are behavioral design choices that should be isolated, testable, and easy to tune without touching UI or data code.

### Component 4: Presentation Layer

**Responsibility:** Render UI, handle user interactions, trigger animations.

**Communicates with:** State Layer (subscribes to Zustand), Data Access Layer (subscribes via `useLiveQuery`), Domain Logic Layer (calls pure functions for display calculations).

**Sub-components by UI surface:**

| Surface | Components | Animation Library |
|---------|-----------|-------------------|
| Task list/board | `TaskItem`, `TaskList`, `TaskForm`, `ProjectTree` | Framer Motion (reorder, expand/collapse, completion checkmark) |
| Points dashboard | `PointsDisplay`, `PointsHistory`, `LevelBadge` | Framer Motion (number counting), Lottie (level-up celebration) |
| Reward shelf | `RewardCard`, `RewardForm`, `RedeemDialog` | Framer Motion (card flip, confetti on redeem) |
| Mood picker | `MoodSelector`, `MoodTimeline`, `MoodChart` | Framer Motion (emoji selection animation) |
| Streak display | `StreakCounter`, `StreakCalendar` | Framer Motion (fire animation grow), Lottie (streak milestone) |
| Mascot area | `MascotCharacter`, `MascotBubble` | Lottie (all mascot animations), Framer Motion (entrance/exit) |
| Summary view | `DailySummary`, `WeeklySummary`, `MoodTrendChart` | Framer Motion (chart transitions) |

### Component 5: Event Pipeline

**Responsibility:** When a task is completed, multiple systems need to react (points awarded, streak evaluated, mood prompted, mascot reacts, summary updated). The event pipeline coordinates these side effects in a single transactional boundary.

**Communicates with:** All domain modules (triggers evaluation), Data Access Layer (writes results).

```typescript
// The central "task completed" flow:
async function onTaskCompleted(taskId: string, moodEntry?: MoodInput) {
  const task = await db.tasks.get(taskId)
  const now = new Date()

  // 1. Domain calculations (pure functions, no side effects)
  const pointEvent = calculatePointsEarned(task, streakState)
  const streakResult = evaluateStreak(now, userTimezone)
  const mascotReaction = selectMascotReaction('task_completed', streakResult)

  // 2. Single transactional write
  await db.transaction('rw', [db.tasks, db.pointEvents, db.streakPeriods, db.moodEntries, db.summaries, db.mascotState], async () => {
    await db.tasks.update(taskId, { status: 'completed', completedAt: now })
    await db.pointEvents.add(pointEvent)
    await upsertStreakPeriod(streakResult)
    if (moodEntry) await db.moodEntries.add({ ...moodEntry, taskId, createdAt: now })
    await regenerateDailySummary(db, now)
    await db.mascotState.put({ key: 'current', ...mascotReaction })
  })

  // 3. UI state updates (Zustand, non-persistent)
  animationStore.queueMascotAnimation(mascotReaction.animationName)
}
```

This is NOT a pub/sub event bus with async dispatchers. It is a synchronous function call chain inside a Dexie transaction. This avoids the complexity of event bus infrastructure while achieving the same result: one user action triggers coordinated updates across all domain modules atomically.

### Component 6: Summary Engine

**Responsibility:** Generate and cache daily and weekly summaries. Aggregates task completion data, point changes, mood trends, and streak status into a single pre-computed record.

**Communicates with:** Data Access Layer (reads raw data, writes summary records).

**Trigger:** Recalculated whenever a task is completed, a mood is recorded, or the date changes (checked on app open).

```
Daily Summary Schema:
{
  date: Date,
  tasksCompleted: number,
  tasksTotal: number,
  pointsEarned: number,
  pointsSpent: number,
  moodEntries: { [mood: string]: number },  // mood distribution
  dominantMood: string,
  journalEntries: string[],                  // excerpts
  streakLength: number,
  longestStreak: number,
  topTaskCategory: string | null
}

Weekly Summary Schema:
{
  weekStart: Date,
  weekEnd: Date,
  dailySummaries: DailySummary[],            // embedded, only 7
  totalTasksCompleted: number,
  totalPointsEarned: number,
  moodTrend: 'improving' | 'stable' | 'declining',
  bestDay: Date,
  weeklyHighlight: string                    // e.g. "Completed 5 tasks on Wednesday!"
}
```

Weekly summaries embed their 7 daily summaries. This avoids joins and keeps the weekly view as a single record read. For a personal tool with one user, the data volume is negligible (365 daily records per year).

### Component 7: Mascot System

**Responsibility:** Manage mascot state, select appropriate animations, provide the Lottie player interface.

**Communicates with:** Event Pipeline (receives triggers), Presentation Layer (provides animation data).

| Mascot State | Trigger | Lottie Animation |
|-------------|---------|------------------|
| Idle | Default / no recent activity | Gentle breathing or bobbing |
| Celebrating | Task completed | Jumping, confetti, sparkles |
| Encouraging | Streak milestone | Waving, cheering |
| Concerned | Streak about to break (end of day) | Gentle nudge animation |
| Proud | Level up / major achievement | Grand celebration |
| Reflective | Summary view open | Thoughtful pose |

The mascot system does NOT need its own state manager. Mascot state lives in the `mascotState` table (one row, persisted). The animation queue lives in the Zustand `animationStore` (ephemeral). The Lottie player component reads from both.

## Data Flow

### Primary Flow: Task Completion

```
User clicks "Complete" on task
        |
        v
[TaskItem component] calls handleCompleteTask(taskId, mood?)
        |
        v
[Event Pipeline] onTaskCompleted()
        |
        +---> [taskDomain] calculates point value
        +---> [streakDomain] evaluates streak for today
        +---> [mascotDomain] selects mascot reaction
        +---> [summaryDomain] regenerates daily summary
        |
        v
[Dexie transaction] writes to 5 tables atomically
        |
        v
[useLiveQuery] in all subscribed components re-fires
        |
        v
[UI updates] Points display, streak counter, task list, mascot
        |
        v
[Zustand animationStore] queues mascot animation
        |
        v
[Lottie player] plays celebration animation
```

### Secondary Flow: Viewing Daily Summary

```
User navigates to Summary view
        |
        v
[DailySummary component] uses useLiveQuery to read summary record
        |
        v
If summary exists for today --> render immediately (single record read)
If no summary (first visit today) --> trigger summary generation
        |
        v
[summaryDomain.generateDailySummary()] reads raw data from DB
        |
        v
Writes summary to db.summaries
        |
        v
useLiveQuery re-fires, component renders
```

### Secondary Flow: Reward Redemption

```
User clicks "Redeem" on reward
        |
        v
[RewardCard component] calls handleRedeem(rewardId)
        |
        v
[pointsDomain.canAffordReward()] checks balance from pointEvents
        |
        v
If can afford:
  [Dexie transaction]
    - Insert pointEvent with type: 'spent', amount: -reward.cost
    - Update reward status to 'redeemed'
        |
        v
[UI] confetti animation, points balance updates
```

### Initialization Flow: App Startup

```
Browser loads app
        |
        v
[Dexie] opens database, runs pending migrations
        |
        v
[App component] reads userSettings via useLiveQuery
        |
        v
[streakDomain] checks if today's streak period exists
  If not: creates one (new day)
  If streak is broken: evaluates last period, marks as 'missed' if needed
        |
        v
[UI] renders with cached data from IndexedDB (instant)
        |
        v
[Zustand] restores UI preferences from localStorage
```

## Patterns to Follow

### Pattern 1: Single Table Inheritance for Tasks

**What:** All task types (simple, category-with-subtasks, project-milestone-task) live in one `tasks` table, differentiated by a `type` field and linked by `parentId`.

**When:** You have a hierarchy where entities share most fields but differ in behavior.

**Example:**

```typescript
interface Task {
  id: number
  type: 'simple' | 'category' | 'project'
  parentId: number | null
  title: string
  description: string
  status: 'active' | 'completed' | 'archived'
  difficulty: 'easy' | 'medium' | 'hard'
  pointValue: number
  sortOrder: number
  createdAt: Date
  completedAt: Date | null
}
```

**Why not separate tables:** The hierarchy is only 3 levels deep. A single table with `parentId` self-reference is simpler to query, simpler to animate (one list), and simpler to build completion logic for. The query "give me all tasks in project X" is `WHERE parentId = X OR id = X`. No joins needed.

### Pattern 2: Event-Sourced Points Ledger

**What:** Never store a balance. Store every point transaction as an immutable event. Compute balance by summing.

**When:** Any system where you need audit trail, history display, or undo capability.

**Example:**

```typescript
interface PointEvent {
  id: number
  type: 'earned' | 'spent' | 'bonus' | 'streak_reward'
  amount: number           // positive for earned, negative for spent
  sourceTaskId: number | null
  sourceType: 'task_completion' | 'streak_bonus' | 'reward_redemption' | 'manual'
  description: string
  createdAt: Date
}
```

**Why not a balance column:** A balance column is a denormalization that will go stale. The ledger approach makes "show me my point history" and "how did I earn these points" trivial queries. For a personal app with modest data volume, summing events is instant.

### Pattern 3: Pre-computed Summaries with Upsert

**What:** When a task is completed, immediately regenerate and store the daily summary. Weekly summaries regenerate when their constituent days change.

**When:** Summary views need to load instantly and display aggregated data.

**Why not compute on demand:** Computing a daily summary requires scanning all tasks, point events, and mood entries for a day. Pre-computing means the summary view is a single indexed record lookup. The write cost (regenerate on every completion) is negligible for a single-user app.

### Pattern 4: Co-located Queries with `useLiveQuery`

**What:** Each component declares its own data needs via `useLiveQuery`. No global data fetching layer, no prop drilling of data.

**When:** Building React UIs backed by IndexedDB.

**Example:**

```typescript
function TaskList({ projectId }: { projectId: number }) {
  const tasks = useLiveQuery(
    () => db.tasks
      .where('parentId').equals(projectId)
      .sortBy('sortOrder')
  )

  // tasks is undefined on first render (loading), then live-updating
}
```

**Why not a central data fetcher:** Dexie's `useLiveQuery` is reactive -- it automatically re-runs when underlying data changes. This eliminates the need for manual refetching, cache invalidation, or state synchronization. Each component is self-contained.

### Pattern 5: Dual Animation Architecture

**What:** Use Framer Motion for UI transitions (layout, mount/unmount, gestures) and Lottie for mascot character animations (pre-rendered complex character art).

**When:** A web app needs both smooth UI transitions and rich character animations.

**Why this split:** Framer Motion excels at animating DOM elements declaratively. Lottie excels at playing complex vector animations designed in After Effects. A mascot character with facial expressions, body movements, and particle effects is far easier to create as a Lottie animation than to code with Framer Motion. Conversely, a list reordering animation is trivial in Framer Motion and impossible with Lottie.

```typescript
// Framer Motion: UI transition
<motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
  <TaskItem task={task} />
</motion.div>

// Lottie: Mascot animation
<Lottie animationData={celebrationAnimation} loop={false} onComplete={onAnimationDone} />
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Zustand-Persist-to-IndexedDB for Business Data

**What:** Using Zustand's `persist` middleware with a custom IndexedDB storage adapter to store tasks, points, etc.

**Why bad:** Zustand persist serializes the entire store state on every change. This violates the web.dev IndexedDB best practice of breaking data into individual records and only updating what changes. It creates a single massive blob write on every task completion. It also makes querying impossible (you cannot query "all tasks with status active" from a serialized JSON blob).

**Instead:** Use Dexie.js for structured, queryable IndexedDB access. Use Zustand only for ephemeral UI state.

### Anti-Pattern 2: Computing Summaries on Demand

**What:** Generating daily/weekly summaries by aggregating raw data every time the user opens the summary view.

**Why bad:** As data accumulates, this query gets slower. More importantly, it means the summary view has a loading state every time, which breaks the "instant" feel of a local-first app.

**Instead:** Pre-compute and cache summaries. Upsert on data change. Summary views are always a single record read.

### Anti-Pattern 3: Streak as a Counter

**What:** Storing a single `currentStreak: number` field that increments on completion and resets to 0 on a miss.

**Why bad:** You lose streak history. You cannot show a calendar view. You cannot implement freeze mechanics. Timezone handling becomes fragile (is "today" based on UTC or local time?).

**Instead:** Store a row per day with an outcome. Compute streak length from the period records. This is the model described in the Trophy.so gamification data model and it is the correct approach for any non-trivial streak system.

### Anti-Pattern 4: Separate Tables per Task Level

**What:** Creating `simpleTasks`, `categoryTasks`, `projectTasks`, `milestoneTasks` tables.

**Why bad:** Cross-level queries become complex joins. Animation of a flat list requires merging multiple data sources. The hierarchy is only 3 levels deep and the entities share 90% of their fields.

**Instead:** Single `tasks` table with `type` discriminator and `parentId` self-reference.

### Anti-Pattern 5: Animation Logic in Business Code

**What:** Mixing animation trigger decisions (which mascot animation to play) into task completion handlers.

**Why bad:** Animation requirements change frequently during design iteration. Business logic should be stable. Tying them together means every design change requires touching core logic.

**Instead:** The `mascotDomain` module takes an event type and returns an animation name. The UI layer reads the animation name and plays it. Business logic does not know about Lottie; Lottie does not know about task completion.

## Scalability Considerations

This is a single-user, personal tool. The scalability ceiling is roughly:

| Concern | Expected Volume | Approach |
|---------|----------------|----------|
| Total tasks (1 year) | ~2,000-5,000 | IndexedDB handles this trivially. No optimization needed. |
| Point events (1 year) | ~3,000-8,000 | Ledger scan for balance is instant at this volume. |
| Mood entries (1 year) | ~1,000-3,000 | Tiny dataset. Any query pattern works. |
| Daily summaries (1 year) | 365 | Could load all into memory on startup if needed. |
| Mascot animation files | 10-20 Lottie JSON files | Total size under 2MB. Bundle or lazy-load. |

**Conclusion:** For this scale, optimization is premature. Design for correctness and clarity. The architecture will handle years of single-user data without any performance work.

## Build Order (Dependencies Between Components)

This is the recommended build order based on component dependencies. Each phase builds on the previous one.

```
Phase 1: Foundation (no dependencies)
  - Data Access Layer: Dexie schema, migrations, typed tables
  - Domain Logic: taskDomain (pure functions)
  - Basic UI: TaskList, TaskItem, TaskForm (simple tasks only)

Phase 2: Gamification Core (depends on Phase 1)
  - Domain Logic: pointsDomain, streakDomain
  - Event Pipeline: onTaskCompleted orchestration
  - UI: PointsDisplay, StreakCounter
  - DB: pointEvents table, streakPeriods table

Phase 3: Mood + Rewards (depends on Phase 2)
  - Domain Logic: moodDomain
  - DB: moodEntries table, rewards table
  - UI: MoodSelector, RewardShelf, RewardForm

Phase 4: Mascot + Animations (depends on Phase 1-3 for triggers)
  - Mascot animations (Lottie assets)
  - Domain Logic: mascotDomain
  - UI: MascotCharacter, Framer Motion transitions everywhere
  - Zustand: animationStore

Phase 5: Summaries (depends on all prior phases)
  - Domain Logic: summaryDomain
  - DB: summaries table
  - UI: DailySummary, WeeklySummary, MoodChart

Phase 6: Polish (depends on all prior phases)
  - Responsive design refinement
  - Offline/PWA capabilities
  - Data export/import
  - Settings UI
```

**Why this order:**

1. **Tasks first** because they are the core entity. Everything else is triggered by task completion.
2. **Points and streaks second** because they are the primary feedback loop that makes task completion feel rewarding.
3. **Mood and rewards third** because mood recording depends on task completion as the trigger, and rewards depend on the points system existing.
4. **Mascot and animations fourth** because they are layered on top of existing event triggers. The mascot reacts to things that already exist (completions, streaks, points).
5. **Summaries fifth** because they aggregate data from all prior systems. A daily summary needs tasks, points, moods, and streaks to exist first.
6. **Polish last** because responsive design, PWA, and export are cross-cutting concerns that benefit from a stable feature set underneath.

## Sources

- [Trophy.so: The Gamification Data Model](https://trophy.so/blog/gamification-data-model) -- Event-sourced points ledger, streak period records, cross-feature references (HIGH confidence, authoritative)
- [web.dev: Best Practices for Persisting Application State with IndexedDB](https://web.dev/articles/indexeddb-best-practices-app-state) -- Break data into individual records, handle write failures, keep in-memory copy (HIGH confidence, Google official)
- [Dexie.js: React Integration](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) -- Reactive queries with useLiveQuery (HIGH confidence, official docs)
- [Zustand: Persisting Store Data](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- Persist middleware, custom storage API (HIGH confidence, official docs)
- [Zustand + IndexedDB Discussion](https://github.com/pmndrs/zustand/discussions/1721) -- Custom storage adapter pattern for async IndexedDB (MEDIUM confidence, community discussion)
- [LottieFiles: Mascot Animations](https://lottiefiles.com/free-animations/mascot) -- Pre-rendered mascot animation assets (HIGH confidence, asset library)
- [Framer Motion Documentation](https://www.framer.com/motion/) -- Animation variants, AnimatePresence, layout animations (HIGH confidence, official docs)
- [RxDB: Local-First Future](https://rxdb.info/articles/local-first-future.html) -- Local-first architectural patterns (MEDIUM confidence, vendor docs)
- [LogRocket: Offline-First Frontend Apps](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) -- IndexedDB vs SQLite comparison, offline patterns (MEDIUM confidence, blog)

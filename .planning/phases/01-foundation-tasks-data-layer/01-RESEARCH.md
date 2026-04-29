# Phase 1: Foundation -- Tasks & Data Layer - Research

**Researched:** 2026-04-29
**Domain:** Local-first task management with IndexedDB persistence via Dexie.js, React 19 SPA
**Confidence:** HIGH

## Summary

Phase 1 builds the entire data foundation and core task management UI. The app must boot to a usable task input within 5 seconds, persist data in IndexedDB via Dexie.js, and support full CRUD for tasks with categories, subtasks, difficulty levels, drag-to-reorder, and archive. JSON export/import via `dexie-export-import` protects against Safari ITP data loss. Zustand manages ephemeral UI state only (filters, selected task, modals). All persistent business data flows through Dexie.

The dnd-kit ecosystem has a newer `@dnd-kit/react` package (v0.4.0) with a cleaner hooks-based API, but it is pre-1.0 and the official docs now reference it. The classic `@dnd-kit/core` + `@dnd-kit/sortable` combo (v6.3.1 / v10.0.0) remains the stable, battle-tested choice. For Phase 1, either works -- the newer API is simpler but less proven.

**Primary recommendation:** Scaffold with Vite + React 19 + TypeScript. Define the Dexie schema first (tasks table). Build the task CRUD UI with Motion for completion animations. Add dnd-kit for reordering. Wire up dexie-export-import for JSON backup. Keep Zustand minimal -- only UI state.

<user_constraints>
## User Constraints (from STATE.md)

### Locked Decisions
- Tech stack: React 19 + TypeScript + Vite 8 + Zustand 5 + Dexie 4 + Tailwind 4 + Motion 12
- Storage: Dexie.js (IndexedDB) for all data, localStorage for UI preferences only
- Tasks: Single table with type discriminator + parentId self-reference
- Anti-anxiety: No punitive messaging, positive framing only
- Points: Event-sourced ledger (no balance column)
- Streaks: Period records (one row per day), not counter
- Animations: Framer Motion for UI, Lottie for mascot, canvas-confetti for celebrations

### Claude's Discretion
- Exact component decomposition within the architecture
- UI layout and interaction patterns
- Test structure and coverage approach
- Code organization details within the prescribed layers

### Deferred Ideas (OUT OF SCOPE)
- Points system (Phase 2)
- Streak system (Phase 2)
- Mood tracking (Phase 3)
- Rewards system (Phase 3)
- Mascot and celebration animations beyond task completion check (Phase 4)
- Summaries (Phase 5)
- PWA/offline service worker (later phase)
- Cloud sync (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TASK-01 | User can create simple tasks with title and optional description | Dexie tasks table + TaskForm component + useLiveQuery reactive binding |
| TASK-02 | User can complete tasks with satisfying visual + animation feedback | Motion AnimatePresence + check animation on TaskItem |
| TASK-03 | User can edit and delete tasks | Dexie update/delete + inline editing pattern |
| TASK-04 | User can organize tasks with categories (tags) | Tasks table category field + filterStore in Zustand |
| TASK-05 | User can create subtasks under a task | parentId self-reference in tasks table + hierarchical query |
| TASK-06 | User can reorder tasks via drag and drop | @dnd-kit sortable with sortOrder persistence to Dexie |
| TASK-07 | User can assign difficulty level (easy/medium/hard) to tasks | difficulty field on tasks table + TaskForm select |
| TASK-08 | User can archive completed tasks to keep list clean | status field: 'active'/'completed'/'archived' + archive query |
| DATA-01 | All data stored locally in IndexedDB via Dexie.js | Dexie.js schema + transactions for all writes |
| DATA-02 | No account or login required -- works immediately on first visit | No auth layer, Dexie auto-creates DB on first use |
| DATA-03 | Data persists across page refreshes and browser restarts | IndexedDB persistence inherent, useLiveQuery rehydrates on mount |
| DATA-04 | User can export data as JSON backup | dexie-export-import addon: `exportDB(db)` produces JSON blob |
| DATA-05 | User can import data from JSON backup | dexie-export-import addon: `importInto(db, blob)` restores from file |
| ONBD-01 | First screen is task input -- start using in 5 seconds | Inline task input at top of main view, no wizard |
| ONBD-02 | Features discovered progressively, no setup wizard | Progressive disclosure: simple view first, categories/subtasks revealed on demand |
| ONBD-03 | No "what's your name?" or mandatory profile creation | No user profile table, no settings required to start |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Task CRUD operations | Browser (React components) | -- | All data flows through client-side React UI |
| Data persistence | Database (IndexedDB via Dexie) | -- | Dexie manages schema, queries, transactions |
| Reactive data binding | Browser (useLiveQuery hooks) | -- | Components subscribe directly to Dexie queries |
| UI state (filters, modals) | Browser (Zustand stores) | -- | Ephemeral state, not persisted |
| Task reordering | Browser (dnd-kit) | Database (sortOrder field) | DnD is client gesture; order persisted to Dexie |
| Export/import | Browser (dexie-export-import) | -- | Client-side blob generation and file handling |
| Completion animation | Browser (Motion) | -- | CSS/JS animation on task completion |
| Validation | Browser (Zod schemas) | -- | Input validation at system boundary |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.5 | UI framework | [VERIFIED: npm registry] Largest ecosystem for animation libraries, React Compiler auto-memoization |
| react-dom | 19.2.5 | DOM rendering | [VERIFIED: npm registry] Required peer dependency for React |
| typescript | 6.0.3 | Type safety | [VERIFIED: npm registry] Industry standard, prevents data corruption in IndexedDB operations |
| vite | 8.0.10 | Build tool + dev server | [VERIFIED: npm registry] Fastest HMR, native ESM, SPA mode |
| @vitejs/plugin-react | 6.0.1 | Vite React integration | [VERIFIED: npm registry] Required for React Fast Refresh |
| zustand | 5.0.12 | UI state management | [VERIFIED: npm registry] Minimal boilerplate, no providers needed |
| dexie | 4.4.2 | IndexedDB wrapper | [VERIFIED: npm registry] Promise-based, schema versioning, useLiveQuery |
| dexie-react-hooks | 4.4.0 | Reactive Dexie queries in React | [VERIFIED: npm registry] useLiveQuery hook for automatic re-renders |
| tailwindcss | 4.2.4 | Utility-first CSS | [VERIFIED: npm registry] CSS-first config, auto content detection, OKLCH colors |
| @tailwindcss/vite | 4.2.4 | Tailwind Vite plugin | [VERIFIED: npm registry] First-party, faster than PostCSS integration |
| framer-motion | 12.38.0 | UI animations | [VERIFIED: npm registry] (npm package name is framer-motion despite rebrand to Motion) Declarative API, AnimatePresence, layout animations |
| nanoid | 5.1.9 | Unique ID generation | [VERIFIED: npm registry] Tiny (130 bytes), URL-safe, collision-resistant |
| zod | 4.3.6 | Input validation | [VERIFIED: npm registry] Runtime type checking at system boundaries |
| clsx | 2.1.1 | Conditional class joining | [VERIFIED: npm registry] Tiny utility for composing Tailwind classes |
| tailwind-merge | 3.5.0 | Merge Tailwind classes | [VERIFIED: npm registry] Prevents class conflicts in composable components |

### Phase-Specific
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dexie-export-import | 4.4.0 | JSON export/import for IndexedDB | DATA-04, DATA-05: backup/restore functionality |
| @dnd-kit/core | 6.3.1 | Drag and drop foundation | TASK-06: task reordering |
| @dnd-kit/sortable | 10.0.0 | Sortable preset for dnd-kit | TASK-06: sortable task list |
| @dnd-kit/utilities | 3.2.2 | CSS utilities for dnd-kit | TASK-06: drag overlays and transforms |
| react-router | 7.14.2 | Client-side routing | Navigation between views (if multi-view) |
| date-fns | 4.1.0 | Date formatting and calculation | Task timestamps, relative time display |

### Dev Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| vitest | 4.1.5 | Test runner |
| @testing-library/react | 16.3.2 | Component testing |
| @testing-library/user-event | 14.6.1 | Simulate user interactions |
| @testing-library/jest-dom | 6.9.1 | DOM matchers |
| happy-dom | 20.9.0 | Browser environment for tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core + @dnd-kit/sortable | @dnd-kit/react (v0.4.0) | Newer package has cleaner API but is pre-1.0. Core+sortable is battle-tested. Recommend stable choice for Phase 1; migrate to @dnd-kit/react in a later phase if desired |
| dexie-export-import | Custom JSON serialization | Hand-rolling export misses exotic types (Date objects), streaming, and progress callbacks. dexie-export-import handles all of this [CITED: dexie.org/docs/ExportImport/dexie-export-import] |

**Installation:**
```bash
# Create project
npm create vite@latest DoNotNervous -- --template react-ts

# Core dependencies
npm install react@19 react-dom@19 react-router@7 zustand@5 dexie@4 dexie-react-hooks dexie-export-import

# Styling
npm install tailwindcss@4 @tailwindcss/vite clsx tailwind-merge

# Animation
npm install framer-motion@12

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Utilities
npm install nanoid zod date-fns

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom
```

**Version verification:** All versions confirmed against npm registry on 2026-04-29.

## Architecture Patterns

### System Architecture Diagram

```
Browser loads app
        |
        v
[Vite dev server / static build]
        |
        v
[React 19 App] -- [Zustand stores] (UI state only: filters, modals, selection)
        |                    |
        v                    v
[useLiveQuery hooks] <-- [Dexie.js] <-- [IndexedDB]
        |                    |
        v                    v
[React Components]     [Dexie transactions]
  TaskForm               - task CRUD
  TaskList               - sortOrder updates
  TaskItem               - export/import
  CategoryFilter
        |
        v
[Domain Logic] (pure functions)
  validateTask (Zod)
  getTaskHierarchy
        |
        v
[User sees task list in < 5 seconds]
```

### Recommended Project Structure
```
src/
├── db/                    # Dexie schema, database instance, migrations
│   ├── index.ts           # Database instance + schema definition
│   └── migrations/        # Future schema upgrades
├── domain/                # Pure business logic functions
│   ├── task.ts            # validateTask, getTaskHierarchy, computeSortOrder
│   └── types.ts           # Task, Category, Difficulty type definitions
├── stores/                # Zustand stores for UI state only
│   ├── uiStore.ts         # Selected task, modals, sidebar state
│   └── filterStore.ts     # Active filters, sort order, category filter
├── components/            # React components
│   ├── tasks/             # Task-related components
│   │   ├── TaskForm.tsx       # Create/edit task form
│   │   ├── TaskList.tsx       # Renders task list with useLiveQuery
│   │   ├── TaskItem.tsx       # Single task with complete/edit/delete
│   │   ├── TaskItemSortable.tsx # dnd-kit sortable wrapper
│   │   └── SubtaskList.tsx    # Nested subtask display
│   ├── layout/            # App shell, navigation
│   │   ├── AppShell.tsx
│   │   └── Header.tsx
│   └── common/            # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ConfirmDialog.tsx
├── hooks/                 # Custom React hooks
│   ├── useTaskActions.ts  # CRUD operations that write to Dexie
│   └── useExportImport.ts # Export/import database helpers
├── lib/                   # Utilities
│   ├── cn.ts              # clsx + tailwind-merge helper
│   └── id.ts              # nanoid wrapper
├── App.tsx                # Root component with router
├── main.tsx               # Entry point
└── index.css              # Tailwind import + @theme customizations
```

### Pattern 1: Dexie Schema with Single Table Inheritance
**What:** All task types in one table, differentiated by `type` field and linked by `parentId`.
**When to use:** All task data storage in Phase 1.
**Example:**
```typescript
// Source: [CITED: dexie.org/docs/Tutorial/Design] + project architecture decisions
import { Dexie, type EntityTable } from 'dexie'

interface Task {
  id: string           // nanoid-generated
  type: 'simple' | 'category'  // Phase 1 types only; 'project' added in v2
  parentId: string | null       // null = top-level; string = subtask
  title: string
  description: string
  status: 'active' | 'completed' | 'archived'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string               // tag/category name
  sortOrder: number              // for drag-to-reorder
  createdAt: Date
  completedAt: Date | null
  archivedAt: Date | null
}

const db = new Dexie('DoNotNervousDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>
}

db.version(1).stores({
  tasks: 'id, parentId, type, status, category, sortOrder, createdAt, completedAt'
})
```
[VERIFIED: Dexie schema syntax confirmed via dexie.org/docs/Tutorial/Design]

### Pattern 2: useLiveQuery for Reactive Data Binding
**What:** Each component declares its data needs; Dexie auto-re-renders on changes.
**When to use:** Every component that reads task data.
**Example:**
```typescript
// Source: [CITED: dexie.org/docs/dexie-react-hooks/useLiveQuery()]
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

function TaskList() {
  const tasks = useLiveQuery(
    () => db.tasks
      .where('status').equals('active')
      .sortBy('sortOrder'),
    [], // deps
    []  // default value (empty array while loading)
  )

  // tasks auto-updates when any task is added/updated/deleted
}
```
Key rules from docs [CITED]:
- Do not call non-Dexie async APIs from the querier (or wrap with `Promise.resolve()`)
- `undefined` default means "still loading"; provide a default value for instant render
- Observation is fine-grained: only affected queries re-fire

### Pattern 3: Zustand for UI State Only
**What:** Zustand manages ephemeral UI state; Dexie manages all persistent data.
**When to use:** Active filters, selected task, modal open/close, sidebar collapse.
**Example:**
```typescript
// Source: [CITED: zustand.docs.pmnd.rs/getting-started/introduction]
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  selectedTaskId: string | null
  isTaskFormOpen: boolean
  activeCategory: string | null
  setSelectedTask: (id: string | null) => void
  setTaskFormOpen: (open: boolean) => void
  setActiveCategory: (category: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedTaskId: null,
      isTaskFormOpen: false,
      activeCategory: null,
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      setTaskFormOpen: (open) => set({ isTaskFormOpen: open }),
      setActiveCategory: (category) => set({ activeCategory: category }),
    }),
    { name: 'donotnervous-ui' } // localStorage key -- UI prefs only
  )
)
```

### Pattern 4: dexie-export-import for JSON Backup
**What:** Export entire IndexedDB to JSON blob; import from file to restore.
**When to use:** DATA-04 (export) and DATA-05 (import).
**Example:**
```typescript
// Source: [CITED: dexie.org/docs/ExportImport/dexie-export-import]
import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
import { db } from '../db'

// Export: trigger download of JSON backup
async function exportData() {
  const blob = await exportDB(db, {
    prettyJson: true,
    progressCallback: (progress) => {
      console.log(`Exported ${progress.completedRows}/${progress.totalRows} rows`)
      return true // continue
    }
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `donotnervous-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Import: restore from file
async function importData(file: File) {
  // Peek at metadata first (optional)
  const meta = await peakImportFile(file)
  console.log(`Importing ${meta.data.databaseName}, ${meta.data.tables.length} tables`)

  await importInto(db, file, {
    acceptNameDiff: true,
    acceptVersionDiff: true,
    clearTablesBeforeImport: true,
    overwriteValues: true,
    progressCallback: (progress) => {
      console.log(`Imported ${progress.completedRows}/${progress.totalRows} rows`)
      return true
    }
  })
}
```
[VERIFIED: API confirmed via dexie.org/docs/ExportImport/dexie-export-import. Compatible with Dexie 4.x]

### Pattern 5: Tailwind v4 CSS-First Configuration
**What:** No tailwind.config.js. Configuration lives in CSS via `@theme` directive.
**When to use:** All styling setup.
**Example:**
```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Custom color palette for anti-anxiety design */
  --color-calm-50: oklch(0.98 0.01 240);
  --color-calm-100: oklch(0.95 0.02 240);
  --color-calm-500: oklch(0.65 0.12 240);
  --color-warm-50: oklch(0.98 0.01 80);
  --color-warm-500: oklch(0.75 0.15 80);

  /* Custom spacing */
  --spacing: 0.25rem;
}
```
[VERIFIED: Tailwind v4 setup confirmed via tailwindcss.com/blog/tailwindcss-v4. Uses @tailwindcss/vite plugin, no PostCSS needed]

### Pattern 6: dnd-kit Sortable Task List
**What:** Drag-to-reorder tasks with dnd-kit, persisting sortOrder to Dexie.
**When to use:** TASK-06: task reordering.
**Example:**
```typescript
// Source: [CITED: dndkit.com/react/guides/sortable-state-management]
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTaskItem({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} />
    </div>
  )
}

function TaskList({ tasks }) {
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id)
      const newIndex = tasks.findIndex(t => t.id === over.id)
      const reordered = arrayMove(tasks, oldIndex, newIndex)
      // Persist new sort orders to Dexie
      await db.transaction('rw', db.tasks, async () => {
        for (let i = 0; i < reordered.length; i++) {
          await db.tasks.update(reordered[i].id, { sortOrder: i })
        }
      })
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => <SortableTaskItem key={task.id} task={task} />)}
      </SortableContext>
    </DndContext>
  )
}
```

### Anti-Patterns to Avoid
- **Zustand-persist-to-IndexedDB for task data:** Serializes entire store on every change. Cannot query. Violates web.dev IndexedDB best practices. [CITED: ARCHITECTURE.md Anti-Pattern 1]
- **Raw IndexedDB instead of Dexie:** Callback hell, browser inconsistencies, transaction lifecycle bugs especially on Safari. [CITED: PITFALLS.md Pitfall 3]
- **Separate tables per task level:** Makes cross-level queries complex, animation of flat lists requires merging sources. Single table with type discriminator is simpler. [CITED: ARCHITECTURE.md Anti-Pattern 4]
- **Computing task statistics on demand:** For future phases (summaries), pre-compute. For Phase 1, simple counts are fine since volume is low.
- **Treating useLiveQuery loading state as empty:** `undefined` means "loading", not "no data". Always provide a default value or handle `undefined` explicitly. [CITED: dexie.org docs]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB queries | Raw IndexedDB API | Dexie.js | Promise-based, typed, handles transactions, schema versioning, Safari quirks [VERIFIED: npm registry] |
| Reactive data binding | Manual useState + useEffect + refetch | useLiveQuery from dexie-react-hooks | Auto re-runs queries on data change, fine-grained observation [CITED: dexie.org docs] |
| JSON export/import | Custom JSON.stringify of table arrays | dexie-export-import | Handles exotic types (Date), streaming for large DBs, progress callbacks [CITED: dexie.org/docs/ExportImport] |
| Task IDs | UUID or auto-increment integer | nanoid | 130 bytes, URL-safe, no collision risk at our scale [VERIFIED: npm registry] |
| Input validation | Manual if/else checks | Zod schemas | Runtime type checking, composable, generates error messages [VERIFIED: npm registry] |
| CSS class composition | String concatenation | clsx + tailwind-merge | Handles conditionals correctly, resolves Tailwind class conflicts [VERIFIED: npm registry] |
| Drag and drop | Custom mouse/touch event handlers | @dnd-kit/core + @dnd-kit/sortable | Accessible, performant, handles touch + pointer + keyboard [VERIFIED: npm registry] |
| Date formatting | Manual string manipulation | date-fns | Tree-shakeable, immutable, handles edge cases [VERIFIED: npm registry] |

**Key insight:** Every item above has landmines in the browser ecosystem (Safari IndexedDB quirks, touch event inconsistencies, timezone edge cases). Using battle-tested libraries avoids entire categories of bugs.

## Common Pitfalls

### Pitfall 1: Safari ITP Silently Deletes IndexedDB After 7 Days
**What goes wrong:** Safari's Intelligent Tracking Prevention deletes all IndexedDB data for sites not interacted with for 7 days. [CITED: PITFALLS.md Pitfall 2]
**Why it happens:** Apple's anti-tracking policy affects all client-side storage indiscriminately.
**How to avoid:** Implement JSON export/import from day one (DATA-04, DATA-05). Call `navigator.storage.persist()` on first use. Show export prompt regularly.
**Warning signs:** User reports data loss after Safari updates or after not using the app for a week.

### Pitfall 2: IndexedDB Transaction Auto-Abort on Safari
**What goes wrong:** Safari aggressively auto-aborts transactions that aren't used within the same event loop tick. [CITED: PITFALLS.md Pitfall 3]
**Why it happens:** Safari interprets the IndexedDB spec more strictly than Chrome/Firefox.
**How to avoid:** Always use Dexie.js (it handles transaction lifecycle correctly). Never `await` between transaction creation and operations.
**Warning signs:** Writes silently failing on iOS/Safari; task completions not persisting.

### Pitfall 3: useLiveQuery Returns Undefined on First Render
**What goes wrong:** Components crash or show empty state because `useLiveQuery` returns `undefined` before the query resolves. [CITED: dexie.org docs]
**Why it happens:** The hook must execute the query asynchronously before it has data.
**How to avoid:** Always provide a `defaultResult` parameter: `useLiveQuery(() => ..., [], [])`. Or handle `undefined` explicitly with a loading guard.
**Warning signs:** Components showing "no tasks" flash on initial load; TypeError on `.map()` of undefined.

### Pitfall 4: Drag Reorder Losing Sort Order on Refresh
**What goes wrong:** Tasks reorder visually during drag but the new order is lost on page refresh.
**Why it happens:** The `sortOrder` field isn't updated in the database, or the query doesn't sort by `sortOrder`.
**How to avoid:** On every drag end, write the new sortOrder values to Dexie in a transaction. Always sort queries by `sortOrder`: `db.tasks.sortBy('sortOrder')`.
**Warning signs:** Tasks revert to original order after F5.

### Pitfall 5: First Screen Not Immediately Usable (Violates ONBD-01)
**What goes wrong:** User sees a loading spinner, empty state, or has to click "Add Task" before they can type. Takes more than 5 seconds to interact. [CITED: FEATURES.md onboarding research]
**Why it happens:** Over-engineered first-run experience, lazy-loaded critical components, waiting for full DB hydration.
**How to avoid:** Render the task input immediately. Use optimistic UI -- show the input field before Dexie finishes loading. `useLiveQuery` with default empty array prevents loading flash.
**Warning signs:** Measured time-to-interactive exceeds 5 seconds; loading spinner blocks the input.

### Pitfall 6: Storing Blobs in IndexedDB (Safari Null Bug)
**What goes wrong:** Safari returns `null` when retrieving Blob objects from IndexedDB. [CITED: PITFALLS.md Pitfall 10]
**Why it happens:** Long-standing WebKit bug with Blob serialization in IndexedDB.
**How to avoid:** Phase 1 doesn't store Blobs, but export/import blob handling goes through dexie-export-import which handles this correctly. If ever storing binary data, convert to ArrayBuffer first.
**Warning signs:** Export file downloads as empty on Safari.

## Code Examples

### Dexie Database Setup
```typescript
// Source: [CITED: dexie.org/docs/Tutorial/Design]
import { Dexie, type EntityTable } from 'dexie'

export type TaskType = 'simple' | 'category'
export type TaskStatus = 'active' | 'completed' | 'archived'
export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export interface Task {
  id: string
  type: TaskType
  parentId: string | null
  title: string
  description: string
  status: TaskStatus
  difficulty: TaskDifficulty
  category: string
  sortOrder: number
  createdAt: Date
  completedAt: Date | null
  archivedAt: Date | null
}

class DoNotNervousDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>

  constructor() {
    super('DoNotNervousDB')
    this.version(1).stores({
      tasks: 'id, parentId, type, status, category, sortOrder, createdAt, completedAt'
    })
  }
}

export const db = new DoNotNervousDB()
```

### Task Validation with Zod
```typescript
// Source: [VERIFIED: npm registry zod@4.3.6]
import { z } from 'zod'

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().max(1000).optional().default(''),
  type: z.enum(['simple', 'category']).default('simple'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  category: z.string().max(50).optional().default(''),
  parentId: z.string().nullable().optional(),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
```

### Task CRUD Actions (Hook Pattern)
```typescript
// Pure action functions that write to Dexie
import { db } from '../db'
import { nanoid } from 'nanoid'
import { taskCreateSchema } from '../domain/task'
import type { Task, TaskStatus } from '../db'

export async function createTask(input: unknown): Promise<Task> {
  const validated = taskCreateSchema.parse(input)
  const task: Task = {
    id: nanoid(),
    ...validated,
    parentId: validated.parentId ?? null,
    status: 'active',
    sortOrder: await db.tasks.where('status').equals('active').count(),
    createdAt: new Date(),
    completedAt: null,
    archivedAt: null,
  }
  await db.tasks.add(task)
  return task
}

export async function completeTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'completed',
    completedAt: new Date(),
  })
}

export async function uncompleteTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'active',
    completedAt: null,
  })
}

export async function archiveTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'archived',
    archivedAt: new Date(),
  })
}

export async function deleteTask(id: string): Promise<void> {
  // Also delete all subtasks
  await db.transaction('rw', db.tasks, async () => {
    await db.tasks.where('parentId').equals(id).delete()
    await db.tasks.delete(id)
  })
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await db.tasks.update(id, updates)
}
```

### Motion Task Completion Animation
```typescript
// Source: [ASSUMED] Standard Motion AnimatePresence pattern
import { motion, AnimatePresence } from 'framer-motion'

function TaskItem({ task, onComplete }) {
  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <button
          onClick={() => onComplete(task.id)}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={task.status === 'completed' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {/* Checkbox */}
          </motion.div>
          <span className={task.status === 'completed' ? 'line-through opacity-60' : ''}>
            {task.title}
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
```

### Vite Configuration with Tailwind v4
```typescript
// Source: [CITED: tailwindcss.com/blog/tailwindcss-v4]
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | @theme directive in CSS | Tailwind v4 (Jan 2025) | No JS config file needed, CSS-first configuration |
| @tailwind base/components/utilities | @import "tailwindcss" | Tailwind v4 | Single import, zero config |
| PostCSS plugin for Tailwind | @tailwindcss/vite plugin | Tailwind v4 | Better Vite integration, faster builds |
| content array config | Auto content detection | Tailwind v4 | No need to specify template paths |
| @dnd-kit/core + @dnd-kit/sortable (classic API) | @dnd-kit/react (new API) | 2025 | Cleaner hooks API, but pre-1.0 |
| Framer Motion | Motion (rebrand) | v11+ | Package name on npm remains `framer-motion` |

**Deprecated/outdated:**
- `tailwind.config.js`: Replaced by CSS @theme directive in Tailwind v4
- `@tailwind` directives in CSS: Replaced by `@import "tailwindcss"` in Tailwind v4
- `react-beautiful-dnd`: Abandoned by Atlassian. Use @dnd-kit instead.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@dnd-kit/core` + `@dnd-kit/sortable` is the correct stable choice (not `@dnd-kit/react`) | Standard Stack | If @dnd-kit/react becomes standard quickly, may need migration; low risk since API concepts transfer |
| A2 | Motion completion animation pattern (AnimatePresence + spring) is the right approach for checkmark | Code Examples | Design iteration may require different animation approach; easily swappable |
| A3 | `dexie-export-import` v4.4.0 is compatible with Dexie 4.4.2 | Standard Stack | Compatibility confirmed via docs ("dexie ^2.0.4, ^3.x, ^4.x") but specific patch combo not tested |
| A4 | React Router 7 in SPA mode does not require framework mode configuration | Standard Stack | May need react-router config adjustment if SPA mode has specific requirements |
| A5 | Zod v4 API is compatible with the schemas shown in code examples | Code Examples | Zod v4 (4.3.6) may have breaking changes from v3; syntax shown may need adjustment |

## Open Questions (RESOLVED)

1. **@dnd-kit API choice: classic vs new**
   - RESOLVED: Use classic @dnd-kit/core + @dnd-kit/sortable. Confirmed in plan (Plan 03 Step 1-2).
   - What we know: `@dnd-kit/react` (v0.4.0) is the newer API with cleaner hooks. `@dnd-kit/core` + `@dnd-kit/sortable` is stable and well-documented. Official docs now reference the new API.
   - What's unclear: Whether @dnd-kit/react will have breaking changes before 1.0.
   - Recommendation: Use the classic `@dnd-kit/core` + `@dnd-kit/sortable` for Phase 1 stability. The new API is an option for later phases.

2. **Multi-view routing in Phase 1**
   - RESOLVED: No React Router in Phase 1. Single-view app with settings drawer. Confirmed in Plan 01 Step 2 note.
   - What we know: ONBD-01 says first screen is task input. The app needs at least export/import UI somewhere.
   - What's unclear: Whether Phase 1 needs React Router at all, or if it's a single-page view with a settings drawer.
   - Recommendation: Include React Router in setup but keep Phase 1 as a single main view with a drawer/modal for settings/export. Router becomes essential in later phases.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build system | ✓ | -- | -- |
| npm | Package manager | ✓ | -- | -- |
| Vite 8 | Dev server + build | -- (will install) | 8.0.10 | -- |
| TypeScript 6 | Type checking | -- (will install) | 6.0.3 | -- |

**Missing dependencies with no fallback:**
- None -- all dependencies are npm packages installed during project setup.

**Missing dependencies with fallback:**
- None -- this is a greenfield project with no external runtime dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | vitest.config.ts (to be created in Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TASK-01 | Create task with title and optional description | unit | `npx vitest run src/domain/__tests__/task.test.ts` | Wave 0 |
| TASK-01 | Task persists in IndexedDB after creation | integration | `npx vitest run src/db/__tests__/task-crud.test.ts` | Wave 0 |
| TASK-02 | Complete task shows visual feedback | unit | `npx vitest run src/components/tasks/__tests__/TaskItem.test.tsx` | Wave 0 |
| TASK-03 | Edit and delete tasks | integration | `npx vitest run src/db/__tests__/task-crud.test.ts` | Wave 0 |
| TASK-04 | Organize tasks with categories | unit | `npx vitest run src/domain/__tests__/task.test.ts` | Wave 0 |
| TASK-05 | Create subtasks under a task | integration | `npx vitest run src/db/__tests__/task-hierarchy.test.ts` | Wave 0 |
| TASK-06 | Reorder tasks via drag and drop | unit | `npx vitest run src/components/tasks/__tests__/TaskList.test.tsx` | Wave 0 |
| TASK-07 | Assign difficulty level | unit | `npx vitest run src/domain/__tests__/task.test.ts` | Wave 0 |
| TASK-08 | Archive completed tasks | integration | `npx vitest run src/db/__tests__/task-crud.test.ts` | Wave 0 |
| DATA-01 | Data stored in IndexedDB via Dexie.js | integration | `npx vitest run src/db/__tests__/database.test.ts` | Wave 0 |
| DATA-03 | Data persists across page refreshes | integration | `npx vitest run src/db/__tests__/database.test.ts` | Wave 0 |
| DATA-04 | Export data as JSON | unit | `npx vitest run src/hooks/__tests__/useExportImport.test.ts` | Wave 0 |
| DATA-05 | Import data from JSON backup | unit | `npx vitest run src/hooks/__tests__/useExportImport.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with happy-dom environment
- [ ] `src/domain/__tests__/task.test.ts` -- covers TASK-01, TASK-04, TASK-07 (Zod validation)
- [ ] `src/db/__tests__/task-crud.test.ts` -- covers TASK-01, TASK-03, TASK-08 (Dexie CRUD)
- [ ] `src/db/__tests__/task-hierarchy.test.ts` -- covers TASK-05 (subtask parent-child)
- [ ] `src/db/__tests__/database.test.ts` -- covers DATA-01, DATA-03 (persistence)
- [ ] `src/hooks/__tests__/useExportImport.test.ts` -- covers DATA-04, DATA-05
- [ ] `src/components/tasks/__tests__/TaskItem.test.tsx` -- covers TASK-02 (completion UI)
- [ ] `src/components/tasks/__tests__/TaskList.test.tsx` -- covers TASK-06 (reorder)
- [ ] Note: IndexedDB testing in Vitest requires `fake-indexeddb` polyfill or `happy-dom` with Dexie support

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth required (DATA-02) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Single-user local app |
| V5 Input Validation | yes | Zod schemas for all user input (task title, description, category) |
| V6 Cryptography | no | No encryption needed for local-only data |

### Known Threat Patterns for Local-First Task App

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via task title/description | Tampering | Zod validation (max length, no HTML), React auto-escaping |
| IndexedDB data corruption | Tampering | Dexie transactions for atomic writes |
| Import of malicious JSON file | Tampering | dexie-export-import handles parsing; validate imported data shape |
| Storage quota exceeded | Denial of Service | Monitor via navigator.storage.estimate() |

## Sources

### Primary (HIGH confidence)
- [CITED: dexie.org/docs/Tutorial/Design] -- Dexie schema definition, versioning, transactions
- [CITED: dexie.org/docs/dexie-react-hooks/useLiveQuery()] -- useLiveQuery hook API, rules, limitations
- [CITED: dexie.org/docs/ExportImport/dexie-export-import] -- exportDB, importInto, peakImportFile API
- [CITED: zustand.docs.pmnd.rs/getting-started/introduction] -- Zustand v5 store creation API
- [CITED: tailwindcss.com/blog/tailwindcss-v4] -- Tailwind v4 CSS-first config, @tailwindcss/vite plugin
- [CITED: dndkit.com/react/guides/sortable-state-management] -- dnd-kit sortable API, optimistic sorting
- [VERIFIED: npm registry] -- All package versions confirmed 2026-04-29

### Secondary (MEDIUM confidence)
- [CITED: ARCHITECTURE.md] -- Project architecture decisions, anti-patterns, component boundaries
- [CITED: PITFALLS.md] -- Safari ITP, transaction auto-abort, Blob null bug, schema migration
- [CITED: STACK.md] -- Technology stack research, version justifications
- [CITED: FEATURES.md] -- Feature landscape, anti-anxiety design principles, competitor analysis

### Tertiary (LOW confidence)
- [ASSUMED] Motion animation patterns -- Standard framer-motion patterns from training data
- [ASSUMED] React Router 7 SPA mode setup -- Not verified via docs in this session

## Project Constraints (from CLAUDE.md / user rules)

These constraints from the user's global rules apply to Phase 1 implementation:

1. **Immutability (CRITICAL):** Always create new objects, never mutate. Use spread operators for updates.
2. **File Organization:** Many small files (200-400 lines typical, 800 max). Organize by feature/domain, not by type.
3. **Error Handling:** Handle errors comprehensively at every level. Never silently swallow errors.
4. **Input Validation:** Validate all user input before processing. Use Zod for schema-based validation.
5. **Minimum 80% test coverage** with TDD approach (unit, integration, E2E).
6. **No console.log** in committed code.
7. **Commit message format:** `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against npm registry, all APIs confirmed via official docs
- Architecture: HIGH - Patterns well-established in project research (ARCHITECTURE.md, STACK.md, PITFALLS.md)
- Pitfalls: HIGH - Safari/IndexedDB pitfalls verified via web.dev, WebKit bug tracker, Dexie docs
- dnd-kit: MEDIUM - Classic API is stable; newer @dnd-kit/react is pre-1.0 with limited production history
- Tailwind v4: HIGH - Official docs and blog post confirmed setup patterns

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days -- stable libraries, low churn expected)

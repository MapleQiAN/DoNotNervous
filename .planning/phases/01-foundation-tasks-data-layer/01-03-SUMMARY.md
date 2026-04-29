---
phase: 01-foundation-tasks-data-layer
plan: 03
subsystem: ui
tags: [dnd-kit, drag-reorder, dexie-export-import, settings-drawer, toast, framer-motion, vitest]

# Dependency graph
requires:
  - phase: 01-foundation-tasks-data-layer/01-02
    provides: "TaskList, TaskItem, Toast component, useUIStore, db instance, CRUD actions"
provides:
  - "dnd-kit drag-and-drop task reorder with sortOrder persistence in Dexie transaction"
  - "JSON export/import via dexie-export-import for data backup"
  - "SettingsDrawer slide-over panel with export/import controls"
  - "useToast hook with auto-dismiss and timer cleanup"
  - "Export/import unit tests (4 tests)"
  - "Task hierarchy integration tests (6 tests)"
affects:
  - "src/components/tasks/TaskList.tsx (DndContext + SortableContext wrapping)"
  - "src/App.tsx (SettingsDrawer + Toast wiring)"
  - "src/components/tasks/TaskItemSortable.tsx (new sortable wrapper)"

# Tech tracking
tech-stack:
  added:
    - "@dnd-kit/core 6.3.1 (DndContext, closestCenter, DragEndEvent)"
    - "@dnd-kit/sortable 10.0.0 (SortableContext, verticalListSortingStrategy, useSortable, arrayMove)"
    - "@dnd-kit/utilities 3.2.2 (CSS.Transform)"
    - "dexie-export-import 4.4.0 (exportDB, importInto, peakImportFile)"
  patterns:
    - "SortableContext wrapping only active tasks (completed tasks not draggable)"
    - "Drag handle separated from row content (listeners on grip handle only)"
    - "sortOrder persisted in Dexie rw transaction on every drag end"
    - "Single Toast instance at App root with showToast callback prop"
    - "useToast hook with useRef timer for cleanup on rapid calls"

key-files:
  created:
    - "src/components/tasks/TaskItemSortable.tsx - dnd-kit sortable wrapper with grip handle"
    - "src/hooks/useExportImport.ts - exportData (blob download) and importData (file restore)"
    - "src/hooks/useToast.ts - toast state hook with 3s auto-dismiss"
    - "src/components/layout/SettingsDrawer.tsx - slide-over settings with export/import"
    - "src/hooks/__tests__/useExportImport.test.ts - 4 export/import unit tests"
    - "src/db/__tests__/task-hierarchy.test.ts - 6 parent-child hierarchy integration tests"
  modified:
    - "src/components/tasks/TaskList.tsx - added DndContext + SortableContext + handleDragEnd"
    - "src/App.tsx - wired SettingsDrawer + Toast via useToast"

key-decisions:
  - "Drag handle uses GripVertical icon with listeners/attributes on handle only, not entire row"
  - "useToast uses useRef for timer instead of useState to prevent stale closure on rapid calls"
  - "SettingsDrawer receives showToast as callback prop from App.tsx (single toast instance pattern)"
  - "Completed tasks are NOT sortable -- only active tasks wrapped in DndContext"

patterns-established:
  - "Drag reorder: DndContext > SortableContext > TaskItemSortable > TaskItem"
  - "sortOrder transaction: db.transaction('rw', db.tasks, ...) on drag end"
  - "Export download: exportDB > createObjectURL > anchor click > revokeObjectURL"
  - "Import validation: peakImportFile > check databaseName > importInto with clearTablesBeforeImport"

requirements-completed: [TASK-06, DATA-04, DATA-05, TASK-05, TASK-08]

# Metrics
duration: 5min
completed: 2026-04-29
---

# Phase 1 Plan 03: Drag Reorder, Export/Import & Settings Drawer Summary

**dnd-kit drag reorder with Dexie sortOrder transaction, JSON export/import via dexie-export-import, settings drawer with slide-over panel, and useToast hook with 10 new tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-29T11:26:49Z
- **Completed:** 2026-04-29T11:31:32Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 2 modified, 2 test files created)

## Accomplishments
- Drag-and-drop task reorder using dnd-kit with sortOrder persisted in Dexie transaction
- JSON export/import backup system using dexie-export-import with file validation
- Settings drawer slides in from right with export/import controls and anti-anxiety copywriting
- useToast hook manages toast state with timer cleanup for rapid call safety
- 10 new tests: 4 export/import unit + 6 hierarchy integration

## Task Commits

Each task was committed atomically:

1. **Task 1a: dnd-kit drag reorder + useExportImport hook + useToast hook** - `06d50e4` (feat)
2. **Task 1b: SettingsDrawer + wire Toast + tests** - `eca6a06` (feat)

## Files Created/Modified
- `src/components/tasks/TaskItemSortable.tsx` - Sortable wrapper with GripVertical drag handle, isDragging visual feedback
- `src/hooks/useExportImport.ts` - exportData creates blob download, importData validates via peakImportFile
- `src/hooks/useToast.ts` - useState + useRef timer for auto-dismiss with cleanup
- `src/components/layout/SettingsDrawer.tsx` - Slide-over drawer with Data section, export/import buttons, hidden file input
- `src/components/tasks/TaskList.tsx` - Added DndContext + SortableContext wrapping active tasks, handleDragEnd with Dexie transaction
- `src/App.tsx` - Wired SettingsDrawer + Toast via useToast hook at root level
- `src/hooks/__tests__/useExportImport.test.ts` - 4 tests: blob download, valid import, invalid file, empty metadata
- `src/db/__tests__/task-hierarchy.test.ts` - 6 tests: subtask creation, parent-child query, cascading delete, independent status, top-level filter, independent sortOrder

## Decisions Made
- Drag listeners placed on GripVertical handle only, not the entire row, so checkbox/edit/delete interactions remain functional
- useToast uses useRef for the timer reference to properly clean up on rapid successive calls (avoiding stale setTimeout)
- Single Toast instance rendered at App.tsx root, showToast passed as callback prop to SettingsDrawer
- Completed tasks remain non-sortable (only active tasks wrapped in SortableContext)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 1 Foundation complete: scaffold, data layer, task management UI, drag reorder, export/import, settings drawer
- All 47 tests passing, build succeeds
- Ready for Phase 2: Gamification Core (points, streaks, rewards)

## Self-Check: PASSED

- 6 new source files verified present
- 2 task commits verified in git log (06d50e4, eca6a06)
- 47 tests passing
- Vite build succeeds

---
*Phase: 01-foundation-tasks-data-layer*
*Completed: 2026-04-29*

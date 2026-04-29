---
phase: 1
slug: foundation-tasks-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | vitest.config.ts (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | TASK-01 | T-1-05 | Zod validates title (max 200 chars, no HTML) | unit | `npx vitest run src/domain/__tests__/task.test.ts` | W0 | pending |
| 01-01-02 | 01 | 1 | TASK-01 | — | Task persists in IndexedDB via Dexie | integration | `npx vitest run src/db/__tests__/task-crud.test.ts` | W0 | pending |
| 01-02-01 | 02 | 1 | TASK-02 | — | Completion triggers visual feedback | unit | `npx vitest run src/components/tasks/__tests__/TaskItem.test.tsx` | W0 | pending |
| 01-03-01 | 02 | 1 | TASK-03 | — | Edit and delete tasks via Dexie | integration | `npx vitest run src/db/__tests__/task-crud.test.ts` | W0 | pending |
| 01-04-01 | 02 | 1 | TASK-04 | — | Category tag validation | unit | `npx vitest run src/domain/__tests__/task.test.ts` | W0 | pending |
| 01-05-01 | 03 | 2 | TASK-05 | — | Subtask parent-child hierarchy | integration | `npx vitest run src/db/__tests__/task-hierarchy.test.ts` | W0 | pending |
| 01-06-01 | 03 | 2 | TASK-06 | — | Drag-and-drop reorder | unit | `npx vitest run src/components/tasks/__tests__/TaskList.test.tsx` | W0 | pending |
| 01-07-01 | 02 | 1 | TASK-07 | — | Difficulty level enum validation | unit | `npx vitest run src/domain/__tests__/task.test.ts` | W0 | pending |
| 01-08-01 | 03 | 2 | TASK-08 | — | Archive completed tasks | integration | `npx vitest run src/db/__tests__/task-crud.test.ts` | W0 | pending |
| 01-09-01 | 01 | 1 | DATA-01 | — | Dexie.js schema + IndexedDB storage | integration | `npx vitest run src/db/__tests__/database.test.ts` | W0 | pending |
| 01-09-02 | 01 | 1 | DATA-03 | — | Data survives page refresh (fake-indexeddb) | integration | `npx vitest run src/db/__tests__/database.test.ts` | W0 | pending |
| 01-10-01 | 03 | 2 | DATA-04 | T-1-03 | JSON export via dexie-export-import | unit | `npx vitest run src/hooks/__tests__/useExportImport.test.ts` | W0 | pending |
| 01-10-02 | 03 | 2 | DATA-05 | T-1-03 | JSON import validates data shape | unit | `npx vitest run src/hooks/__tests__/useExportImport.test.ts` | W0 | pending |

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest config with happy-dom environment
- [ ] `src/domain/__tests__/task.test.ts` — TASK-01, TASK-04, TASK-07 (Zod validation)
- [ ] `src/db/__tests__/task-crud.test.ts` — TASK-01, TASK-03, TASK-08 (Dexie CRUD)
- [ ] `src/db/__tests__/task-hierarchy.test.ts` — TASK-05 (subtask parent-child)
- [ ] `src/db/__tests__/database.test.ts` — DATA-01, DATA-03 (persistence)
- [ ] `src/hooks/__tests__/useExportImport.test.ts` — DATA-04, DATA-05
- [ ] `src/components/tasks/__tests__/TaskItem.test.tsx` — TASK-02 (completion UI)
- [ ] `src/components/tasks/__tests__/TaskList.test.tsx` — TASK-06 (reorder)
- [ ] Note: IndexedDB testing requires `fake-indexeddb` polyfill or `happy-dom` with Dexie support

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Add task → see in list < 5 seconds | ONBD-01 | Requires browser runtime timing | Open app, add task, verify appears < 5s |
| First screen is task input | ONBD-01 | Visual layout check | Load app, verify task input is primary UI |
| Works on mobile browsers | DATA-06 | Responsive layout requires device testing | Test on mobile viewport, verify touch interactions |
| Progressive feature discovery | ONBD-02 | UX judgment call | Verify no setup wizard, features discoverable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

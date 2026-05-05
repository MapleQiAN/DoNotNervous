---
phase: 09-advanced-streaks
plan: 02
status: complete
started: 2026-05-06
completed: 2026-05-06
---

## Plan 09-02: Hook Integration Layer

Wired earn-back auto-recovery into completeTask and implemented streak calendar reactive hook.

### Key Changes
- Auto-earn-back fires non-blocking after completeTask's milestone check
- `useEarnBackOpportunity()` — reactive hook returning EarnBackOpportunity | null
- `useStreakCalendarMonth(year, month)` — returns 42-day StreakCalendarDay grid
- `StreakDayState` type: 'active' | 'frozen' | 'recovered' | 'missed' | 'empty' | 'future'
- `StreakCalendarDay` interface with date, dayKey, isCurrentMonth, isToday, state, taskCount
- Fixed detectEarnBackOpportunity to query pre-today records (works after task completion)

### Key Files
- `src/hooks/useStreaks.ts` — useEarnBackOpportunity, useStreakCalendarMonth, types
- `src/hooks/useTaskActions.ts` — auto-recovery wired in completeTask
- `src/hooks/__tests__/useStreaks.test.ts` — earn-back integration + streak computation tests

### Self-Check: PASSED
- 45 tests pass across domain + hooks
- TypeScript compiles cleanly

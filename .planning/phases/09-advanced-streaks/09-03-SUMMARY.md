---
phase: 09-advanced-streaks
plan: 03
status: complete
started: 2026-05-06
completed: 2026-05-06
---

## Plan 09-03: UI Layer — Streak Calendar + Recovery Banner

Built the user-facing layer: StreakCalendar component, recovery banner in StreakDisplay, AppShell modal integration.

### Key Changes
- StreakDisplay shows amber "Streak can be recovered!" banner when opportunity exists
- StreakDisplay streak badge is clickable (opens calendar)
- StreakCalendar: monthly grid, 6 day states, month navigation, positive stats row
- Calendar modal in AppShell with AnimatePresence transitions
- `showStreakCalendar` state in uiStore
- Anti-anxiety design: warm colors, no red/warning indicators, positive framing ("X / Y 天活跃！")

### Key Files
- `src/components/gamification/StreakDisplay.tsx` — enhanced with recovery banner + onCalendarOpen
- `src/components/gamification/StreakCalendar.tsx` — new calendar component
- `src/components/layout/AppShell.tsx` — calendar modal wiring
- `src/stores/uiStore.ts` — showStreakCalendar state

### Self-Check: PASSED
- 200 tests pass (full suite)
- TypeScript compiles cleanly
- Human verification: APPROVED

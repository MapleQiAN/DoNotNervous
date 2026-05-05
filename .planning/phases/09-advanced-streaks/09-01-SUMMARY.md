---
phase: 09-advanced-streaks
plan: 01
status: complete
started: 2026-05-06
completed: 2026-05-06
---

## Plan 09-01: Earn-back Data Layer

Extended StreakRecord with recovery fields, added Dexie v5 migration, implemented earn-back detection and recovery domain functions.

### Key Changes
- Added `recoveredFrom?: boolean` and `recoveryTaskId?: string | null` to StreakRecord
- Dexie v5 schema with upgrade callback backfilling existing records
- `detectEarnBackOpportunity(now)` — finds recoverable gap within 24h window, excludes pre-today records
- `applyEarnBackRecovery(taskId, gapDayKey)` — creates recovery record, idempotent guard
- `EARN_BACK_WINDOW_HOURS = 24` constant and `EarnBackOpportunity` type

### Key Files
- `src/domain/types.ts` — StreakRecord extended
- `src/db/index.ts` — version(5) migration
- `src/domain/streaks.ts` — detectEarnBackOpportunity, applyEarnBackRecovery
- `src/domain/__tests__/streaks.test.ts` — 8 new tests
- `src/db/__tests__/database.test.ts` — 2 new tests

### Self-Check: PASSED
- All 10 new tests pass
- TypeScript compiles cleanly
- No existing tests broken

# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-05-08T16:06:56.824Z
> Files: 51 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `fix_weekly.py` (~2375 tok)

## .claude/


## .claude/rules/


## .planning/


## .planning/phases/01-foundation-tasks-data-layer/


## .planning/phases/02-gamification-core-points-streaks/


## .planning/phases/03-mood-rewards/


## .planning/phases/04-mascot-animations/


## .planning/phases/05-summaries/


## .planning/phases/06-mount-gamification-ui/


## .planning/phases/08-codebase-cleanup/


## .planning/phases/09-advanced-streaks/


## .planning/research/


## C:/Users/SerendyLin/.claude/plans/

- `lovely-shimmying-brook.md` — Plan: Complete Auth Flow (~728 tok)
- `typed-hugging-crystal.md` — Plan: 前端 Dexie → 后端 API 迁移 (~1038 tok)

## docs/plans/


## public/animations/


## server/


## server/drizzle/


## server/src/


## server/src/db/


## server/src/domain/

- `points.ts` — Exports POINT_VALUES, STREAK_TIERS, calculateMultiplier, calculatePoints (~234 tok)
- `streaks.ts` — Exports computeCurrentStreak (~291 tok)
- `summary.ts` — Exports computeAndStoreDailySummary, computeAndStoreWeeklySummary (~1818 tok)

## server/src/domain/__tests__/


## server/src/middleware/


## server/src/routes/

- `auth.ts` — API routes: POST, GET (4 endpoints) (~795 tok)
- `mood.ts` — API routes: GET, POST, PATCH, DELETE (12 endpoints) (~923 tok)
- `points.ts` — API routes: GET (6 endpoints) (~662 tok)
- `rewards.ts` — API routes: GET, POST, PATCH, DELETE (12 endpoints) (~1076 tok)
- `streaks.ts` — API routes: GET, PUT, DELETE (10 endpoints) (~834 tok)
- `summaries.ts` — API routes: GET (8 endpoints) (~580 tok)
- `tasks.ts` — API routes: GET, POST, PATCH, DELETE (14 endpoints) (~2033 tok)

## server/src/routes/__tests__/


## src/

- `App.tsx` — fadeUp (~781 tok)
- `index.css` — Styles: 6 rules, 29 vars (~26833 tok)

## src/components/__tests__/

- `smoke.test.tsx` — variants (~1330 tok)

## src/components/auth/

- `AuthGuard.tsx` — AuthGuard (~204 tok)
- `LoginPage.tsx` — LoginPage — renders form (~1267 tok)

## src/components/auth/__tests__/


## src/components/common/


## src/components/gamification/


## src/components/gamification/__tests__/


## src/components/home/

- `HomePage.tsx` — taskTagMap — renders form (~3463 tok)

## src/components/layout/

- `AppShell.tsx` — subtitles (~1065 tok)
- `Header.tsx` — navItems (~987 tok)
- `SettingsDrawer.tsx` — exportData (~1434 tok)

## src/components/mascot/

- `Mascot.tsx` — SPEECH_MESSAGES (~814 tok)

## src/components/mood/

- `MoodCalendar.tsx` — MoodCalendar (~2903 tok)

## src/components/rewards/

- `RewardCard.tsx` — categoryTone (~697 tok)
- `rewardIcons.ts` — Exports rewardIconKeys, RewardIconKey, rewardIconLabel, getRewardIconSrc, incomeTypeIcon (~179 tok)
- `RewardShop.tsx` — categories (~3646 tok)

## src/components/summary/

- `DailySummary.tsx` — MOOD_DESC (~6998 tok)
- `WeeklySummary.tsx` — DAY_LABELS (~8492 tok)

## src/components/tasks/

- `CategoryFilter.tsx` — CategoryFilter (~348 tok)
- `SubtaskList.tsx` — SubtaskList (~877 tok)
- `TaskDetailPanel.tsx` — fallbackDetail (~1316 tok)
- `TaskList.tsx` — difficultyLabel — renders form (~2762 tok)

## src/components/tasks/__tests__/


## src/db/

- `index.ts` — Exports db (~542 tok)

## src/db/__tests__/


## src/domain/

- `reward.ts` — Zod schemas: rewardCreateSchema, rewardEditSchema (~200 tok)
- `summary.ts` — Exports MOOD_SCORE, getWeekRange (~153 tok)
- `types.ts` — Exports TaskType, TaskStatus, TaskDifficulty, Task + 10 more (~775 tok)

## src/domain/__tests__/


## src/hooks/

- `useAuth.ts` — Exports useInitAuth (~292 tok)
- `useMoodEntries.ts` — Exports useMoodEntries, useMoodEntriesForTask, useMoodEntriesForDate, useCreateMoodEntry, createMood (~714 tok)
- `usePoints.ts` — Exports usePointBalance, usePointLedgerForDate, useRecentTransactions (~358 tok)
- `useRewards.ts` — API routes: PATCH (1 endpoints) (~1034 tok)
- `useStreaks.ts` — Exports useCurrentStreak, useStreakFreezes, useEarnBackOpportunity, StreakDayState + 5 more (~1360 tok)
- `useSummary.ts` — API routes: GET (2 endpoints) (~711 tok)
- `useTaskActions.ts` — API routes: PATCH, POST (5 endpoints) (~1560 tok)
- `useTaskCount.ts` — Exports useTaskCount (~128 tok)
- `useTaskQueries.ts` — Exports useActiveTasks, useCompletedTasksForDate, useCompletedTasksForWeek, useSubtasks + 2 more (~774 tok)

## src/hooks/__tests__/


## src/lib/

- `api.ts` — Exports api (~816 tok)
- `queryClient.ts` — Exports queryClient (~72 tok)
- `queryKeys.ts` — Exports taskKeys, pointKeys, streakKeys, moodKeys + 2 more (~512 tok)

## src/stores/

- `authStore.ts` — Exports useAuthStore (~473 tok)
- `uiStore.ts` — Exports useUIStore (~371 tok)

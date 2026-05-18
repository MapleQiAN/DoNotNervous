# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-05-12T03:42:19.101Z
> Files: 56 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `docker-compose.yml` — Docker Compose services (~308 tok)
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

## docs/ios/

- `figma-design-spec.md` — iOS v1 Figma frames, tokens, components, copy rules, implementation mapping (~1550 tok)
- `native-ios-implementation.md` — Native iOS backend/iOS scope and environment notes (~330 tok)


## public/animations/


## server/


## server/drizzle/

- `0001_reward_icon.sql` — Adds persisted reward icon column for reward customization (~20 tok)

## server/src/

- `index.ts` — API routes: GET (1 endpoints) (~360 tok)

## server/src/db/


## server/src/domain/

- `companion.ts` — Companion level/experience helpers and profile upsert/award functions (~520 tok)
- `points.ts` — Exports POINT_VALUES, STREAK_TIERS, calculateMultiplier, calculatePoints (~234 tok)
- `streaks.ts` — Exports computeCurrentStreak (~291 tok)
- `summary.ts` — Exports computeAndStoreDailySummary, computeAndStoreWeeklySummary (~1818 tok)

## server/src/domain/__tests__/


## server/src/middleware/


## server/src/routes/

- `auth.ts` — API routes: POST, GET (4 endpoints) (~795 tok)
- `companion.ts` — API routes for companion profile, experience, cosmetics, reminders, sync state (~2500 tok)
- `mood.ts` — API routes: GET, POST, PATCH, DELETE (12 endpoints) (~923 tok)
- `points.ts` — API routes: GET (6 endpoints) (~662 tok)
- `rewards.ts` — API routes: GET, POST, PATCH, DELETE (12 endpoints) (~1076 tok)
- `streaks.ts` — API routes: GET, PUT, DELETE (10 endpoints) (~834 tok)
- `summaries.ts` — API routes: GET (8 endpoints) (~580 tok)
- `tasks.ts` — API routes: GET, POST, PATCH, DELETE (14 endpoints) (~2033 tok)

## server/src/routes/__tests__/


## src/

- `App.tsx` — fadeUp (~781 tok)
- `index.css` — Styles: 6 rules, 29 vars (~27650 tok)

## src/components/__tests__/

- `smoke.test.tsx` — variants (~1330 tok)

## src/components/auth/

- `AuthGuard.tsx` — AuthGuard (~204 tok)
- `LoginPage.tsx` — LoginPage — renders form (~1267 tok)

## src/components/auth/__tests__/


## src/components/common/


## src/components/gamification/

- `StreakDisplay.tsx` — StreakDisplay (~386 tok)
- `TransactionPopover.tsx` — TransactionPopover (~730 tok)

## src/components/gamification/__tests__/


## src/components/home/

- `HomePage.tsx` — taskTagMap — renders form (~3466 tok)

## src/components/layout/

- `AppShell.tsx` — subtitles (~1172 tok)
- `Header.tsx` — navItems (~967 tok)
- `SettingsDrawer.tsx` — SettingsDrawer (~1267 tok)

## src/components/mascot/

- `Mascot.tsx` — SPEECH_MESSAGES (~814 tok)

## src/components/mood/

- `MoodCalendar.tsx` — MoodCalendar (~2940 tok)
- `MoodPicker.tsx` — moodLabels (~1403 tok)

## src/components/rewards/

- `RewardCard.tsx` — categoryTone (~697 tok)
- `rewardIcons.ts` — Exports rewardIconKeys, RewardIconKey, rewardIconLabel, getRewardIconSrc, incomeTypeIcon (~179 tok)
- `RewardShop.tsx` — categories (~3991 tok)

## src/components/summary/

- `DailySummary.tsx` — MOOD_DESC (~6998 tok)
- `WeeklySummary.tsx` — DAY_LABELS (~8492 tok)

## src/components/tasks/

- `CategoryFilter.tsx` — CategoryFilter (~348 tok)
- `SubtaskList.tsx` — SubtaskList (~877 tok)
- `TaskDetailPanel.tsx` — moods (~1581 tok)
- `TaskList.tsx` — difficultyLabel — renders form (~4858 tok)

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

## ios/

- `README.md` — Import and environment notes for native iOS scaffold (~190 tok)
- `Package.swift` — Swift package wrapper for shared iOS source and tests (~120 tok)

## ios/DoNotNervous/App/

- `DoNotNervousApp.swift` — SwiftUI app entry and SwiftData model container (~170 tok)

## ios/DoNotNervous/Models/

- `DNNModels.swift` — SwiftData models and enums for tasks, points, mood, rewards, companion, cosmetics, reminders, sync state (~2500 tok)

## ios/DoNotNervous/Services/

- `APIClient.swift` — URLSession API wrapper and generic JSONValue sync response decoding (~760 tok)
- `AuthService.swift` — Optional login/register using backend auth and Keychain token persistence (~520 tok)
- `GameEconomy.swift` — Points, companion experience, level math, local complete/log mood actions (~820 tok)
- `KeychainTokenStore.swift` — Keychain load/save/clear for access and refresh tokens (~620 tok)
- `ReminderScheduler.swift` — UserNotifications daily gentle reminder scheduler (~520 tok)
- `SyncEngine.swift` — SwiftData snapshot push to backend `/sync` (~900 tok)

## ios/DoNotNervous/Views/

- `DesignSystem.swift` — iOS colors, card/button components, rounded companion avatar (~960 tok)
- `RootTabView.swift` — Five-tab SwiftUI navigation: 今日, 任务, 心情, 金库, 复盘 (~250 tok)
- `TodayView.swift` — Daily raising hub with companion, quick task add, focus task completion (~1500 tok)
- `TaskListView.swift` — Native task add/list/complete/delete screen (~950 tok)
- `MoodView.swift` — Mood picker and recent mood history (~800 tok)
- `VaultView.swift` — Reward and cosmetic unlock screen (~1100 tok)
- `ReviewView.swift` — Simple local review stats and recent moods (~700 tok)
- `SettingsView.swift` — Optional login, reminder preferences, sync trigger (~1100 tok)

## ios/DoNotNervousTests/

- `GameEconomyTests.swift` — Swift unit tests for points, experience, level progress (~180 tok)
- `ReminderSchedulerTests.swift` — Swift unit tests for gentle reminder scheduling behavior (~420 tok)

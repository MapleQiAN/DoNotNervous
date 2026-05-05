# Roadmap: DoNotNervous

**Created:** 2026-04-28
**Milestone:** v1.0 — 反焦虑目标追踪 MVP
**Granularity:** Standard (5-8 phases)

## Phase 1: Foundation — Tasks & Data Layer

**Goal:** Working task management with local storage. User can create, complete, edit, delete tasks with categories and subtasks. Data persists in IndexedDB. First screen = task input, no login.

**Requirements:** TASK-01~08, DATA-01~05, ONBD-01~03

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, data layer & foundation components
- [x] 01-02-PLAN.md — Task management UI — input, list, item, categories, subtasks
- [x] 01-03-PLAN.md — Drag reorder, export/import & settings drawer

**Wave 1** *(foundation — no dependencies)*: Plan 01-01
**Wave 2** *(blocked on Wave 1 completion)*: Plan 01-02
**Wave 3** *(blocked on Wave 2 completion)*: Plan 01-03

**Success Criteria:**
- User can add a task and see it in a list within 5 seconds of opening the app
- Completing a task shows satisfying check animation (no points yet, just task done)
- Data survives page refresh
- Works on mobile and desktop browsers
- JSON export/import functional

**Depends on:** Nothing (foundation)

---

## Phase 2: Gamification Core — Points & Streaks

**Goal:** Complete task → earn points → see balance. Consecutive days tracked with streak freeze. Streak bonus multiplies points. All messaging is positive and encouraging.

**Requirements:** POINT-01~05, STRK-01~05

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Data layer: types, schema v2, point/streak domain functions & tests
- [x] 02-02-PLAN.md — Integration: completeTask atomic transaction, usePoints/useStreaks hooks, freeze auto-apply & tests
- [x] 02-03-PLAN.md — UI: PointBadge animation, TransactionPopover, StreakDisplay, Header integration & human verify

**Wave 1** *(data layer — no dependencies)*: Plan 02-01
**Wave 2** *(blocked on Wave 1)*: Plan 02-02
**Wave 3** *(blocked on Wave 2)*: Plan 02-03 (has human verification checkpoint)

**Success Criteria:**
- Completing a task awards points based on difficulty
- Point balance updates immediately with animation
- Streak counter shows consecutive active days
- Streak freeze is built-in from day one (not added later)
- No punitive messaging anywhere — all positive framing

**Depends on:** Phase 1

---

## Phase 3: Mood & Rewards

**Goal:** After completing a task, quick mood emoji + optional journal text. Custom reward shop: create rewards, save up points, redeem with celebration.

**Requirements:** REWD-01~05, MOOD-01~05

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Data layer: MoodEntry/Reward/Redemption types, Dexie v3, Zod schemas & tests
- [x] 03-02-PLAN.md — Integration: useMoodEntries/useRewards hooks, completeTask mood trigger, atomic redemption & tests
- [x] 03-03-PLAN.md — UI: MoodPicker popup, RewardShop page, MoodCalendar, confetti celebration & human verify

**Wave 1** *(data layer — no dependencies)*: Plan 03-01
**Wave 2** *(blocked on Wave 1)*: Plan 03-02
**Wave 3** *(blocked on Wave 2)*: Plan 03-03 (has human verification checkpoint)

**Success Criteria:**
- Mood picker appears after task completion (opt-in, < 3 seconds to use)
- Can write short journal note with mood
- User can create custom reward items with point costs
- Redeeming a reward deducts points and triggers confetti
- Reward and mood history viewable

**Depends on:** Phase 2 (needs points system)

---

## Phase 4: Mascot & Animations

**Goal:** Cute mascot character with animations (celebrate, encourage, idle). Rich micro-interactions: confetti on completion, smooth task reordering, celebration effects. Responsive design polish.

**Requirements:** MASC-01~05, DATA-06

**Plans:** 3 plans

Plans:
- [x] 04-01-PLAN.md — Mascot foundation: lottie-react, mascot store, celebrate utility, Mascot component with 4 Lottie states
- [x] 04-02-PLAN.md — Integration: wire mascot + confetti into completeTask, streak milestones, reward redemption, mood logging
- [x] 04-03-PLAN.md — UI polish: task micro-interactions, page transitions, responsive fixes, 5-tab mobile nav & human verify

**Wave 1** *(mascot foundation — no dependencies)*: Plan 04-01
**Wave 2** *(blocked on Wave 1)*: Plan 04-02
**Wave 3** *(blocked on Wave 2)*: Plan 04-03 (has human verification checkpoint)

**Success Criteria:**
- Mascot visible on main screen with idle breathing/bobbing animation
- Completing a task triggers mascot celebration + confetti
- Streak milestones trigger mascot encouragement
- All task list operations have smooth Framer Motion transitions
- Layout adapts cleanly to mobile screens

**Depends on:** Phase 1, 2, 3 (mascot reacts to all events)

---

## Phase 5: Summaries & Insights

**Goal:** Daily summary (tasks done, points, mood), weekly summary (trends, best day), mood trend chart over time. Pre-computed for instant loading.

**Requirements:** SUMM-01~04

**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — Data layer: DailySummary/WeeklySummary types, Dexie v4, summary computation logic & tests
- [x] 05-02-PLAN.md — Integration: useDailySummary/useWeeklySummary/useMoodChartDays hooks, eager refresh triggers wired into completeTask/createMoodEntry/redeemReward & tests
- [x] 05-03-PLAN.md — UI: SummaryPage with 3 tabs, DailySummary with arrow nav, WeeklySummary with best day override, MoodTrendChart (Recharts) & human verify

**Wave 1** *(data layer — no dependencies)*: Plan 05-01
**Wave 2** *(blocked on Wave 1)*: Plan 05-02
**Wave 3** *(blocked on Wave 2)*: Plan 05-03 (has human verification checkpoint)

**Success Criteria:**
- Daily summary loads instantly (pre-computed)
- Weekly summary shows mood trend, completion rate, highlight
- Recharts mood trend chart visualizes emotional patterns
- Summary data stays in sync with task/mood/points data

**Depends on:** All prior phases (aggregates data from all systems)

---

## Phase 6: Mount Gamification UI (Gap Closure — Blocker)

**Goal:** Mount PointBadge, StreakDisplay, and TransactionPopover in Header topbar. These Phase 2 components exist but are never rendered, blocking POINT-02, POINT-03, STRK-04.

**Requirements:** POINT-02, POINT-03, STRK-04

**Plans:** 1 plan

Plans:
- [x] 06-01-PLAN.md — Mount PointBadge, StreakDisplay, TransactionPopover in AppShell topbar

**Gap Closure:** Closes blocker from v1.0 audit — gamification UI not mounted

**Success Criteria:**
- PointBadge shows animated point count in Header
- StreakDisplay shows fire icon + count when streak > 0
- TransactionPopover opens on click showing last 10 transactions
- All three components visible on desktop and mobile layouts

**Depends on:** Phase 2 (gamification components), Phase 4 (responsive layout)

---

## Phase 7: Fix Mood Data Consistency (Gap Closure)

**Goal:** Fix MoodCalendar divergent mood score mapping and remove hardcoded fallback trend data. Consolidate to canonical MOOD_SCORE from domain/summary.ts.

**Requirements:** MOOD-04

**Plans:** 1 plan
Plans:
- [x] 07-01-PLAN.md — Replace divergent moodScore with canonical import, remove all hardcoded fallback data

**Gap Closure:** Closes warning from v1.0 audit — MoodCalendar uses divergent scores

**Success Criteria:**
- MoodCalendar imports and uses canonical MOOD_SCORE from domain/summary.ts
- No hardcoded fallback trend data or date labels
- Mood calendar and summary charts show consistent values

**Depends on:** Phase 3 (MoodCalendar), Phase 5 (MOOD_SCORE definition)

---

## Phase 8: Codebase Cleanup (Gap Closure)

**Goal:** Clean up orphaned domain module, fix test noise, and document placeholder Lottie status.

**Requirements:** None (tech debt)

**Plans:** 1 plan

Plans:
- [ ] 08-01-PLAN.md — Mock canvas-confetti globally, create Lottie placeholder docs, keep streaks.ts for v2

**Gap Closure:** Closes warnings from v1.0 audit — orphaned code and test noise

**Success Criteria:**
- domain/streaks.ts either imported by production code or removed
- canvas-confetti mocked in test setup to prevent unhandled exceptions
- Lottie placeholder status documented

**Depends on:** Phase 2 (streaks domain), Phase 4 (mascot/test setup)

---

## Progress

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1 | ✓ Complete | 3/3 | 100% |
| 2 | ✓ Complete | 3/3 | 100% |
| 3 | ✓ Complete | 3/3 | 100% |
| 4 | ✓ Complete | 3/3 | 100% |
| 5 | ✓ Complete | 3/3 | 100% |
| 6 | ✓ Complete | 1/1 | 100% |
| 7 | Complete | 1/1 | 100% |
| 8 | Planned | 0/1 | 0% |

**Overall:** 94% (17/18 plans complete)

---
*Roadmap created: 2026-04-28*
*Last updated: 2026-05-05*
*Phase 2 complete: 2026-04-29*
*Phase 2 planned: 2026-04-29*
*Phase 3 planned: 2026-05-04*
*Phase 3 complete: 2026-05-04*
*Phase 4 planned: 2026-05-04*
*Phase 4 plan 01 complete: 2026-05-04*
*Phase 4 complete: 2026-05-05*
*Phase 4 plan 02 complete: 2026-05-04*
*Phase 4 plan 03 auto tasks complete: 2026-05-05*
*Phase 5 planned: 2026-05-05*
*Phase 5 plan 01 complete: 2026-05-05*
*Phase 5 plan 02 complete: 2026-05-05*
*Phase 5 plan 03 complete: 2026-05-05*
*Phase 5 complete: 2026-05-05*
*Phase 6 planned: 2026-05-05*
*Phase 6 plan 01 complete: 2026-05-05*
*Phase 6 complete: 2026-05-05*
*Phase 7 planned: 2026-05-05*
*Phase 8 planned: 2026-05-05*

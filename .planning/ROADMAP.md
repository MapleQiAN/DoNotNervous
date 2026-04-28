# Roadmap: DoNotNervous

**Created:** 2026-04-28
**Milestone:** v1.0 — 反焦虑目标追踪 MVP
**Granularity:** Standard (5-8 phases)

## Phase 1: Foundation — Tasks & Data Layer

**Goal:** Working task management with local storage. User can create, complete, edit, delete tasks with categories and subtasks. Data persists in IndexedDB. First screen = task input, no login.

**Requirements:** TASK-01~08, DATA-01~05, ONBD-01~03

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

**Success Criteria:**
- Daily summary loads instantly (pre-computed)
- Weekly summary shows mood trend, completion rate, highlight
- Recharts mood trend chart visualizes emotional patterns
- Summary data stays in sync with task/mood/points data

**Depends on:** All prior phases (aggregates data from all systems)

---

## Progress

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1 | ○ | 0/- | 0% |
| 2 | ○ | 0/- | 0% |
| 3 | ○ | 0/- | 0% |
| 4 | ○ | 0/- | 0% |
| 5 | ○ | 0/- | 0% |

**Overall:** 0%

---
*Roadmap created: 2026-04-28*
*Last updated: 2026-04-28*

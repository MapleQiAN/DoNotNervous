# Requirements: DoNotNervous

**Defined:** 2026-04-28
**Core Value:** 完成任务 → 赚积分 → 奖励自己。正向激励循环，反焦虑，慢生活。

## v1 Requirements

### Task Management

- [x] **TASK-01**: User can create simple tasks with title and optional description
- [x] **TASK-02**: User can complete tasks with satisfying visual + animation feedback
- [x] **TASK-03**: User can edit and delete tasks
- [x] **TASK-04**: User can organize tasks with categories (tags)
- [x] **TASK-05**: User can create subtasks under a task
- [x] **TASK-06**: User can reorder tasks via drag and drop
- [x] **TASK-07**: User can assign difficulty level (easy/medium/hard) to tasks
- [x] **TASK-08**: User can archive completed tasks to keep list clean

### Points System

- [ ] **POINT-01**: User earns points on task completion (scaled by difficulty: easy=10, medium=25, hard=50)
- [ ] **POINT-02**: User sees current point balance prominently displayed
- [ ] **POINT-03**: User can view point transaction history (earned, spent, bonuses)
- [ ] **POINT-04**: Points use event-sourced ledger — every transaction is an immutable record
- [ ] **POINT-05**: Streak bonus multiplier adds extra points for consecutive days

### Rewards

- [ ] **REWD-01**: User can create custom rewards with name, description, and point cost
- [ ] **REWD-02**: User can redeem rewards when they have enough points
- [ ] **REWD-03**: User can edit and delete rewards
- [ ] **REWD-04**: Redemption triggers celebration animation
- [ ] **REWD-05**: User can view redemption history

### Mood Tracking

- [ ] **MOOD-01**: User can quickly select a mood emoji after completing a task (opt-in, not required)
- [ ] **MOOD-02**: User can optionally write short journal text (max 280 chars) with mood
- [ ] **MOOD-03**: Mood selection takes < 3 seconds (max 6-8 mood options)
- [ ] **MOOD-04**: User can view mood history timeline
- [ ] **MOOD-05**: User can log standalone mood entries (not tied to a task)

### Streak System

- [ ] **STRK-01**: Streaks track consecutive days with at least one completed task
- [ ] **STRK-02**: Streaks use period records (one row per day), not a simple counter
- [ ] **STRK-03**: Streak freeze protects streak on missed days (graceful, not punitive)
- [ ] **STRK-04**: All streak messaging is positive ("12 out of 14 days!" not "you broke your streak")
- [ ] **STRK-05**: Streak milestones trigger celebration animations

### Mascot & Animations

- [x] **MASC-01**: Cute mascot character displayed on main screen with idle animation
- [x] **MASC-02**: Mascot reacts to task completion with celebration animation
- [x] **MASC-03**: Mascot shows encouragement on streak milestones
- [x] **MASC-04**: Task completion triggers confetti effect
- [ ] **MASC-05**: Smooth UI transitions for task list changes (reorder, add, complete)

### Summaries

- [ ] **SUMM-01**: Daily summary shows tasks completed, points earned, dominant mood
- [ ] **SUMM-02**: Weekly summary shows trends, best day, mood trajectory
- [ ] **SUMM-03**: Mood trend chart visualizes mood changes over time
- [ ] **SUMM-04**: Summaries are pre-computed for instant loading

### Data & Infrastructure

- [x] **DATA-01**: All data stored locally in IndexedDB via Dexie.js
- [ ] **DATA-02**: No account or login required — works immediately on first visit
- [x] **DATA-03**: Data persists across page refreshes and browser restarts
- [x] **DATA-04**: User can export data as JSON (backup against Safari ITP data loss)
- [x] **DATA-05**: User can import data from JSON backup
- [ ] **DATA-06**: Responsive design works on mobile and desktop browsers

### Gentle Onboarding

- [x] **ONBD-01**: First screen is task input — start using in 5 seconds
- [x] **ONBD-02**: Features discovered progressively, no setup wizard
- [x] **ONBD-03**: No "what's your name?" or mandatory profile creation

## v2 Requirements

### Project Hierarchy

- **PROJ-01**: User can create projects with milestones and nested tasks
- **PROJ-02**: User can view tasks in project/kanban board layout
- **PROJ-03**: Projects have their own progress tracking

### Advanced Streak

- **STRK-06**: "Earn back" streak recovery — complete extra task to recover within 24h
- **STRK-07**: Streak calendar view showing monthly completion patterns

### Mascot Evolution

- **MASC-06**: Mascot customizable with unlockable cosmetics (bought with points)
- **MASC-07**: Multiple mascot animation states (celebrating, encouraging, idle, sleepy, proud)

### Social & Sync

- **SYNC-01**: Cloud sync for cross-device data
- **SYNC-02**: Optional account creation for sync
- **SOCIAL-01**: Share progress with friends (opt-in)

### PWA

- **PWA-01**: Installable as PWA on mobile home screen
- **PWA-02**: Full offline functionality via service worker

## Out of Scope

| Feature | Reason |
|---------|--------|
| Push notifications / reminders | Creates obligation anxiety — anti-anxiety design principle |
| Due dates / deadline enforcement | Deadlines create anxiety; not a work project tool |
| Leaderboards / competitive rankings | Comparison triggers anxiety; personal tool only |
| Negative consequences (HP loss, penalties) | Only positive reinforcement; never take away earned rewards |
| In-app purchases / premium currency | No commercial need; single currency earned only by doing tasks |
| Forced daily goals / minimum quotas | User sets their own pace; completing 1 task is celebrated |
| Complex analytics dashboard | Overwhelms casual users; simple visual summaries only |
| Account registration wall | Friction before value; privacy concern for wellness tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TASK-01 | Phase 1 | Complete |
| TASK-02 | Phase 1 | Complete |
| TASK-03 | Phase 1 | Complete |
| TASK-04 | Phase 1 | Complete |
| TASK-05 | Phase 1 | Complete |
| TASK-06 | Phase 1 | Complete |
| TASK-07 | Phase 1 | Complete |
| TASK-08 | Phase 1 | Complete |
| POINT-01 | Phase 2 | Pending |
| POINT-02 | Phase 2 | Pending |
| POINT-03 | Phase 2 | Pending |
| POINT-04 | Phase 2 | Pending |
| POINT-05 | Phase 2 | Pending |
| STRK-01 | Phase 2 | Pending |
| STRK-02 | Phase 2 | Pending |
| STRK-03 | Phase 2 | Pending |
| STRK-04 | Phase 2 | Pending |
| STRK-05 | Phase 2 | Pending |
| REWD-01 | Phase 3 | Pending |
| REWD-02 | Phase 3 | Pending |
| REWD-03 | Phase 3 | Pending |
| REWD-04 | Phase 3 | Pending |
| REWD-05 | Phase 3 | Pending |
| MOOD-01 | Phase 3 | Pending |
| MOOD-02 | Phase 3 | Pending |
| MOOD-03 | Phase 3 | Pending |
| MOOD-04 | Phase 3 | Pending |
| MOOD-05 | Phase 3 | Pending |
| MASC-01 | Phase 4 | Complete |
| MASC-02 | Phase 4 | Complete |
| MASC-03 | Phase 4 | Complete |
| MASC-04 | Phase 4 | Complete |
| MASC-05 | Phase 4 | Pending |
| SUMM-01 | Phase 5 | Pending |
| SUMM-02 | Phase 5 | Pending |
| SUMM-03 | Phase 5 | Pending |
| SUMM-04 | Phase 5 | Pending |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| DATA-06 | Phase 4 | Pending |
| ONBD-01 | Phase 1 | Complete |
| ONBD-02 | Phase 1 | Complete |
| ONBD-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-05-04 after Plan 04-02 completion*
*MASC-01 completed: 2026-05-04*

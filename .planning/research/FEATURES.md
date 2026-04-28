# Feature Landscape

**Domain:** Anti-anxiety gamified task management + mood tracking web app
**Researched:** 2026-04-28
**Competitors analyzed:** Finch, Habitica, LifeUp, Duolingo (streak patterns), Daylio, Fabulous, Superbetter

## Table Stakes

Features users expect from any gamified task/mood app. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Task creation and completion | Core value proposition -- without it, nothing works | Low | Must support check-off with satisfying feedback |
| Task list management (add, edit, delete, reorder) | Basic CRUD is non-negotiable for any task tool | Low | Inline editing preferred over modal forms |
| Points/currency earned on task completion | The "gamification" in gamified task app | Low | Immediate visual feedback on earn |
| Custom rewards with user-defined prices | Self-reward is the core loop; pre-set rewards feel patronizing | Med | Need reward creation, editing, "purchase" flow |
| Mood/emotion logging | Users of wellness apps expect some form of check-in | Low | Quick tap (emoji/tag-based), not lengthy forms |
| Streak tracking (consecutive days) | Standard across Finch, Habitica, Duolingo; users expect it | Med | Must include streak freeze to avoid anxiety |
| Visual progress feedback | Users need to see their effort accumulate | Med | Charts, counters, or progress bars |
| Responsive design (mobile + desktop) | Project constraint; users will access from varied devices | Med | Mobile-first, desktop-enhanced |
| Offline functionality (local-first storage) | Project constraint; privacy expectation in wellness tools | Med | IndexedDB with graceful degradation |
| Data persistence | Users expect their data to survive page refreshes | Low | IndexedDB handles this; localStorage as fallback |

## Differentiators

Features that set DoNotNervous apart from Finch/Habitica/LifeUp. Not expected, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Anti-anxiety streak design (streak freeze, no shame messaging) | Most streak systems create anxiety; this one explicitly does not. Replace "You broke your streak!" with "47 out of 50 days -- incredible!" | Med | Duolingo research shows streak freeze increases long-term engagement by 4-5%. Frame breaks as normal, not failure |
| Hierarchical tasks (simple todo / categorized+subtasks / project-milestone-task) | Finch has simple habits; Habitica has flat lists. Full hierarchy is rare and solves real planning needs without switching tools | High | Three levels of complexity to match user's cognitive load on any given day |
| Mascot companion with encouraging personality | Finch's bird is its #1 differentiator. DoNotNervous needs its own character that reacts to user actions with warmth, not pressure | High | Requires illustration/design asset creation. Can start simple (emoji-based) and evolve. Key: mascot celebrates effort, never guilt-trips |
| Task difficulty-based point scaling | Not all tasks are equal. Hard tasks should feel more rewarding without making easy tasks feel worthless | Med | User-assigned difficulty (easy/medium/hard) or automatic based on subtask count |
| Completion celebration animations | Micro-delight moments that make checking off a task feel genuinely rewarding | Med | Confetti, mascot reaction, sound (optional). Keep them skippable and not obnoxious |
| Daily/weekly summary with mood trends | Combines task completion data with mood data to show "your mood improves when you complete tasks" -- powerful positive reinforcement | Med | Charts showing mood over time, completion rate, points earned. Must be opt-in, not push-notification-based |
| Mood journaling (short text alongside emoji) | Goes beyond emoji-tap; lets users capture context. Daylio-style micro-journaling | Med | Optional field after mood selection. Never required. 280-char limit to keep it low-pressure |
| Gentle onboarding (no account required, no setup wizard) | Start using in 5 seconds. Finch requires an account. Immediate value delivery | Low | First screen = task input. Discover features progressively. No "what's your name?" flow |
| "Earn back" streak recovery | Instead of losing a streak forever, complete an extra task to recover it. Duolingo's research shows this maintains perceived value while being forgiving | Med | Window-limited (e.g., recover within 24 hours by completing a bonus task). Never paid -- always effort-based |

## Anti-Features

Features to explicitly NOT build. These would undermine the anti-anxiety core value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Punitive streak messaging ("You lost your streak!") | Triggers shame spiral, directly contradicts anti-anxiety mission. Duolingo research confirms shame-based messaging causes user abandonment | Celebrate what was achieved: "You completed 12 out of 14 days!" |
| Leaderboards / competitive rankings | Comparison is the thief of joy. Habitica's party/guild system can create pressure. This is a personal tool | Focus on personal-best tracking. "You did more this week than last week" |
| Push notifications / reminders to do tasks | Creates obligation anxiety. "You haven't done your tasks today" = guilt trip | Opt-in only. Even then, frame as "Time for a reward?" not "You haven't done X" |
| Account registration / login wall | Friction before value. Privacy concern. Anxious users may bounce at signup walls | Local-first, no account needed. Optional cloud sync in v2 |
| Due dates / deadline enforcement | Deadlines create anxiety. This is explicitly NOT a project management tool for work | Soft "suggested by" dates at most. Never show overdue warnings or red indicators |
| Social features (sharing, friends, comments) | Social comparison triggers anxiety. Project scope excludes it for v1 | Solo experience. Social sharing is v2 |
| In-app purchases / premium currency | Monetization creates haves/have-nots. Project has no commercial need | Single currency earned only through task completion |
| Negative consequences (HP loss, damage, penalties) | Habitica uses HP loss for missed dailies. This creates avoidance behavior and anxiety | Only positive reinforcement. Never take away what was earned |
| Complex statistics / analytics dashboard | Overwhelms casual users. "Am I doing enough?" analysis breeds anxiety | Simple, visual summaries. One-screen weekly recap with clear positive framing |
| Forced daily goals / minimum task quotas | "You must complete 5 tasks today" creates pressure and failure states | User sets their own pace. No minimums. Completing 1 task is celebrated as a win |

## Feature Dependencies

```
Task Management (core) ──────────────────────────────────────────────
  |
  +---> Points System (requires tasks to earn from)
  |       |
  |       +---> Custom Rewards (requires points to spend)
  |       |
  |       +---> Streak Tracking (requires daily task activity)
  |               |
  |               +---> Streak Freeze / Earn Back (requires streak system)
  |
  +---> Mood Logging (attached to task completion or standalone)
  |       |
  |       +---> Mood Trends / Charts (requires accumulated mood data)
  |
  +---> Mascot Reactions (triggered by task events)
  |
  +---> Daily/Weekly Summary (requires task + mood + points data)
```

**Critical path:** Task Management -> Points System -> Rewards. This is the minimum viable loop.

**Parallel tracks after core:**
- Track A: Mood system (logging -> trends -> summary integration)
- Track B: Streak system (tracking -> freeze -> earn-back)
- Track C: Mascot and celebrations (character -> reactions -> animations)

## Competitor Feature Matrix

| Feature | DoNotNervous (planned) | Finch | Habitica | LifeUp |
|---------|----------------------|-------|----------|--------|
| Core task management | Full hierarchy | Simple habits/dailies | Habits/dailies/todos | Tasks/habits/recurring |
| Virtual currency | Points (task-earned only) | Rainbow stones | Gold + Gems (premium) | Coins |
| Custom rewards | User-defined shop | Limited | User-defined | User-defined shop |
| Mood tracking | Emoji + short journal | Gentle check-ins | Not built-in | Not built-in |
| Streak system | With freeze + earn-back | Basic streaks | Basic streaks | Basic streaks |
| Mascot/companion | Custom character | Virtual pet bird | RPG avatar | Pet companions |
| Anti-anxiety design | Core principle | Yes (gentle) | No (RPG pressure) | Partially |
| Hierarchical tasks | 3 levels | No | Flat lists | Categories only |
| Account required | No | Yes | Yes | Optional |
| Offline-first | Yes (IndexedDB) | No | No | Partial |
| Negative consequences | None | None | HP loss, damage | None |
| Platform | Web (responsive) | Mobile native | Mobile + web | Mobile native |

## MVP Recommendation

Prioritize:
1. **Task management with completion flow** (table stakes -- nothing works without it)
2. **Points system with immediate feedback** (table stakes -- the gamification engine)
3. **Custom rewards shop** (table stakes -- closes the motivation loop)
4. **Quick mood emoji logging on task completion** (table stakes for wellness positioning)
5. **Simple streak counter with streak freeze** (anti-anxiety differentiator -- prove the concept)

Defer:
- **Mascot companion**: Requires design assets. Start with emoji-based celebrations, add mascot later. (Phase 2)
- **Hierarchical tasks (project/milestone)**: Start with flat lists + categories. Full hierarchy is complex and most users start simple. (Phase 2)
- **Daily/weekly summaries**: Requires accumulated data. Build after core tracking works for a week. (Phase 2)
- **Mood trend charts**: Requires accumulated mood data. (Phase 2)
- **Earn-back streak recovery**: Nice-to-have after basic streak works. (Phase 3)

## Key Design Principles (from research)

These principles surfaced repeatedly across anti-anxiety UX research and successful gamification products:

1. **Progress over perfection** -- Frame everything as "look how far you've come" never "you failed"
2. **Immediate positive feedback** -- Every task completion gets visible, satisfying acknowledgment
3. **Low-friction input** -- Mood logging in under 3 seconds. Task creation in under 5 seconds
4. **Forgiving defaults** -- Streak freezes active by default. No punishment for inactivity
5. **Predictable interactions** -- Consistent layout, no surprise UI changes. Anxiety reduces with familiarity
6. **Progressive disclosure** -- Show simple view first, reveal complexity on demand
7. **Optional depth** -- Power users can use projects/milestones; casual users can ignore them entirely

## Sources

- [UX Matters: Designing Calm -- UX Principles for Reducing Users' Anxiety](https://uxmatters.com/mt/archives/2025/05/designing-calm-ux-principles-for-reducing-users-anxiety.php) -- Calm design patterns: progressive disclosure, forgiving interactions, predictable feedback, tone of voice, environmental consistency. HIGH confidence.
- [UX Magazine: The Psychology of Hot Streak Game Design](https://uxmag.medium.com/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame-3dde153f239c) -- Duolingo's 600+ experiments on streaks. Streak freeze increased retention. Separating streaks from goals increased 7+ day streaks by 40%. Earn-back > pay-to-recover. HIGH confidence.
- [TetraLogical: Designing for People with Anxiety](https://tetralogical.com/blog/2026/03/10/designing-for-people-with-anxiety/) -- Keep interactions predictable. Familiar designs reduce anxiety. HIGH confidence.
- [Habitica Wiki: Gold Points](https://habitica.fandom.com/wiki/Gold_Points) -- Dual currency system, custom rewards pricing. MEDIUM confidence (wiki source).
- [Habitica Wiki: Sample Custom Rewards](https://habitica.fandom.com/wiki/Sample_Custom_Rewards) -- User-defined real-life rewards with gold pricing. MEDIUM confidence.
- [Boundev: UX Design for Mental Health Apps](https://www.boundev.com/blog/ux-design-for-mental-health-apps) -- Ethical frameworks, crisis-aware interactions, safe UI patterns. MEDIUM confidence.
- [PMC: Mobile Apps for Mood Tracking Analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC5977660/) -- Academic analysis of mood tracking features and engagement. HIGH confidence.
- [Reddit: I tested every type of habit tracker for 18 months](https://www.reddit.com/r/getdisciplined/comments/1saer6t/i_tested_every_type_of_habit_tracker_for_18/) -- Long-term user insight: gamification engagement can wear off; simplicity wins long-term. LOW confidence (single user anecdote).
- [Habi.app: 5 Best Finch Alternatives](https://habi.app/insights/finch-alternatives) -- Finch vs Habitica comparison. Finch = gentle wellness, Habitica = deep RPG gamification. MEDIUM confidence.
- [Finch App Store Reviews](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748) -- User sentiment: "emotionally intelligent," "surprisingly comforting," "non-judgmental." MEDIUM confidence.
- [UX Collective: Designing for Users with Anxiety](https://uxdesign.cc/designing-for-users-with-anxiety-bb5e12d652a3) -- Practical tips: reduce friction, avoid overwhelming elements, create safe spaces. MEDIUM confidence.
- [Medium: Mood Tracking App Product Backlog](https://medium.com/@elizavetapetrovskaia/example-product-backlog-for-a-mood-tracking-and-self-reflection-app-with-prioritized-user-stories-ee2bb564ae0b) -- Feature prioritization for mood tracking apps. MEDIUM confidence.

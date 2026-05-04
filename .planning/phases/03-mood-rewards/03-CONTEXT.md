# Phase 3: Mood & Rewards - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Two systems: (1) Mood tracking — quick emoji + optional journal text after task completion, standalone mood entries, mood history in calendar view. (2) Reward shop — create custom rewards with point costs, redeem with celebration animation, view redemption history. Point redemption creates `reward_spent` ledger entries (point sink per D-06 from Phase 2). All messaging positive, anti-anxiety framing.

</domain>

<decisions>
## Implementation Decisions

### Mood Picker UX
- **D-01:** Grid layout with fixed emoji options. 8 moods: 😊 😌 😐 😔 😰 😡 🥳 💪 (happy/calm/neutral/sad/anxious/angry/excited/strong). Positive-leaning set fits anti-anxiety theme.
- **D-02:** Auto-popup modal/bottom sheet after task completion. User can dismiss instantly (skip mood). Opt-in, not required.
- **D-03:** Journal text (max 280 chars) inline with mood picker — expandable textarea below emoji grid. One flow for mood + journal.
- **D-04:** Mood selection must take <3 seconds per MOOD-03. Grid makes single-tap selection instant.

### Reward Shop
- **D-05:** Card layout for reward items. Each card shows name, description, point cost, redeem button. Inline creation form (no separate page for creating).
- **D-06:** Separate rewards page accessible from navigation (not inside Settings drawer). Dedicated space for browsing, creating, and redeeming.
- **D-07:** Free input for point cost — user picks any number when creating a reward. Full flexibility.
- **D-08:** Reward redemption triggers: (1) confirmation dialog, (2) canvas-confetti celebration, (3) point deduction animation in header badge.

### History Views
- **D-09:** Mood history displayed in calendar view — each day colored/coded by dominant mood. Tapping a day shows mood entries for that day.
- **D-10:** Redemption history: list view showing redeemed rewards with date and point cost. Accessible from reward shop page.

### Standalone Mood Entries
- **D-11:** Per MOOD-05, user can log mood entries not tied to a task. Access from mood history page or floating action button. Same picker UI.

### Claude's Discretion
- Exact navigation pattern for rewards page (tab, bottom nav, header button) — pick most elegant.
- Mood picker animation style (Framer Motion, gentle spring).
- Calendar component implementation (build custom or use library).
- Reward card visual design (colors, spacing, hover states).
- Confirmation dialog copy (positive framing).
- Standalone mood entry trigger placement.
- Canvas-confetti configuration (particle count, spread, colors — warm/positive palette).
- Redemption history pagination or scroll.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 Outputs (integration points)
- `.planning/phases/02-gamification-core-points-streaks/02-01-SUMMARY.md` — Data layer summary (types, schema v2, domain functions)
- `.planning/phases/02-gamification-core-points-streaks/02-02-SUMMARY.md` — Integration summary (completeTask transaction, hooks)
- `.planning/phases/02-gamification-core-points-streaks/02-03-SUMMARY.md` — UI summary (PointBadge, StreakDisplay, Header)
- `.planning/phases/02-gamification-core-points-streaks/02-CONTEXT.md` — Phase 2 decisions (D-01 through D-09, point values, ledger pattern)

### Requirements
- `.planning/REQUIREMENTS.md` — REWD-01~05, MOOD-01~05 requirement definitions

### Project Decisions
- `.planning/STATE.md` — Key decisions (event-sourced ledger, anti-anxiety principles, point sink needed)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useTaskActions.ts` — `completeTask()` is the mood picker trigger point. Mood popup should appear after this completes.
- `src/hooks/usePoints.ts` — `usePointBalance()` reactive hook. Reward redemption deducts points via `reward_spent` ledger entry.
- `src/db/index.ts` — Dexie database. Needs new tables: `moodEntries`, `rewards`, `redemptions`. Schema version bump to v3.
- `src/domain/types.ts` — Type definition pattern. New types: MoodEntry, Reward, Redemption.
- `src/domain/task.ts` — Zod schema pattern. New schemas for mood/reward validation.
- `src/stores/uiStore.ts` — Zustand store. May need new state: active mood picker, reward page visibility.
- `src/components/common/Toast.tsx` — Celebration/reward feedback notifications.
- `src/components/layout/Header.tsx` — May need navigation element for rewards page.
- `src/components/gamification/PointBadge.tsx` — Animated point badge. Redemption should trigger badge animation (point decrease visual).
- `src/lib/date-utils.ts` — `toDayKey()`, `daysAgo()` for date normalization. Reuse for mood calendar.

### Established Patterns
- Dexie table registration: `this.version(N).stores({ tableName: 'key, indexedFields' })`
- Zustand store: `create<StoreType>()((set) => ({ ... }))` pattern
- Component pattern: TypeScript interface props, Tailwind v4 utility classes, Framer Motion for animations
- Hook pattern: `useLiveQuery` from dexie-react-hooks for reactive DB reads
- ID generation: `generateId()` from `src/lib/id.ts`
- Event-sourced ledger: point transactions are immutable records, never deleted

### Integration Points
- `completeTask()` in `useTaskActions.ts` — triggers mood picker popup
- `db.pointLedger` — reward redemption writes `reward_spent` type entry (point sink)
- `Header.tsx` — needs navigation to rewards page
- Dexie schema migration — version bump from 2 to 3, add `moodEntries`, `rewards`, `redemptions` tables
- `canvas-confetti` — needs npm install. Used for redemption celebration (REWD-04).

</code_context>

<specifics>
## Specific Ideas

- Mood picker: 3x3 grid (8 moods + 1 empty/dismiss), emoji buttons with subtle hover animation, warm color backgrounds per mood.
- Reward cards: rounded corners, soft shadow (consistent with Phase 1 Card pattern), point badge in corner, redeem button prominent when affordable.
- Confetti on redemption: warm color palette (amber, orange, cream) matching app theme — not generic rainbow.
- Calendar mood view: colored dots per day matching mood emoji, smooth month navigation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-mood-rewards*
*Context gathered: 2026-05-04*

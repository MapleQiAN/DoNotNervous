# Phase 2: Gamification Core - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete task → earn points → see balance. Consecutive days tracked with streak freeze. Streak bonus multiplies points. All messaging is positive and encouraging. Points stored as event-sourced ledger (immutable records). Streaks stored as period records (one row per day). No punitive messaging anywhere.

</domain>

<decisions>
## Implementation Decisions

### Point Balance Display
- **D-01:** Header badge in existing Header component — icon (Star/Zap) + animated count-up number. Always visible. Extends Phase 1 Header.
- **D-02:** Badge style: icon + number (e.g. "⭐ 150"). Compact, clear, delightful on earn.

### Transaction History UX
- **D-03:** Click header badge → popover shows last 10 transactions. Quick glance, zero navigation.
- **D-04:** Each transaction row shows: point amount (+10), reason ("Completed: Walk dog"), relative time ("2h ago"). Compact, scannable.

### Streak Bonus Formula
- **D-05:** 3-tier multiplier system: 1-6 days = 1x (no bonus), 7-13 days = 1.5x, 14-29 days = 2x, 30+ days = 3x.
- **D-06:** No cap — 30+ day streaks keep earning 3x. Anti-inflation handled by reward sinks in Phase 3.

### Streak Freeze Mechanics
- **D-07:** 2 freezes always available. Resets after use (back to 2). Simple, predictable, generous.
- **D-08:** Auto-apply — when a day is missed, freeze activates automatically. User gets gentle notification: "Your streak is safe! (1 freeze remaining)". Zero friction, zero anxiety.

### Point Values (locked from REQUIREMENTS.md)
- **D-09:** easy = 10pts, medium = 25pts, hard = 50pts (POINT-01).

### Claude's Discretion
- Exact icon choice (Star vs Zap) — pick what fits the warm aesthetic.
- Popover animation style — use Framer Motion, keep it gentle.
- Notification for freeze usage — Toast component from Phase 1.
- Point ledger record schema — follow event-sourced pattern from STATE.md decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Outputs (integration points)
- `.planning/phases/01-foundation-tasks-data-layer/01-01-SUMMARY.md` — Phase 1 plan 1 summary (data layer, components)
- `.planning/phases/01-foundation-tasks-data-layer/01-02-SUMMARY.md` — Phase 1 plan 2 summary (task UI)
- `.planning/phases/01-foundation-tasks-data-layer/01-03-SUMMARY.md` — Phase 1 plan 3 summary (drag, export, settings)

### Requirements
- `.planning/REQUIREMENTS.md` — POINT-01~05, STRK-01~05 requirement definitions

### Project Decisions
- `.planning/STATE.md` — Key decisions section (event-sourced ledger, period records, anti-anxiety principles)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useTaskActions.ts` — `completeTask()` is the point-earning trigger. Points awarded when task status changes to 'completed'.
- `src/db/index.ts` — Dexie database. Will need new tables: `pointLedger` and `streakRecords`. Schema version bump required.
- `src/stores/uiStore.ts` — Zustand store pattern. Point balance could be a derived/computed value from ledger, or cached in a store.
- `src/components/common/Toast.tsx` — Use for freeze activation notifications and point earn feedback.
- `src/components/layout/Header.tsx` — Extend with point balance badge. Already has settings gear.
- `src/domain/types.ts` — Type definition pattern. New types needed: PointLedgerEntry, StreakRecord.
- `src/domain/task.ts` — Zod schema pattern. New schemas needed for point/streak validation.

### Established Patterns
- Dexie table registration: `this.version(N).stores({ tableName: 'key, indexedField1, indexedField2' })`
- Zustand store: `create<StoreType>()((set) => ({ ... }))` pattern
- Component pattern: TypeScript interface props, Tailwind v4 utility classes, Framer Motion for animations
- Hook pattern: `useLiveQuery` from dexie-react-hooks for reactive DB reads
- ID generation: `generateId()` from `src/lib/id.ts`

### Integration Points
- `completeTask()` in `useTaskActions.ts` — must trigger point ledger write + streak check
- `Header.tsx` — must render point balance badge
- Dexie schema migration — version bump from 1 to 2, add `pointLedger` and `streakRecords` tables
- Point balance computed from `db.pointLedger` sum — use `useLiveQuery` for reactivity

</code_context>

<specifics>
## Specific Ideas

- Point earn animation: count-up number in header badge when points are awarded (Framer Motion spring).
- Streak counter: show in header or near task list — e.g. "🔥 7 day streak" with fire emoji.
- Streak milestone celebrations at 7, 14, 30 days (STRK-05).
- Freeze notification uses existing Toast component with positive framing.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-gamification-core-points-streaks*
*Context gathered: 2026-04-29*

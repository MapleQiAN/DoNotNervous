# Phase 4: Mascot & Animations - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Animated cat mascot character with 4 Lottie states (idle, celebrate, encourage, sleepy). Floating bottom-right corner, always visible. Confetti celebrations triggered by task completion, streak milestones, reward redemption, and mood logging — all originating from mascot position. Micro-interaction polish for task list transitions and page navigation. Responsive design fixes: 5-tab mobile nav, fluid grids, touch targets, responsive images and fonts. Requirements MASC-01~05, DATA-06.

</domain>

<decisions>
## Implementation Decisions

### Mascot Character & Animation
- **D-01:** Cat/kitten mascot — warm, comforting, expressive. Fits anti-anxiety theme.
- **D-02:** Lottie animations (`.json` files from LottieFiles marketplace). STATE.md already specifies Lottie for mascot.
- **D-03:** 4 animation states: idle/breathing (subtle blink + tail wag), celebrate (jump/spin on task complete), encourage (wave/sign on streak milestones), sleepy/napping (no tasks done today).
- **D-04:** Floating bottom-right corner of workspace. Always visible across all pages. Desktop + mobile.
- **D-05:** Size: Claude discretion — small-medium (~80-100px). Compact enough not to block content.
- **D-06:** Tap interaction: speech bubble with random encouraging message (Chinese + emoji mix). Tap again to dismiss.

### Celebration Triggers & Effects
- **D-07:** Confetti on 4 events: task complete, streak milestone (7/14/30 days), reward redemption (existing), mood logging.
- **D-08:** Scaled intensity per event: task=mild(30 particles), mood=gentle(20), redemption=medium(90), streak=big(120).
- **D-09:** Confetti origin: always from mascot position (bottom-right). Ties mascot to celebration moment.
- **D-10:** Speech bubble content: Chinese encouragement phrases + emoji. e.g. "你今天好棒！ 🎉", "慢慢来～ 🌿", "又完成一个！ 💪". Warm, anti-anxiety tone.

### Micro-interaction Polish
- **D-11:** Task add: spring physics scale+fade animation (enhance existing AnimatePresence).
- **D-12:** Task complete: checkbox sweep animation + strikethrough fade + row dims.
- **D-13:** Task delete: slide out with opacity fade.
- **D-14:** Drag reorder: lift shadow + smooth gap animation (enhance @dnd-kit visual feedback).
- **D-15:** Subtle page transitions on navigation — fade/slide via Framer Motion AnimatePresence.

### Responsive Design Fixes
- **D-16:** Add 5th tab (数据复盘/Data) to mobile bottom navigation. All 5 pages accessible on mobile.
- **D-17:** Fluid grid columns — replace fixed `260px` sidebar and `340px` right column with responsive units. Stack on mobile.
- **D-18:** Touch target sizing — ensure all interactive elements >= 44px minimum.
- **D-19:** Responsive font scaling below 640px.
- **D-20:** Responsive images — fixed-size images use `max-width: 100%` + `aspect-ratio`.

### Claude's Discretion
- Exact mascot size (80-100px range)
- LottieFiles cat animation selection (idle, celebrate, encourage, sleepy states)
- Page transition direction/duration
- Exact spring physics values for task animations
- Speech bubble message pool (warm Chinese phrases + emoji)
- Confetti color palette (reuse warm palette from Phase 3: amber, orange, cream, sage)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 Outputs (integration points)
- `.planning/phases/03-mood-rewards/03-CONTEXT.md` — Phase 3 decisions (confetti palette, mood picker, reward shop)
- `.planning/phases/03-mood-rewards/03-03-SUMMARY.md` — UI summary (RewardShop, MoodCalendar, confetti)

### Phase 2 Outputs (integration points)
- `.planning/phases/02-gamification-core-points-streaks/02-CONTEXT.md` — Phase 2 decisions (point values, streak milestones)
- `.planning/phases/02-gamification-core-points-streaks/02-03-SUMMARY.md` — UI summary (PointBadge, StreakDisplay)

### Requirements
- `.planning/REQUIREMENTS.md` — MASC-01~05, DATA-06 requirement definitions

### Project Decisions
- `.planning/STATE.md` — Key decisions (Lottie for mascot, Framer Motion for UI, canvas-confetti for celebrations, anti-anxiety principles)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/rewards/RewardShop.tsx` — Existing `canvas-confetti` usage. Extract confetti trigger into shared utility (e.g. `src/lib/celebrate.ts`).
- `src/components/tasks/TaskList.tsx` — Uses AnimatePresence + motion for task list. Enhance existing transitions.
- `src/components/tasks/TaskItem.tsx` — Task row component. Completion animation target.
- `src/components/gamification/PointBadge.tsx` — Framer Motion animated badge. Pattern reference.
- `src/components/layout/Header.tsx` — Sidebar + bottom tab nav. Add 5th tab, adjust mobile layout.
- `src/components/layout/AppShell.tsx` — Page routing. Add page transition wrapper.
- `src/hooks/useStreaks.ts` — Streak milestone detection. Hook into mascot encourage state + confetti trigger.
- `src/hooks/useTaskActions.ts` — `completeTask()` — hook into mascot celebrate state + confetti trigger.
- `src/stores/uiStore.ts` — May need mascot state (current animation, speech bubble visibility).
- `src/index.css` — Responsive styles. Grid columns, media queries, touch targets need updates.

### Established Patterns
- Framer Motion: `AnimatePresence` + `motion.div` with `initial/animate/exit` props
- Zustand store: `create<StoreType>()((set) => ({ ... }))` for mascot state
- Dexie hooks: `useLiveQuery` for reactive data reads
- Canvas-confetti: `confetti({ particleCount, spread, origin, colors })` API
- Tailwind v4: utility classes + `@theme` custom properties
- Component pattern: TypeScript interface props, CSS classes in `index.css`

### Integration Points
- `completeTask()` in `useTaskActions.ts` → trigger mascot celebrate + confetti
- `useStreaks.ts` streak milestone check → trigger mascot encourage + big confetti
- Reward redemption in `RewardShop.tsx` → already has confetti, add mascot celebrate
- Mood logging in `MoodCalendar.tsx` / `MoodPicker.tsx` → trigger mascot celebrate + gentle confetti
- `AppShell.tsx` → wrap page content in AnimatePresence for transitions
- `Header.tsx` → add 5th tab for mobile nav
- `index.css` → responsive grid, font, touch target fixes
- New: `lottie-react` dependency needed for Lottie playback
- New: Lottie `.json` animation files in `public/animations/` or `src/assets/`

</code_context>

<specifics>
## Specific Ideas

- Mascot cat floating bottom-right: position `fixed` or `absolute` within app-frame. Z-index above content but below modals.
- Speech bubble: tail/bubble shape pointing to cat. Auto-dismiss after 3 seconds or tap-to-dismiss.
- Confetti warm palette (locked from Phase 3): `['#f7b955', '#f08a55', '#fbd58b', '#4f915b']`
- Streak milestones at 7, 14, 30 days (from Phase 2 D-05 tier system).
- Task complete confetti: mild burst, doesn't overwhelm — encourages repeated task completion.
- Sleepy state triggers when: no tasks completed today. Switches to idle once first task done.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-mascot-animations*
*Context gathered: 2026-05-04*

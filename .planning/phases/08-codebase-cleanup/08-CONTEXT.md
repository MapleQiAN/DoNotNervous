# Phase 8: Codebase Cleanup - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Tech debt cleanup — remove test noise, document placeholder status, decide fate of orphaned domain module. No new features. Three scoped items from v1.0 audit.

</domain>

<decisions>
## Implementation Decisions

### Orphaned Streaks Module
- **D-01:** Keep `src/domain/streaks.ts` and its test — reserved for v2 streak features (STRK-06 earn-back recovery, STRK-07 calendar view). File is not deleted.

### Canvas-Confetti Test Noise
- **D-02:** Mock canvas-confetti globally in `src/test-setup.ts` via `vi.mock('canvas-confetti')`. Single fix covers all test files. (Claude discretion)

### Lottie Placeholder Documentation
- **D-03:** Create separate documentation file for Lottie placeholder status (not inline comment). Documents which animations are placeholders and what real assets should replace them. (Claude picks filename — e.g., `src/components/mascot/ANIMATIONS.md` or similar)

### Claude's Discretion
- Exact mock implementation for canvas-confetti in test setup
- Documentation file location and format for Lottie placeholder status

</decisions>

<canonical_refs>
## Canonical References

### Test Infrastructure
- `src/test-setup.ts` — current test setup (minimal: jest-dom + fake-indexeddb)
- `vitest.config.ts` — references test-setup.ts in setupFiles

### Orphaned Module
- `src/domain/streaks.ts` — streak milestone constants and helpers
- `src/domain/__tests__/streaks.test.ts` — only consumer of streaks.ts

### Mascot & Animations
- `src/components/mascot/Mascot.tsx` — uses Lottie with placeholder JSON
- `src/lib/celebrate.ts` — canvas-confetti integration for celebrations

### Project Context
- `.planning/REQUIREMENTS.md` — v2 requirements STRK-06, STRK-07 reference streaks domain

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/test-setup.ts`: Global setup file — add confetti mock here
- `src/domain/streaks.ts`: Contains `STREAK_MILESTONES` constants and `getStreakMilestone()` — may be reused in Phase 2 streak hooks or v2 features

### Established Patterns
- Vitest with happy-dom environment
- Canvas-confetti errors in tests are from celebrate.ts being imported transitively
- No `.lottie` animation files exist — Mascot uses inline placeholder data

### Integration Points
- `celebrate.ts` imports canvas-confetti — mock must return a no-op function
- Test setup runs before all test files — single mock covers everything

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard cleanup approach.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 8-Codebase Cleanup*
*Context gathered: 2026-05-05*
